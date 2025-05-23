const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccountKey.json'); // Caminho para sua chave

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://filla-inteligente-trab-default-rtdb.firebaseio.com/' // substitua pelo seu databaseURL real
});

const db = getDatabase();
const filaRef = db.ref('fila');

app.use(cors());
app.use(express.json());

// Rota para listar todas as pessoas na fila
app.get('/fila', async (req, res) => {
  try {
    const snapshot = await filaRef.once('value');
    const fila = snapshot.val() || {};
    const lista = Object.entries(fila).map(([id, dados]) => ({ id, ...dados }));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fila' });
  }
});

// Rota para adicionar uma pessoa à fila
app.post('/fila', async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

  const novaPessoa = {
    nome,
    horaEntrada: new Date().toLocaleTimeString(),
  };

  try {
    const novoRegistro = await filaRef.push(novaPessoa);
    res.status(201).json({ id: novoRegistro.key, ...novaPessoa });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao adicionar na fila' });
  }
});

// Rota para remover uma pessoa da fila pelo id
app.delete('/fila/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await filaRef.child(id).remove();
    res.status(200).json({ mensagem: 'Removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover da fila' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
