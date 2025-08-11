import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme';
import { AudioPlayerUI } from '../../../components/common';
import type { Lesson } from '../../../services/api';
import { resolveMediaUrl } from '../../../services/api';
import CarnaticRaga from '../../../components/carnatic/CarnaticRaga';

type Props = { lesson: Lesson };

export default function CarnaticLessonDetail({ lesson }: Props) {
  const colors = useThemeColors();
  // Reverted: no local raga/tanpura state; handled by CarnaticRaga component

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{lesson.musicSystem} • {lesson.difficulty}</Text>
      <View style={{ marginTop: 8, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12 }}>
        <Markdown style={{ body: { color: colors.text } }}>{lesson.content || ''}</Markdown>
      </View>
      <Text style={[styles.section, { color: colors.text }]}>Exercises</Text>
      <FlatList
        data={lesson.exercises}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.type}</Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.difficulty || '—'}</Text>
            {item.audioFile ? (
              <View style={{ marginTop: 8 }}>
                <AudioPlayerUI url={resolveMediaUrl(item.audioFile) as string} title="Exercise Audio" />
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center' }}>No exercises</Text>}
        ListFooterComponent={<CarnaticRaga />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  meta: { textAlign: 'center' },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  card: { borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardMeta: { marginTop: 4 },
  playbackRow: { padding: 12, borderWidth: 1, borderRadius: 10, marginTop: 12 },
});


