// App.js
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Importa as novas telas
import LoginScreen from './screens/LoginScreen';
import UserScreen from './screens/UserScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
  // 'login', 'user', ou 'admin'
  const [currentScreen, setCurrentScreen] = useState('login');

  // Função para voltar para a tela de login
  const goBackToLogin = () => setCurrentScreen('login');

  let content;
  if (currentScreen === 'login') {
    content = (
      <LoginScreen
        onUserLogin={() => setCurrentScreen('user')}
        onAdminLogin={() => setCurrentScreen('admin')}
      />
    );
  } else if (currentScreen === 'user') {
    content = <UserScreen onLogout={goBackToLogin} />;
  } else if (currentScreen === 'admin') {
    content = <AdminScreen onLogout={goBackToLogin} />;
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});