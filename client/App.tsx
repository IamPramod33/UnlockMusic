import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import apiService from './src/services/api';
import AppNavigator from './src/navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from './src/store';

const Stack = createNativeStackNavigator();

export default function App() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // hydrate preferences from storage (milestone 1.3)
        try {
          const raw = await SecureStore.getItemAsync('user_prefs');
          const fromSecure = raw ? JSON.parse(raw) : null;
          const fromWeb = typeof window !== 'undefined' ? window.localStorage?.getItem('user_prefs') : null;
          const parsedWeb = fromWeb ? JSON.parse(fromWeb) : null;
          const prefs = fromSecure || parsedWeb;
          if (prefs) await useAuthStore.getState().setPreferences(prefs);
        } catch {}
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
