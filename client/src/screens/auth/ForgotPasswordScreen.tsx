import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiService from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const r = await apiService.requestPasswordReset({ email });
      // In dev, backend returns token
      const t = (r as any)?.token || r?.data?.token;
      setToken(t ?? null);
      Alert.alert('Reset requested', t ? 'Token received (dev only)' : 'If account exists, an email was sent');
    } catch (e) {
      Alert.alert('Error', 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TouchableOpacity style={styles.primary} onPress={handleRequest} disabled={loading}>
        <Text style={styles.primaryText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
      </TouchableOpacity>
      {token && (
        <>
          <Text style={styles.token}>Dev token: {token}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ResetPassword', { token })}>
            <Text style={styles.link}>Go to Reset Password</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, color: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10 },
  primary: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  token: { color: '#CBD5E1', textAlign: 'center', marginTop: 10 },
  link: { color: '#93c5fd', textAlign: 'center', marginTop: 8 },
});


