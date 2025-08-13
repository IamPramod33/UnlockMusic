import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useThemeColors } from '../../../../theme';
import type { Lesson } from '../../../../services/api';
import PianoView from '../../../../components/western/PianoView';
import { audioPlayer } from '../../../../services/audio';
import { resolveMediaUrl } from '../../../../services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/AppNavigator';
import PitchIntroDiagram from './PitchIntroDiagram';

type Props = { lesson: Lesson };

export default function KeyboardMapping({ lesson }: Props) {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const PROMPT_DELAY_MS = 5000;
  const [labels, setLabels] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [octave, setOctave] = useState<number>(4);
  const [highlightNotes, setHighlightNotes] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<string[]>(() => ['C4','D4','E4','F4','G4','A4']);
  const [promptIdx, setPromptIdx] = useState(0);
  const target = prompts[promptIdx] || 'C4';
  const [showPitch, setShowPitch] = useState(true);
  const timersRef = useRef<number[]>([]);
  const seqTimersRef = useRef<number[]>([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);

  function toAssetName(note: string): string {
    // Accept notes like C4, C#4, Db4
    if (note.includes('b')) {
      // Map flats to enharmonic sharps for asset names
      const map: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
      return note.replace(/([A-G]b)(\d)/, (_, p1: string, p2: string) => `${(map[p1] || p1).replace('#','sharp')}${p2}`);
    }
    if (note.includes('#')) return note.replace('#', 'sharp');
    return note;
  }

  function play(note: string) {
    if (!soundOn) return;
    const asset = toAssetName(note);
    const path = `/instruments/piano/${asset}.mp3`;
    const mediaUrl = resolveMediaUrl(path);
    if (mediaUrl) void audioPlayer.play(mediaUrl);
  }

  function nextPrompt() {
    setPromptIdx((i) => (i + 1) % prompts.length);
  }

  function reveal() {
    clearTimers();
    setHighlightNotes([target]);
    play(target);
    // Clear highlight after reveal window
    timersRef.current.push(window.setTimeout(() => setHighlightNotes([]), PROMPT_DELAY_MS));
  }

  function onKeyDown(note: string) {
    play(note);
    if (note === target) {
      clearTimers();
      setHighlightNotes([note]);
      timersRef.current.push(window.setTimeout(() => {
        setHighlightNotes([]);
        nextPrompt();
      }, PROMPT_DELAY_MS));
    } else {
      clearTimers();
      setHighlightNotes([target]);
      timersRef.current.push(window.setTimeout(() => setHighlightNotes([]), PROMPT_DELAY_MS));
    }
  }

  const octaves = useMemo(() => {
    const o = Math.max(2, Math.min(6, octave));
    return [o - 1, o, o + 1].filter((v, idx, arr) => arr.indexOf(v) === idx);
  }, [octave]);

  function clearTimers() {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  function clearSeqTimers() {
    seqTimersRef.current.forEach((id) => clearTimeout(id));
    seqTimersRef.current = [];
  }

  function buildWhiteKeySequence(startOct: number, endOct: number): string[] {
    const whites = ['C','D','E','F','G','A','B'];
    const seq: string[] = [];
    for (let o = startOct; o <= endOct; o++) {
      whites.forEach((w) => seq.push(`${w}${o}`));
    }
    return seq;
  }

  function playLowToHighTwoOctaves() {
    if (isPlayingSeq) return;
    // As requested: C3 → B5 inclusive
    const seq = buildWhiteKeySequence(3, 5);
    setIsPlayingSeq(true);
    clearSeqTimers();
    seq.forEach((note, i) => {
      const id = window.setTimeout(() => {
        setHighlightNotes([note]);
        play(note);
      }, i * 400);
      seqTimersRef.current.push(id);
    });
    // Clear highlight and reset state at the end
    const endId = window.setTimeout(() => {
      setHighlightNotes([]);
      setIsPlayingSeq(false);
    }, seq.length * 400 + 50);
    seqTimersRef.current.push(endId);
  }

  function stopLowToHigh() {
    clearSeqTimers();
    setIsPlayingSeq(false);
    setHighlightNotes([]);
    try { (audioPlayer as any)?.stop?.(); } catch {}
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.breadcrumbRow}>
        <Pressable onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })} style={[styles.breadcrumbChip, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text }}>‹ Back</Text>
        </Pressable>
        <View style={{ width: 8 }} />
        <Pressable onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })}>
          <Text style={{ color: colors.muted }}>Beginner</Text>
        </Pressable>
        <Text style={{ color: colors.muted }}> › </Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Keyboard Orientation</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title || 'Keyboard Orientation (Pitch Basics)'}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        Find Middle C and common notes. Use labels, change octaves, and press keys to hear pitches.
      </Text>

      <View style={{ height: 8 }} />
      <Pressable onPress={() => setShowPitch((s) => !s)} style={[styles.sectionHeader, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pitch (What is pitch?)</Text>
        <Text style={{ color: colors.muted }}>{showPitch ? 'Hide' : 'Show'}</Text>
      </Pressable>
      {showPitch && (
        <View style={[styles.controls, { borderColor: colors.border }]}> 
          <PitchIntroDiagram width={360} height={120} textColor={colors.text} />
          <Text style={{ color: colors.muted }}>
            Pitch is how “high” or “low” a sound feels. Just like saying a word in a deep vs squeaky voice, notes can be lower or higher. On the keyboard, left is lower, right is higher.
          </Text>
          <Text style={{ color: colors.muted }}>
            Try tapping three keys from left to right and listen for the sound rising.
          </Text>
        </View>
      )}

      <View style={{ height: 8 }} />
      <View style={[styles.controls, { borderColor: colors.border }]}>
        <View style={styles.controlRow}>
          <Text style={{ color: colors.text }}>Key Labels</Text>
          <Switch value={labels} onValueChange={setLabels} />
        </View>
        <View style={styles.controlRow}>
          <Text style={{ color: colors.text }}>Sound</Text>
          <Switch value={soundOn} onValueChange={setSoundOn} />
        </View>
        <View style={styles.controlRow}>
          <Text style={{ color: colors.text }}>Octave: C{octave}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setOctave((o) => Math.max(2, o - 1))} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Prev</Text>
            </Pressable>
            <Pressable onPress={() => setOctave((o) => Math.min(6, o + 1))} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Next</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ height: 8 }} />
      <Text style={{ color: colors.text, fontWeight: '700' }}>Prompt: Find {target}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <Pressable onPress={reveal} style={[styles.chip, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text }}>Show me</Text>
        </Pressable>
        <Pressable onPress={nextPrompt} style={[styles.chip, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text }}>Next</Text>
        </Pressable>
      </View>

      <View style={{ height: 8 }} />
      <PianoView
        enableTouch
        showLabels={labels}
        labelColor={colors.text}
        onKeyDown={onKeyDown}
        highlightNotes={highlightNotes}
        scrollable
        octaves={octaves}
        whiteKeyWidth={56}
        whiteKeyHeight={160}
        initialOctave={octave}
        context="mini"
        autoScrollToHighlight
      />

      <View style={{ height: 12 }} />
      <View style={[styles.controls, { borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Play low → high (C3 to B5)</Text>
        <Text style={{ color: colors.muted }}>Hear pitch rise across octaves to feel keyboard mapping.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            disabled={isPlayingSeq}
            onPress={playLowToHighTwoOctaves}
            style={[styles.chip, { borderColor: colors.border, opacity: isPlayingSeq ? 0.6 : 1 }]}
          >
            <Text style={{ color: colors.text }}>{isPlayingSeq ? 'Playing…' : 'Start'}</Text>
          </Pressable>
          {isPlayingSeq && (
            <Pressable onPress={stopLowToHigh} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Stop</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  breadcrumbChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
  controls: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 10 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
});


