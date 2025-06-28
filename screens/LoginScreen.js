// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';

// A senha secreta do administrador. Mude se quiser.
const ADMIN_PASSWORD = 'admin';

export default function LoginScreen({ onUserLogin, onAdminLogin }) {
  const [password, setPassword] = useState('');

  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onAdminLogin(); // Chama a função que troca para a tela de Admin
    } else {
      Alert.alert('Senha Incorreta', 'A senha de administrador está errada.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo à Fila Inteligente</Text>
      <Text style={styles.subtitle}>Escolha seu perfil para continuar</Text>

      <View style={styles.buttonContainer}>
        <Button title="Sou Usuário" onPress={onUserLogin} />
      </View>

      <View style={styles.adminSection}>
        <Text style={styles.adminTitle}>Área do Administrador</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a senha de admin"
          secureTextEntry // Esconde a senha
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Entrar como Admin" onPress={handleAdminLogin} color="#841584" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 40,
  },
  adminSection: {
    width: '80%',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 20,
    alignItems: 'center',
  },
  adminTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});