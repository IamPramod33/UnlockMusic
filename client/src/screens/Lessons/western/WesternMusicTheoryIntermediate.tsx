import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../../theme';
import type { Lesson } from '../../../services/api';

type Props = { lesson: Lesson };

export default function WesternMusicTheoryIntermediate({ lesson }: Props) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        {(lesson.content || 'Intervals (quality & inversion), minor scales, modal overview, triads & sevenths with inversions, functional harmony (T–PD–D), cadences, intro to voice leading.').trim()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
});


