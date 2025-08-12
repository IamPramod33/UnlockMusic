import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../../../../theme';
import type { Lesson } from '../../../../services/api';

type Props = { lesson: Lesson };

export default function IntervalsIntro({ lesson }: Props) {
  const colors = useThemeColors();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title || 'Intervals (Intro)'}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        Half vs whole steps, basic interval naming (2nd, 3rd...). Interactive two‑note demos planned.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
});


