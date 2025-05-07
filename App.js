import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Alert,
} from 'react-native';

export default function App() {
  const [nome, setNome] = useState('');
  const [fila, setFila] = useState([]);

  const API_URL = 'http://localhost:3000/fila'; // Altere para seu IP se for testar no celular

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
        body: JSON.stringify({ nome }),
      });
      setNome('');
      carregarFila();
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
    }
  };

  useEffect(() => {
    carregarFila();
    const intervalo = setInterval(carregarFila, 5000); // Atualiza a fila a cada 5s
    return () => clearInterval(intervalo); // Limpa o intervalo
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
