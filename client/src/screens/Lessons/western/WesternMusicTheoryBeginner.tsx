import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useThemeColors } from '../../../theme';
import type { Lesson } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { lesson: Lesson };

const BASIC_LESSONS = [
  { id: 'western-basic-notation-staff', title: 'Notation & Staff', subtitle: 'Clefs, ledger lines, note names' },
  { id: 'western-basic-keyboard-mapping', title: 'Pitch & Keyboard Mapping', subtitle: 'Middle C, octaves, geography' },
  { id: 'western-basic-rhythm-meter', title: 'Rhythm & Meter', subtitle: 'Values, rests, simple meters' },
  { id: 'western-basic-intervals-intro', title: 'Intervals (Intro)', subtitle: 'Half/whole steps, 2nds/3rds…' },
  { id: 'western-basic-scales-keys-intro', title: 'Scales & Key Signatures (Intro)', subtitle: 'Major pattern, circle of fifths' },
  { id: 'western-basic-ear-training-starter', title: 'Ear Training (Starter)', subtitle: 'Do‑re‑mi, up/down steps' },
];

export default function WesternMusicTheoryBeginner({ lesson }: Props) {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title || 'Western Theory — Beginner'}</Text>
      {lesson.content ? (
        <Text style={{ color: colors.muted, marginTop: 6 }}>{lesson.content.trim()}</Text>
      ) : null}

      <View style={{ height: 12 }} />

      {BASIC_LESSONS.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => navigation.navigate('LessonDetail', { id: item.id })}
          style={[styles.row, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
            {!!item.subtitle && <Text style={{ color: colors.muted }}>{item.subtitle}</Text>}
          </View>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: '700' },
});


