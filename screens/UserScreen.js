import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

export default function UserScreen({ onLogout }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [userInQueueInfo, setUserInQueueInfo] = useState(null);
  const [userPosition, setUserPosition] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  useEffect(() => {
    if (!userInQueueInfo) return;

    let tempoMedioMs = 300000;

    const fetchStats = async () => {
      try {
        const statsRes = await fetch(`${API_URL}/fila/stats`);
        const stats = await statsRes.json();
        if (stats.tempoMedioAtendimentoMs > 0) {
          tempoMedioMs = stats.tempoMedioAtendimentoMs;
        }
      } catch (error) {
        console.error("Erro ao buscar stats, usando tempo padrão.", error);
      }
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 30000);

    const filaRef = ref(database, 'fila');
    const unsubscribe = onValue(filaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaOrdenada = Object.entries(data)
          .map(([id, dados]) => ({ id, ...dados }))
          .sort((a, b) => a.horaEntrada - b.horaEntrada);

        const myIndex = listaOrdenada.findIndex(item => item.id === userInQueueInfo.id);

        if (myIndex !== -1) {
          const newPosition = myIndex + 1;
          setUserPosition(newPosition);

          const pessoasNaFrente = newPosition - 1;
          const tempoTotalMs = tempoMedioMs * pessoasNaFrente;
          const tempoTotalMinutos = Math.ceil(tempoTotalMs / 60000);
          setTempoEstimado(tempoTotalMinutos);

        } else {
          Alert.alert("Você foi atendido!", "Sua vez na fila chegou.");
          setUserInQueueInfo(null);
        }
      } else {
        setUserInQueueInfo(null);
      }
    });

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [userInQueueInfo]);

  const entrarNaFila = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome.');
      return;
    }

    let telefoneFormatado = telefone.trim();
    if (telefoneFormatado) {
      telefoneFormatado = telefoneFormatado.replace(/\D/g, ''); // remove tudo que não for número
      if (!telefoneFormatado.startsWith('55')) {
        telefoneFormatado = '55' + telefoneFormatado;
      }
      telefoneFormatado = '+' + telefoneFormatado;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/fila`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefoneFormatado || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserInQueueInfo({ id: data.id, nome: data.nome, telefone: data.telefone });
        setNome('');
        setTelefone('');
      } else {
        Alert.alert('Erro', data.erro || 'Não foi possível entrar na fila.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema de conexão.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sairDaFila = async () => {
    setIsProcessing(true);
    try {
      await fetch(`${API_URL}/fila/${userInQueueInfo.id}`, { method: 'DELETE' });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sair da fila.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!userInQueueInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Entrar na Fila</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          value={nome}
          onChangeText={setNome}
          editable={!isProcessing}
        />
        <TextInput
          style={styles.input}
          placeholder="Seu Celular (opcional)"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          editable={!isProcessing}
        />
        {isProcessing ? (
          <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 10 }} />
        ) : (
          <Button
            title={telefone.trim() ? "Confirmar Entrada e Receber SMS" : "Confirmar Entrada (sem SMS)"}
            onPress={entrarNaFila}
          />
        )}
        <View style={styles.logoutButton}>
          <Button title="Voltar" onPress={onLogout} color="#666" disabled={isProcessing} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Você está na fila, {userInQueueInfo.nome}!</Text>
      <View style={styles.statusContainer}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Sua Posição</Text>
          <Text style={styles.statusValue}>{userPosition}º</Text>
        </View>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Espera Estimada</Text>
          <Text style={styles.statusValue}>{tempoEstimado} min</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.botaoSair, isProcessing && styles.botaoDesabilitado]}
        onPress={sairDaFila}
        disabled={isProcessing}
      >
        {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSairTexto}>Desistir e Sair da Fila</Text>}
      </TouchableOpacity>
      <View style={styles.logoutButton}>
        <Button title="Sair do App" onPress={onLogout} color="#666" disabled={isProcessing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { height: 45, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 10, backgroundColor: '#fff' },
  logoutButton: { marginTop: 20 },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 },
  statusBox: { padding: 15, backgroundColor: '#e9ecef', borderRadius: 8, alignItems: 'center', width: '48%' },
  statusLabel: { fontSize: 14, color: '#495057' },
  statusValue: { fontSize: 36, fontWeight: 'bold', color: '#007bff' },
  botaoSair: { backgroundColor: '#dc3545', padding: 12, borderRadius: 8, alignItems: 'center', minHeight: 45, justifyContent: 'center' },
  botaoSairTexto: { color: 'white', fontWeight: 'bold' },
  botaoDesabilitado: { backgroundColor: '#ccc' },
});
