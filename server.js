// =========================
// Backend: server.js (Node.js + Express)
// =========================

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let fila = [];

// Rota para listar todas as pessoas na fila
app.get('/fila', (req, res) => {
  res.json(fila);
});

// Rota para adicionar uma pessoa à fila
app.post('/fila', (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

  const pessoa = {
    id: Date.now(),
    nome,
    horaEntrada: new Date().toLocaleTimeString(),
  };

  fila.push(pessoa);
  res.status(201).json(pessoa);
});

// Rota para remover uma pessoa da fila pelo id
app.delete('/fila/:id', (req, res) => {
  const id = parseInt(req.params.id);
  fila = fila.filter(p => p.id !== id);
  res.status(200).json({ mensagem: 'Removido com sucesso' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
