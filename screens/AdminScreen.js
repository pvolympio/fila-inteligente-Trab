// ===================== IMPORTS =====================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Button, Platform, TouchableOpacity, Modal, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

// ===================== COMPONENTES AUXILIARES =====================
const StatCard = ({ title, value, unit = '', icon }) => (
  <View style={styles.statCard} accessible accessibilityRole="summary" accessibilityLabel={`${title}: ${value} ${unit}`}> 
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value} <Text style={styles.statUnit}>{unit}</Text></Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const BarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <Text style={styles.chartEmptyText} accessibilityLabel="Sem atendimentos hoje para exibir o gráfico.">Sem atendimentos hoje para exibir o gráfico.</Text>;
  }
  const maxValue = Math.max(...data.map(item => item.count), 1);
  return (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle} accessibilityRole="header" accessibilityLabel="Atendimentos por Hora">Atendimentos por Hora</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          {data.map((item) => (
            <View key={item.hora} style={styles.barWrapper} accessible accessibilityLabel={`Hora ${item.hora.split(':')[0]}, ${item.count} atendimentos`}>
              <Text style={styles.barValue}>{item.count}</Text>
              <View style={[styles.bar, { height: `${(item.count / maxValue) * 80 || 0}%` }]} />
              <Text style={styles.barLabel}>{item.hora.split(':')[0]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ===================== TELA PRINCIPAL =====================
export default function AdminScreen({ onLogout, navigation }) {
  const [fila, setFila] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    atendidosHoje: 0,
    tempoMedioAtendimentoMs: 0,
    horaDePico: -1,
    atendimentosPorHora: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  // ===================== FUNÇÕES DE DADOS =====================
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_URL}/fila/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Erro na resposta da API de stats:", response.status);
      }
    } catch (error) {
      console.error("Erro de rede ao buscar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const statsInterval = setInterval(fetchStats, 60000);
    const filaRef = ref(database, 'fila');
    const filaUnsubscribe = onValue(filaRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.entries(data).map(([id, dados]) => ({ id, ...dados })).sort((a,b) => a.horaEntrada - b.horaEntrada) : [];
      setFila(lista);
    });
    return () => {
      clearInterval(statsInterval);
      filaUnsubscribe();
    };
  }, [fetchStats]);

  // ===================== FUNÇÕES DE AÇÃO =====================
  const handleItemPress = (item) => {
    if (isProcessing) return;
    setSelectedUser(item);
    setModalVisible(true);
  };

  const removerUsuario = async (userId) => {
    setIsProcessing(true);
    try {
      await fetch(`${API_URL}/fila/${userId}`, { method: 'DELETE' });
      fetchStats(); 
    } catch (error) {
      Alert.alert("Erro", "Não foi possível remover o usuário.");
    } finally {
      setIsProcessing(false);
      setModalVisible(false);
      setSelectedUser(null);
    }
  };
  
  const atenderProximo = () => {
    if (fila.length > 0 && !isProcessing) {
      removerUsuario(fila[0].id);
    }
  };

  const tempoMedioMin = stats.tempoMedioAtendimentoMs > 0 ? Math.ceil(stats.tempoMedioAtendimentoMs / 60000) : 0;
  
  // ===================== RENDER =====================
  return (
    <View style={styles.container}>
      <View style={styles.headerCustom}>
        <TouchableOpacity
          style={styles.headerLeftButton}
          onPress={() => navigation && navigation.goBack ? navigation.goBack() : onLogout()}
          activeOpacity={0.85}
          accessibilityLabel="Voltar"
          accessibilityHint="Voltar para a tela anterior"
        >
          <Text style={styles.logoutButtonText}>{'<'} Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titleAbsolute} accessibilityRole="header" accessibilityLabel="Área do Administrador">
          Área do <Text style={styles.brandCustom}>Administrador</Text>
        </Text>
        <View style={styles.headerRightSpace} />
      </View>
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              {isProcessing ? (<ActivityIndicator size="large" color="#007bff" />) : (
                <>
                  <Text style={styles.modalTitle}>Gerenciar</Text><Text style={styles.modalUserName}>{selectedUser?.nome}</Text>
                  <TouchableOpacity style={[styles.modalButton, styles.atenderButton]} onPress={() => removerUsuario(selectedUser.id)}><Text style={styles.modalButtonText}>Atender e Registrar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.removerButton]} onPress={() => removerUsuario(selectedUser.id)}><Text style={styles.modalButtonText}>Apenas Remover da Fila</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text></TouchableOpacity>
                </>
              )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loadingStats} onRefresh={fetchStats} colors={["#007bff"]} />}
      >
        <View style={styles.statsGrid}>
          <StatCard title="Na Fila" value={fila.length} icon="👥" />
          <StatCard title="Atendidos Hoje" value={stats.atendidosHoje || 0} icon="✅" />
          <StatCard title="Tempo Médio" value={tempoMedioMin} unit="min" icon="⏱️" />
        </View>
        {stats.horaDePico !== -1 ? (
          <View style={styles.peakHourCard}><Text style={styles.statIcon}>🔥</Text><Text style={styles.peakHourText}>Hora de Pico Hoje: <Text style={{fontWeight: 'bold'}}>{stats.horaDePico}:00 - {stats.horaDePico + 1}:00</Text></Text></View>
        ) : (
          <View style={styles.peakHourCard}><Text style={styles.statIcon}>😴</Text><Text style={styles.peakHourText}>Ainda não há dados de pico para hoje.</Text></View>
        )}
        <BarChart data={stats.atendimentosPorHora} />
        <TouchableOpacity style={[styles.botaoAtender, (fila.length === 0 || isProcessing) && styles.botaoDesabilitado]} onPress={atenderProximo} disabled={fila.length === 0 || isProcessing}><Text style={styles.botaoTexto}>Atender Próximo</Text></TouchableOpacity>
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Fila Atual</Text>
          <View style={{ height: 140 }}>
            <FlatList
              data={fila}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => handleItemPress(item)} disabled={isProcessing}>
                  <View style={[styles.itemFilaHorizontal, index === 0 && styles.itemFilaPrimeiro]}>
                    <Text style={styles.itemText}>{index + 1}. {item.nome}</Text>
                    <Text style={styles.itemDate}>às {new Date(Number(item.horaEntrada)).toLocaleTimeString()}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.filaVazia}>A fila está vazia!</Text>}
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 10 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ===================== ESTILOS =====================
const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', backgroundColor: '#f4f7f9' },
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
  brandCustom: {
    color: '#222',
    fontWeight: 'bold',
    textShadowColor: '#b0b0b0',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  logoutButtonCustom: { backgroundColor: '#dc3545', paddingVertical: 10, paddingHorizontal: 28, borderRadius: 24, alignItems: 'center', elevation: 2 },
  logoutButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginTop: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 20, paddingHorizontal: 10, marginHorizontal: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, minHeight: 120, justifyContent: 'center' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statUnit: { fontSize: 14, fontWeight: 'normal' },
  statTitle: { fontSize: 12, color: '#6c757d', marginTop: 4, textAlign: 'center' },
  peakHourCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginHorizontal: 15, marginTop: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  peakHourText: { fontSize: 14, marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15, paddingHorizontal: 5 },
  chartSection: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 15, marginTop: 15, paddingBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  chartContainer: { flexDirection: 'row', height: 120, alignItems: 'flex-end', paddingHorizontal: 10 },
  barWrapper: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  barValue: { fontSize: 10, color: '#333' },
  bar: { width: '80%', backgroundColor: '#0d6efd', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 10, marginTop: 4, color: '#6c757d' },
  chartEmptyText: { textAlign: 'center', paddingVertical: 40, color: '#6c757d' },
  listContainer: { paddingHorizontal: 15, marginTop: 15, backgroundColor: '#fff', borderRadius: 10, padding: 10, marginHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  itemFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemFilaHorizontal: {
    width: 180,
    height: 110,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemFilaPrimeiro: {
    borderColor: '#28a745',
    borderWidth: 3,
    shadowColor: '#28a745',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  itemText: { fontSize: 16 },
  itemDate: { fontSize: 12, color: '#888' },
  filaVazia: { textAlign: 'center', paddingVertical: 20, fontSize: 16, color: '#888' },
  botaoAtender: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginHorizontal: 15 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botaoDesabilitado: { backgroundColor: '#ccc' },
  logoutButton: { marginTop: 15, marginHorizontal: 15, marginBottom: 40 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '85%', maxWidth: 400, backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalUserName: { fontSize: 18, marginBottom: 20, color: '#333', marginTop: 5 },
  modalButton: { borderRadius: 8, paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 10 },
  modalButtonText: { color: 'white', fontWeight: 'bold' },
  atenderButton: { backgroundColor: '#007bff' },
  removerButton: { backgroundColor: '#dc3545' },
  cancelButton: { backgroundColor: '#f0f0f0' },
});