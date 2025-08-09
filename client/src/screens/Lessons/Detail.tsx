import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import apiService, { Lesson } from '../../services/api';

export default function LessonDetailScreen({ route }: any) {
  const { id } = route.params || {};
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiService.getLesson(id);
      setLesson(res.data as any);
    })();
  }, [id]);

  if (!lesson) return <View style={styles.container}><Text style={styles.text}>Loading…</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.meta}>{lesson.musicSystem} • {lesson.difficulty}</Text>
      <Text style={styles.content}>{lesson.content}</Text>
      <Text style={styles.section}>Exercises</Text>
      <FlatList
        data={lesson.exercises}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.type}</Text>
            <Text style={styles.cardMeta}>{item.difficulty || '—'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#CBD5E1', textAlign: 'center' }}>No exercises</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  meta: { color: '#CBD5E1', textAlign: 'center' },
  content: { color: '#E2E8F0', marginTop: 8 },
  section: { color: '#F8FAFC', fontWeight: '700', marginTop: 12, marginBottom: 6 },
  card: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { color: '#F8FAFC', fontWeight: '800', fontSize: 16 },
  cardMeta: { color: '#CBD5E1', marginTop: 4 },
  text: { color: '#CBD5E1' },
});


