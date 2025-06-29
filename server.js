// =================================================================
// ARQUIVO: server.js
// VERSÃO: Final e Definitiva (com verificação de telefone)
// =================================================================

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Firebase
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

if (!serviceAccount.project_id || !accountSid || !authToken || !twilioPhoneNumber) {
  console.error("ERRO CRÍTICO: Credenciais do Firebase ou Twilio não encontradas. Verifique seu arquivo .env");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = getDatabase();
const filaRef = db.ref('fila');
const logRef = db.ref('logAtendimentos');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function enviarSMS(para, corpo) {
  try {
    await twilioClient.messages.create({ body: corpo, from: twilioPhoneNumber, to: para });
    console.log(`✅ SMS enviado com sucesso para ${para}`);
  } catch (error) {
    console.error(`❌ Falha ao enviar SMS para ${para}:`, error.message);
  }
}

async function getStats(includeChartData = false) {
  let atendidosHoje = 0;
  let tempoMedioMs = 0;
  let horaPico = -1;
  let atendimentosPorHora = {};

  const logsSnapshot = await logRef.once('value');
  const logs = logsSnapshot.val() || {};
  const todosAtendimentos = Object.values(logs);

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

    if (includeChartData && atendidosHoje > 0) {
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

  const payload = {
    atendidosHoje,
    tempoMedioAtendimentoMs: tempoMedioMs
  };

  if (includeChartData) {
    payload.horaDePico = horaPico;
    payload.atendimentosPorHora = Array.from({ length: 24 }, (_, i) => ({
      hora: `${String(i).padStart(2, '0')}:00`,
      count: atendimentosPorHora[i] || 0,
    })).filter(item => atendidosHoje > 0);
  }

  return payload;
}

// --- ROTAS ---

// POST /fila
app.post('/fila', async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });

    const novaPessoa = {
      nome: nome.trim(),
      telefone: telefone ? telefone.trim() : null,
      horaEntrada: Date.now()
    };

    const novoRegistro = await filaRef.push(novaPessoa);

    const [filaSnapshot, stats] = await Promise.all([
      filaRef.orderByChild('horaEntrada').once('value'),
      getStats()
    ]);

    const filaArray = Object.values(filaSnapshot.val() || {});
    const minhaPosicao = filaArray.length;
    const tempoEsperaMin = Math.ceil((stats.tempoMedioAtendimentoMs * (minhaPosicao - 1)) / 60000);

    if (novaPessoa.telefone) {
      const mensagem = `Fila Inteligente: Olá, ${novaPessoa.nome}! Você entrou na fila. Posição: ${minhaPosicao}º. Espera estimada: ${tempoEsperaMin} min.`;
      await enviarSMS(novaPessoa.telefone, mensagem);
    } else {
      console.warn(`⚠️ Nenhum telefone fornecido para ${novaPessoa.nome}, SMS não enviado.`);
    }

    res.status(201).json({ id: novoRegistro.key, ...novaPessoa });
  } catch (error) {
    console.error("Erro em POST /fila:", error);
    res.status(500).json({ erro: 'Não foi possível adicionar na fila.' });
  }
});

// DELETE /fila/:id
app.delete('/fila/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ erro: 'ID não fornecido.' });

    const itemRef = filaRef.child(id);
    const snapshot = await itemRef.once('value');
    const atendido = snapshot.val();

    if (atendido) {
      await logRef.push({
        nome: atendido.nome,
        horaAtendimento: Date.now(),
        tempoServico: Date.now() - atendido.horaEntrada
      });
      await itemRef.remove();

      const [filaSnapshot, stats] = await Promise.all([
        filaRef.orderByChild('horaEntrada').once('value'),
        getStats()
      ]);

      const listaFila = Object.entries(filaSnapshot.val() || {}).map(([id, dados]) => ({ id, ...dados }));

      for (let i = 0; i < listaFila.length; i++) {
        const pessoa = listaFila[i];
        if (!pessoa.telefone) {
          console.warn(`⚠️ Sem telefone para ${pessoa.nome}, SMS ignorado.`);
          continue;
        }

        const posicao = i + 1;
        const tempoEsperaMin = Math.ceil((stats.tempoMedioAtendimentoMs * i) / 60000);
        let mensagem = posicao === 1
          ? `Fila Inteligente: Prepare-se, ${pessoa.nome}! Você é o próximo da fila.`
          : `Fila Inteligente: A fila andou! Sua nova posição é ${posicao}º. Espera estimada: ${tempoEsperaMin} min.`;

        await enviarSMS(pessoa.telefone, mensagem);
        await delay(500);
      }

      res.status(200).json({ mensagem: 'Atendido e notificações enviadas.' });
    } else {
      res.status(404).json({ erro: 'Usuário não encontrado na fila.' });
    }
  } catch (error) {
    console.error("Erro ao atender:", error);
    res.status(500).json({ erro: 'Não foi possível atender o usuário.' });
  }
});

// GET /fila/stats
app.get('/fila/stats', async (req, res) => {
  try {
    const stats = await getStats(true);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar estatísticas.' });
  }
});

// GET /fila
app.get('/fila', async (req, res) => {
  try {
    const snapshot = await filaRef.orderByChild('horaEntrada').once('value');
    const fila = snapshot.val() || {};
    const lista = Object.entries(fila).map(([id, dados]) => ({ id, ...dados }));
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ erro: 'Não foi possível buscar a fila.' });
  }
});

// INICIA O SERVIDOR
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando com sucesso e configurado para usar o Twilio em http://localhost:${PORT}`);
});
