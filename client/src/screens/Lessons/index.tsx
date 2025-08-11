import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useThemeColors } from '../../theme';
import apiService, { Lesson } from '../../services/api';

export default function LessonListScreen({ navigation }: any) {
  const colors = useThemeColors();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Lessons</Text>
      <View style={styles.filters}>
        <TextInput placeholder="Search title" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={query} onChangeText={setQuery} />
        <TextInput placeholder="Music System (Western/Carnatic)" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={musicSystem} onChangeText={setMusicSystem} />
        <TextInput placeholder="Difficulty (beginner/intermediate/advanced)" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={difficulty} onChangeText={setDifficulty} />
        <TouchableOpacity style={[styles.primary, { backgroundColor: colors.success }]} onPress={load} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Loading…' : 'Apply'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const displayTitle = item.title.replace(/major\s+scales/gi, 'Scales');
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('LessonDetail', { id: item.id })}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{displayTitle}</Text>
              <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.musicSystem} • {item.difficulty}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center' }}>No lessons</Text>}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('CarnaticRagas')}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>Carnatic Ragas</Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>Explore ragas with tanpura and piano visualization</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  filters: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  primary: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#0b1220', fontWeight: '800', fontSize: 16 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardMeta: { marginTop: 4 },
});


