import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiService from '../../services/api';
import { useAuthStore } from '../../store';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('john.doe@example.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      console.log('Attempting login with:', { email, password });
      console.log('API_URL:', apiService.API_URL || 'not set');
      
      // Test direct API call first
      try {
        const testResponse = await fetch('http://192.168.29.207:4000/health');
        console.log('Health check response:', await testResponse.text());
      } catch (healthError) {
        console.error('Health check failed:', healthError);
      }
      
      // Test direct login call
      try {
        const directLoginResponse = await fetch('http://192.168.29.207:4000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        const directLoginData = await directLoginResponse.text();
        console.log('Direct login response:', directLoginData);
      } catch (directError) {
        console.error('Direct login failed:', directError);
      }
      
      const res = await apiService.login({ email, password });
      console.log('Login response:', res);
      const me = await apiService.getMe();
      console.log('GetMe response:', me);
      await useAuthStore.getState().setToken(res.token);
      useAuthStore.getState().setUser(me?.data?.user || null);
      Alert.alert('Signed in', `Welcome, ${me?.data?.user?.name || me?.data?.user?.email || 'user'}`);
    } catch (e) {
      console.error('Login error:', e);
      console.error('Error details:', e.response?.data || e.message);
      console.error('Error stack:', e.stack);
      Alert.alert('Login failed', `Error: ${e.response?.data?.message || e.message || 'Check credentials and server'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.primary} onPress={handleLogin} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Signing in…' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, color: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10 },
  primary: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  link: { color: '#93c5fd', textAlign: 'center', marginTop: 8 },
});


