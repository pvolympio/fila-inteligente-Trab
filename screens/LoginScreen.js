// ===================== IMPORTS =====================
import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet, TouchableOpacity, Image } from 'react-native';

// ===================== CONSTANTES =====================
const ADMIN_PASSWORD = 'admin';

// ===================== TELA PRINCIPAL =====================
export default function LoginScreen({ onUserLogin, onAdminLogin }) {
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onAdminLogin();
    } else {
      Alert.alert('Senha Incorreta', 'A senha de administrador está errada.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://img.icons8.com/fluency/96/queue.png' }}
        style={styles.logo}
        accessibilityLabel="Logo Fila Inteligente"
      />
      <Text style={styles.title} accessibilityRole="header" accessibilityLabel="Bem-vindo à Fila Inteligente">
        Bem-vindo à{"\n"}
        <Text style={styles.brand}>Fila Inteligente</Text>
      </Text>
      <Text style={styles.subtitle} accessibilityLabel="Escolha seu perfil para continuar">
        Escolha seu perfil para continuar
      </Text>
      <TouchableOpacity
        style={styles.userButton}
        onPress={onUserLogin}
        accessibilityLabel="Entrar como usuário"
        accessibilityHint="Acesse a área do usuário"
        activeOpacity={0.8}
      >
        <Text style={styles.userButtonText}>Sou Usuário</Text>
      </TouchableOpacity>
      <View style={styles.adminSection}>
        <Text style={styles.adminTitle} accessibilityRole="header" accessibilityLabel="Área do Administrador">
          Área do Administrador
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a senha de admin"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Campo de senha do administrador"
          accessibilityHint="Digite a senha para acessar a área do administrador"
        />
        <TouchableOpacity
          style={styles.adminButton}
          onPress={handleAdminLogin}
          accessibilityLabel="Entrar como administrador"
          accessibilityHint="Acesse a área do administrador"
          activeOpacity={0.8}
        >
          <Text style={styles.adminButtonText}>Entrar como Admin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===================== ESTILOS =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 6,
  },
  brand: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
  },
  userButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 40,
    maxWidth: 420,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    alignSelf: 'center',
  },
  userButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  adminSection: {
    maxWidth: 420,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    alignSelf: 'center',
  },
  adminTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#222',
  },
  adminButton: {
    backgroundColor: '#841584',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '110%',
    elevation: 2,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});