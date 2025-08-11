import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme';
import apiService, { Lesson } from '../../services/api';
import { audioPlayer } from '../../services/audio';
import CarnaticLessonDetail from './carnatic/CarnaticLessonDetail';
import WesternLessonDetail from './western/WesternLessonDetail';
import CarnaticRaga from '../../components/carnatic/CarnaticRaga';
import WesternScales from './western/WesternScalesComponent';
import CarnaticMusicTheory from './carnatic/CarnaticMusicTheoryComponent';
import WesternMusicTheory from './western/WesternMusicTheoryComponent';

export default function LessonDetailScreen({ route }: any) {
  const colors = useThemeColors();
  const { id } = route.params || {};
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiService.getLesson(id);
      setLesson(res.data as any);
    })();
    // Clear any lingering audio errors/status when switching lessons
    audioPlayer.stop();
  }, [id]);

  if (!lesson) return <View style={[styles.container, { backgroundColor: colors.background }]}><Text style={[styles.text, { color: colors.muted }]}>Loading…</Text></View>;

  // Route to dedicated components by lesson id
  if (lesson.id === 'carnatic-ragas') {
    return <View style={[styles.container, { backgroundColor: colors.background }] }><CarnaticRaga defaultTonic="C" scrollable /></View>;
  }
  if (lesson.id === 'western-scales') {
    return <View style={[styles.container, { backgroundColor: colors.background }] }><WesternScales lesson={lesson} /></View>;
  }
  if (lesson.id === 'carnatic-theory-intro') {
    return <View style={[styles.container, { backgroundColor: colors.background }] }><CarnaticMusicTheory lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-theory-intro') {
    return <View style={[styles.container, { backgroundColor: colors.background }] }><WesternMusicTheory lesson={lesson} /></View>;
  }

  // Fallbacks by music system (legacy)
  return <View style={[styles.container, { backgroundColor: colors.background }] }>{lesson.musicSystem === 'Carnatic' ? <CarnaticLessonDetail lesson={lesson} /> : <WesternLessonDetail lesson={lesson} />}</View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  text: { },
});


