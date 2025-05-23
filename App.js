// =========================
// App.js - React Native (adaptado para Firebase Backend)
// =========================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Alert,
  Platform
} from 'react-native';

export default function App() {
  const [nome, setNome] = useState('');
  const [fila, setFila] = useState([]);

  // Se estiver testando no celular físico, substitua localhost pelo IP da sua máquina
  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/fila' : 'http://localhost:3000/fila';

  const carregarFila = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setFila(data);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const entrarNaFila = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite seu nome.');
      return;
    }

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });
      setNome('');
      carregarFila();
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
    }
  };

  useEffect(() => {
    carregarFila();
    const intervalo = setInterval(carregarFila, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(intervalo);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Fila Inteligente</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu nome"
        value={nome}
        onChangeText={setNome}
      />

      <Button title="Entrar na fila" onPress={entrarNaFila} />

      <Text style={styles.subtitulo}>Fila Atual:</Text>
      <FlatList
        data={fila}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <Text>{index + 1}. {item.nome} (às {item.horaEntrada})</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitulo: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#888',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
});

/*
README.md (instruções para iniciar o projeto)

# Fila Inteligente

## Pré-requisitos
- Node.js instalado
- Expo CLI instalado (npm install -g expo-cli)
- Firebase configurado com Realtime Database
- Chave privada do Firebase salva como `firebaseServiceAccountKey.json`

## Como iniciar o backend (Node.js)
1. Navegue até a pasta onde está o arquivo `server.js`
2. Instale as dependências (uma vez):
   npm install express cors firebase-admin
3. Inicie o servidor:
   node server.js

> O backend ficará disponível em http://localhost:3000

## Como iniciar o app (React Native com Expo)
1. Navegue até a pasta do app
2. Rode:
   npm start

### Emulador Android:
- Use `10.0.2.2` como endereço do backend

### Celular físico:
- Use o IP local da sua máquina (ex: 192.168.0.105)

### Web:
- Pode usar `localhost`, mas verifique se não há bloqueio de CORS

*/
