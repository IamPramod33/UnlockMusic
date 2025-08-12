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
import WesternMusicTheoryIntermediate from './western/WesternMusicTheoryIntermediate';
import WesternMusicTheoryAdvanced from './western/WesternMusicTheoryAdvanced';
import WesternMusicTheoryBeginner from './western/WesternMusicTheoryBeginner';
import NotationStaff from './western/basic/NotationStaff';
import KeyboardMapping from './western/basic/KeyboardMapping';
import RhythmMeter from './western/basic/RhythmMeter';
import IntervalsIntro from './western/basic/IntervalsIntro';
import ScalesKeysIntro from './western/basic/ScalesKeysIntro';
import EarTrainingStarter from './western/basic/EarTrainingStarter';

export default function LessonDetailScreen({ route }: any) {
  const colors = useThemeColors();
  const { id } = route.params || {};
  const [lesson, setLesson] = useState<Lesson | null>(null);

  // Local beginner lessons (client-side only, no API fetch required)
  function getLocalLesson(id: string): Lesson | null {
    const base: Omit<Lesson, 'id'> = {
      title: '',
      content: '',
      difficulty: 'Beginner',
      musicSystem: 'Western',
      category: 'Theory',
      duration: 5,
      prerequisites: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: [],
      _count: { exercises: 0, progress: 0 },
    } as any;
    const map: Record<string, Pick<Lesson, 'title' | 'content'>> = {
      'western-basic-notation-staff': {
        title: 'Notation & Staff',
        content: 'Clefs, ledger lines, note names A–G, accidentals, enharmonics.',
      },
      'western-basic-keyboard-mapping': {
        title: 'Pitch & Keyboard Mapping',
        content: 'Middle C, octaves, chromatic vs diatonic notes; keyboard geography.',
      },
      'western-basic-rhythm-meter': {
        title: 'Rhythm & Meter',
        content: 'Note values, rests, ties, dotted notes; simple meters (2/4, 3/4, 4/4).',
      },
      'western-basic-intervals-intro': {
        title: 'Intervals (Intro)',
        content: 'Half/whole steps; naming by number (2nd, 3rd, …); intuitive consonance.',
      },
      'western-basic-scales-keys-intro': {
        title: 'Scales & Key Signatures (Intro)',
        content: 'Major scale pattern (W‑W‑H‑W‑W‑W‑H); simple key signatures; circle of fifths.',
      },
      'western-basic-ear-training-starter': {
        title: 'Ear Training (Starter)',
        content: 'Do‑re‑mi, recognize steps up/down; tonic stability.',
      },
    };
    if (map[id]) {
      return { id, ...base, ...map[id] } as Lesson;
    }
    return null;
  }

  useEffect(() => {
    const local = getLocalLesson(id);
    if (local) {
      setLesson(local);
      return;
    }
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
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WesternMusicTheoryBeginner lesson={lesson} />
      </View>
    );
  }
  // Beginner sub-lessons
  if (lesson.id === 'western-basic-notation-staff') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><NotationStaff lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-basic-keyboard-mapping') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><KeyboardMapping lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-basic-rhythm-meter') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><RhythmMeter lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-basic-intervals-intro') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><IntervalsIntro lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-basic-scales-keys-intro') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><ScalesKeysIntro lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-basic-ear-training-starter') {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><EarTrainingStarter lesson={lesson} /></View>;
  }
  if (lesson.id === 'western-theory-intermediate') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WesternMusicTheoryIntermediate lesson={lesson} />
      </View>
    );
  }
  if (lesson.id === 'western-theory-advanced') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <WesternMusicTheoryAdvanced lesson={lesson} />
      </View>
    );
  }

  // Fallbacks by music system (legacy)
  return <View style={[styles.container, { backgroundColor: colors.background }] }>{lesson.musicSystem === 'Carnatic' ? <CarnaticLessonDetail lesson={lesson} /> : <WesternLessonDetail lesson={lesson} />}</View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  text: { },
});


