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
  const goBackToLogin = () => {
    setCurrentScreen('login');
  };

  // Renderização condicional para exibir a tela correta
  const renderScreen = () => {
    switch (currentScreen) {
      case 'user':
        return <UserScreen onLogout={goBackToLogin} />;
      case 'admin':
        return <AdminScreen onLogout={goBackToLogin} />;
      default: // 'login'
        return (
          <LoginScreen
            onUserLogin={() => setCurrentScreen('user')}
            onAdminLogin={() => setCurrentScreen('admin')}
          />
        );
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});