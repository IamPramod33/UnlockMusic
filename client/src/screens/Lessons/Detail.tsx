import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme';
import apiService, { Lesson } from '../../services/api';
import { audioPlayer } from '../../services/audio';
import CarnaticLessonDetail from './carnatic/CarnaticLessonDetail';
import WesternLessonDetail from './western/WesternLessonDetail';

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      {lesson.musicSystem === 'Carnatic' ? (
        <CarnaticLessonDetail lesson={lesson} />
      ) : (
        <WesternLessonDetail lesson={lesson} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  text: { },
});


