import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import apiService from '../../services/api';
import { useAuthStore } from '../../store';

type UserRow = { id: string; email: string; name?: string; role: 'student' | 'teacher' | 'admin'; createdAt: string };

export default function AdminUsersScreen() {
  const user = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.adminListUsers();
      setUsers(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id: string, role: 'student' | 'teacher' | 'admin') => {
    try {
      await apiService.adminUpdateUserRole(id, role);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.warn}>Admin only</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Users</Text>
      {users.map((u) => (
        <View key={u.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{u.email}</Text>
            <Text style={styles.small}>{u.name || '—'}</Text>
          </View>
          {(['student','teacher','admin'] as const).map((r) => (
            <TouchableOpacity key={r} style={[styles.roleBtn, u.role === r && styles.roleBtnActive]} onPress={() => updateRole(u.id, r)}>
              <Text style={styles.roleText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      {loading && <Text style={styles.small}>Loading…</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  email: { color: '#F8FAFC', fontWeight: '700' },
  small: { color: '#94A3B8' },
  roleBtn: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  roleBtnActive: { backgroundColor: '#22c55e' },
  roleText: { color: '#F8FAFC', fontWeight: '700', textTransform: 'capitalize' },
  warn: { color: '#F8FAFC', textAlign: 'center' },
});


