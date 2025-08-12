import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../../../../theme';
import type { Lesson } from '../../../../services/api';

type Props = { lesson: Lesson };

export default function RhythmMeter({ lesson }: Props) {
  const colors = useThemeColors();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title || 'Rhythm & Meter'}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        Note values, rests, simple meters (2/4, 3/4, 4/4). Metronome/tap trainer planned.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
});


