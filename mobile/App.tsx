import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { useUpdateCheck } from './src/hooks/useUpdateCheck';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent: React.FC = () => {
  useUpdateCheck();
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
