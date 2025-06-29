// ===================== IMPORTS =====================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

// ===================== TELA PRINCIPAL =====================
export default function UserScreen({ onLogout, navigation }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [userInQueueInfo, setUserInQueueInfo] = useState(null);
  const [userPosition, setUserPosition] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  // ===================== EFEITOS =====================
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

  // ===================== FUNÇÕES DE AÇÃO =====================
  const entrarNaFila = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome.');
      return;
    }

    setIsProcessing(true);
    try {
      // Buscar a fila atual para verificar se o nome já está presente
      const filaRes = await fetch(`${API_URL}/fila`);
      const fila = await filaRes.json();
      const pessoaExistente = fila.find(p => p.nome.trim().toLowerCase() === nome.trim().toLowerCase());
      if (pessoaExistente) {
        // Se já existe, mostrar o estado dessa pessoa na fila
        setUserInQueueInfo({ id: pessoaExistente.id, nome: pessoaExistente.nome, telefone: pessoaExistente.telefone });
        Alert.alert('Você já está na fila!', 'Seu estado foi recuperado.');
        setIsProcessing(false);
        return;
      }

      let telefoneFormatado = telefone.trim();
      if (telefoneFormatado) {
        telefoneFormatado = telefoneFormatado.replace(/\D/g, '');
        if (!telefoneFormatado.startsWith('55')) {
          telefoneFormatado = '55' + telefoneFormatado;
        }
        telefoneFormatado = '+' + telefoneFormatado;
      }

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

  // ===================== HEADER =====================
  const Header = () => (
    <View style={styles.headerCustom}>
      {/* Botão Voltar à esquerda */}
      <TouchableOpacity
        style={styles.headerLeftButton}
        onPress={() => navigation && navigation.goBack ? navigation.goBack() : onLogout()}
        activeOpacity={0.85}
        accessibilityLabel="Voltar"
        accessibilityHint="Voltar para a tela anterior"
      >
        <Text style={styles.logoutButtonText}>{'<'} Voltar</Text>
      </TouchableOpacity>
      {/* Título centralizado absoluto */}
      <Text style={styles.titleAbsolute}>
        Área do <Text style={styles.brandCustom}>Usuário</Text>
      </Text>
      {/* Espaço invisível à direita para balancear */}
      <View style={styles.headerRightSpace} />
    </View>
  );

  // ===================== RENDER =====================
  if (!userInQueueInfo) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Header />
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Entrar na Fila</Text>
            <Text style={styles.subtitle}>Preencha seus dados para participar</Text>
            <Text style={[styles.infoText, {backgroundColor: '#e8f5e9', color: '#388e3c', borderRadius: 8, padding: 8, marginBottom: 18}]}>Caso já esteja na fila, digite o mesmo nome informado no cadastro para ver sua posição.</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              value={nome}
              onChangeText={setNome}
              editable={!isProcessing}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Seu Celular (opcional)"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              editable={!isProcessing}
              placeholderTextColor="#888"
            />
            {isProcessing ? (
              <ActivityIndicator size="large" color="#1976d2" style={{ marginVertical: 16 }} />
            ) : (
              <TouchableOpacity
                style={styles.enterButton}
                onPress={entrarNaFila}
                activeOpacity={0.85}
              >
                <Text style={styles.enterButtonText}>
                  {telefone.trim() ? "Confirmar e Receber SMS" : "Confirmar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Header />
      <View style={styles.containerInQueue}>
        <Text style={styles.title}>Estado atual da Fila</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Sua posição</Text>
            <Text style={styles.statusValue}>{userPosition}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Tempo estimado</Text>
            <Text style={styles.statusValue}>{tempoEstimado} min</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={sairDaFila}>
          <Text style={styles.leaveButtonText}>Sair da fila</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===================== ESTILOS =====================
const styles = StyleSheet.create({
  headerCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#f9fafb',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  headerLeftButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 2,
    zIndex: 2,
  },
  headerRightSpace: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 84,
    height: 40,
    opacity: 0,
    zIndex: 1,
  },
  titleAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    textShadowColor: '#b0b0b0',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    zIndex: 0,
    paddingHorizontal: 60,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  containerInQueue: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10, // diminuído para reduzir o espaço
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 0, // garantir que não haja espaço extra acima
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#222',
  },
  enterButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statusBox: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusLabel: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007bff',
  },
  leaveButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 45,
    justifyContent: 'center',
    width: '100%',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleCustom: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    textShadowColor: '#b0b0b0',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  brandCustom: {
    color: '#222',
    fontWeight: 'bold',
    textShadowColor: '#b0b0b0',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  logoutButtonCustom: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 2,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
