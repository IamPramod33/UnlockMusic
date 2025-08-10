import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiService from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Home</Text>
      <Text style={[styles.text, { color: colors.muted }]}>Explore Lessons • Practice • Track Progress</Text>
      <View style={{ height: 12 }} />
      <TouchableOpacity style={[styles.primary, { backgroundColor: colors.success }]} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.primaryText}>Profile</Text>
      </TouchableOpacity>
      <View style={{ height: 8 }} />
      <TouchableOpacity style={[styles.secondary, { backgroundColor: colors.danger }]} onPress={async () => { await apiService.logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}>
        <Text style={styles.secondaryText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  text: { textAlign: 'center' },
  primary: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  secondary: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});


