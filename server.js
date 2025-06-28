// =================================================================
// ARQUIVO: server.js
// DESCRIÇÃO: Versão com logs para depurar a rota de estatísticas.
// =================================================================
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!serviceAccount.project_id) {
  console.error("ERRO CRÍTICO: Credenciais do Firebase não encontradas.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://filla-inteligente-trab-default-rtdb.firebaseio.com/`
});

const db = getDatabase();
const filaRef = db.ref('fila');
const logRef = db.ref('logAtendimentos');

// ... (as rotas GET /fila, POST /fila, e DELETE /fila/:id permanecem as mesmas) ...
app.get('/fila', async (req, res) => {
  try {
    const snapshot = await filaRef.once('value');
    const fila = snapshot.val() || {};
    const lista = Object.entries(fila).map(([id, dados]) => ({ id, ...dados }));
    res.status(200).json(lista);
  } catch (error) { res.status(500).json({ erro: 'Não foi possível buscar a fila.' }); }
});
app.post('/fila', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
      return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
    }
    const novaPessoa = { nome: nome.trim(), horaEntrada: Date.now() };
    const novoRegistro = await filaRef.push(novaPessoa);
    res.status(201).json({ id: novoRegistro.key, ...novaPessoa });
  } catch (error) { res.status(500).json({ erro: 'Não foi possível adicionar na fila.' }); }
});
app.delete('/fila/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ erro: 'ID não fornecido.' });
    const itemRef = filaRef.child(id);
    const snapshot = await itemRef.once('value');
    const atendido = snapshot.val();
    if (atendido) {
      const tempoServico = Date.now() - atendido.horaEntrada;
      await logRef.push({
        nome: atendido.nome, horaEntrada: atendido.horaEntrada,
        horaAtendimento: Date.now(), tempoServico: tempoServico
      });
      await itemRef.remove();
      res.status(200).json({ mensagem: 'Atendido e registrado com sucesso' });
    } else {
      res.status(404).json({ erro: 'Usuário não encontrado na fila.' });
    }
  } catch (error) { res.status(500).json({ erro: 'Não foi possível atender o usuário.' }); }
});

// Rota de Estatísticas com LOGS
app.get('/fila/stats', async (req, res) => {
  console.log("\n[BACKEND] Rota /fila/stats foi chamada."); // LOG
  try {
    const logsSnapshot = await logRef.once('value');
    const logs = logsSnapshot.val() || {};
    const todosAtendimentos = Object.values(logs);

    let atendidosHoje = 0;
    let tempoMedioMs = 0;
    let horaPico = -1;
    let atendimentosPorHora = {};
    
    if (todosAtendimentos.length > 0) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const atendimentosDeHojeFiltrados = todosAtendimentos.filter(log => log.horaAtendimento && log.horaAtendimento >= hoje.getTime());
      atendidosHoje = atendimentosDeHojeFiltrados.length;

      const ultimosAtendimentos = todosAtendimentos.filter(a => typeof a.tempoServico === 'number').slice(-20);
      if (ultimosAtendimentos.length > 0) {
        const totalTempoServico = ultimosAtendimentos.reduce((acc, curr) => acc + curr.tempoServico, 0);
        tempoMedioMs = totalTempoServico / ultimosAtendimentos.length;
      }

      if (atendidosHoje > 0) {
        atendimentosDeHojeFiltrados.forEach(log => {
          const hora = new Date(log.horaAtendimento).getHours();
          atendimentosPorHora[hora] = (atendimentosPorHora[hora] || 0) + 1;
        });
        let maxAtendimentos = 0;
        for (const hora in atendimentosPorHora) {
          if (atendimentosPorHora[hora] > maxAtendimentos) {
            maxAtendimentos = atendimentosPorHora[hora];
            horaPico = parseInt(hora);
          }
        }
      }
    }
    
    const graficoData = Array.from({ length: 24 }, (_, i) => ({
      hora: `${String(i).padStart(2, '0')}:00`,
      count: atendimentosPorHora[i] || 0,
    })).filter(item => atendidosHoje > 0);

    const statsPayload = {
      atendidosHoje: atendidosHoje,
      tempoMedioAtendimentoMs: tempoMedioMs,
      horaDePico: horaPico,
      atendimentosPorHora: graficoData
    };

    console.log("[BACKEND] Enviando estatísticas:", statsPayload); // LOG ADICIONADO
    
    res.json(statsPayload);

  } catch (error) {
    console.error("[BACKEND] Erro em GET /fila/stats:", error); // LOG
    res.status(500).json({ erro: 'Não foi possível calcular estatísticas.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando com sucesso em http://localhost:${PORT}`);
});
