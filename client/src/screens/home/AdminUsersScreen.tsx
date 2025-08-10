import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useThemeColors } from '../../theme';
import apiService from '../../services/api';
import { useAuthStore } from '../../store';

type UserRow = { id: string; email: string; name?: string; role: 'student' | 'teacher' | 'admin'; createdAt: string };

export default function AdminUsersScreen() {
  const colors = useThemeColors();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.warn, { color: colors.text }]}>Admin only</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Users</Text>
      {users.map((u) => (
        <View key={u.id} style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.email, { color: colors.text }]}>{u.email}</Text>
            <Text style={[styles.small, { color: colors.muted }]}>{u.name || '—'}</Text>
          </View>
          {(['student','teacher','admin'] as const).map((r) => (
            <TouchableOpacity key={r} style={[styles.roleBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }, u.role === r && { backgroundColor: colors.success }]} onPress={() => updateRole(u.id, r)}>
              <Text style={[styles.roleText, { color: u.role === r ? '#0b1220' : colors.text }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      {loading && <Text style={[styles.small, { color: colors.muted }]}>Loading…</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  email: { fontWeight: '700' },
  small: { },
  roleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  roleBtnActive: { },
  roleText: { fontWeight: '700', textTransform: 'capitalize' },
  warn: { textAlign: 'center' },
});


