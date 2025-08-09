import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import apiService, { Lesson } from '../../services/api';

export default function LessonListScreen({ navigation }: any) {
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [musicSystem, setMusicSystem] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getLessons({ musicSystem: musicSystem || undefined, difficulty: difficulty || undefined });
      let data = res.data || [];
      if (query) {
        const q = query.toLowerCase();
        data = data.filter((l) => l.title.toLowerCase().includes(q));
      }
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [musicSystem, difficulty]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lessons</Text>
      <View style={styles.filters}>
        <TextInput placeholder="Search title" placeholderTextColor="#94A3B8" style={styles.input} value={query} onChangeText={setQuery} />
        <TextInput placeholder="Music System (Western/Carnatic)" placeholderTextColor="#94A3B8" style={styles.input} value={musicSystem} onChangeText={setMusicSystem} />
        <TextInput placeholder="Difficulty (beginner/intermediate/advanced)" placeholderTextColor="#94A3B8" style={styles.input} value={difficulty} onChangeText={setDifficulty} />
        <TouchableOpacity style={styles.primary} onPress={load} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Loading…' : 'Apply'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LessonDetail', { id: item.id })}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.musicSystem} • {item.difficulty}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#CBD5E1', textAlign: 'center' }}>No lessons</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 10 },
  filters: { gap: 8 },
  input: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 8, color: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10 },
  primary: { backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { color: '#F8FAFC', fontWeight: '800', fontSize: 16 },
  cardMeta: { color: '#CBD5E1', marginTop: 4 },
});


