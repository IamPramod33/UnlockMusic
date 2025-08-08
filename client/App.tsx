import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import apiService from './src/services/api';
import AppNavigator from './src/navigation/AppNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiService.getMe();
        // prime token in store by calling getMe; AppNavigator derives from store
      } catch {
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#1E293B" />
      {checking ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' }}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <AppNavigator />
      )}
    </>
  );
}
