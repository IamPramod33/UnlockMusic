import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiService from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.text}>Explore Lessons • Practice • Track Progress</Text>
      <View style={{ height: 12 }} />
      <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.primaryText}>Profile</Text>
      </TouchableOpacity>
      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.secondary} onPress={async () => { await apiService.logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
        <Text style={styles.secondaryText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  text: { color: '#CBD5E1', textAlign: 'center' },
  primary: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  secondary: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});


