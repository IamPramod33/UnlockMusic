import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useThemeColors } from '../../../theme';
import { AudioPlayerUI } from '../../../components/common';
import type { Lesson } from '../../../services/api';
import { resolveMediaUrl, API_URL } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { playScaleSequence, stopScalePlayback } from '../../../services/music/scalePlayer';
import PianoView from '../../../components/western/PianoView';
import { audioPlayer } from '../../../services/audio';

type Props = { lesson: Lesson };

export default function WesternLessonDetail({ lesson }: Props) {
  const colors = useThemeColors();
  const displayTitle = (lesson.title || '').replace(/\bmajor\s+scales\b/ig, 'Scales');
  const displayContent = (lesson.content || '').replace(/\bmajor\s+scales\b/ig, 'Scales');
  const showExercises = useMemo(() => !(/major\s+scales/i.test(lesson.title || '')), [lesson.title]);
  const showContent = useMemo(() => displayContent.trim().length > 0 && showExercises, [displayContent, showExercises]);
  const [showScalePlayer, setShowScalePlayer] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<string>('major');
  const [patternOpen, setPatternOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [keyOpen, setKeyOpen] = useState(false);
  const [direction, setDirection] = useState<'asc' | 'desc' | 'both'>('both');
  const [notation, setNotation] = useState<'sharp' | 'flat' | 'plain'>('sharp');
  const [playsCount, setPlaysCount] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [streak, setStreak] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPracticePanel, setShowPracticePanel] = useState(true);
  const [showPianoVisualization, setShowPianoVisualization] = useState(true);
  const [activePianoNotes, setActivePianoNotes] = useState<string[]>([]);

  function toSharpHash(n: string): string { return n.replace('sharp', '#'); }

  // Streak helpers (simple localStorage-based)
  function readStreak(): number {
    try {
      if (typeof window === 'undefined') return 0;
      const s = window.localStorage.getItem('wm_streak');
      const last = window.localStorage.getItem('wm_last');
      const today = new Date().toDateString();
      if (!s) return 0;
      // Keep streak as is for display
      return parseInt(s, 10) || 0;
    } catch { return 0; }
  }
  function bumpStreak(): void {
    try {
      if (typeof window === 'undefined') return;
      const last = window.localStorage.getItem('wm_last');
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let s = parseInt(window.localStorage.getItem('wm_streak') || '0', 10) || 0;
      if (!last) s = 1;
      else if (last === today) s = s; // already counted today
      else if (last === yesterday) s = s + 1; else s = 1;
      window.localStorage.setItem('wm_streak', String(s));
      window.localStorage.setItem('wm_last', today);
      setStreak(s);
    } catch {}
  }

  useEffect(() => {
    setStreak(readStreak());
  }, []);

  // 60s session timer
  useEffect(() => {
    if (!sessionActive) return;
    if (secondsLeft <= 0) { setSessionActive(false); return; }
    timerRef.current && clearTimeout(timerRef.current as any);
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000) as any;
    return () => { timerRef.current && clearTimeout(timerRef.current as any); };
  }, [sessionActive, secondsLeft]);

  function microPrompt(): string {
    const label = PATTERN_OPTIONS.find((p) => p.key === selectedPattern)?.label?.split('(')?.[0]?.trim() || 'Scale';
    return `Goal: Play ${label} in ${selectedKey} twice with even tone and timing.`;
  }

  const PATTERN_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'major', label: 'Major (Ionian)' },
    { key: 'naturalMinor', label: 'Natural Minor (Aeolian)' },
    { key: 'harmonicMinor', label: 'Harmonic Minor' },
    { key: 'melodicMinorAsc', label: 'Melodic Minor (Asc)' },
    { key: 'ionian', label: 'Ionian' },
    { key: 'dorian', label: 'Dorian' },
    { key: 'phrygian', label: 'Phrygian' },
    { key: 'lydian', label: 'Lydian' },
    { key: 'mixolydian', label: 'Mixolydian' },
    { key: 'aeolian', label: 'Aeolian' },
    { key: 'locrian', label: 'Locrian' },
  ];

  const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{displayTitle}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
        <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginHorizontal: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{lesson.musicSystem}</Text>
        </View>
        <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: colors.primary, marginHorizontal: 4 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{((lesson.difficulty || '').charAt(0).toUpperCase() + (lesson.difficulty || '').slice(1)) || 'Beginner'}</Text>
        </View>
      </View>
      <FlatList
        data={showExercises ? lesson.exercises : []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            {/* Practice panel (collapsible) */}
            <View style={[styles.group, { borderColor: colors.border, marginTop: 8 }]}>
              <Pressable onPress={() => setShowPracticePanel((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Practice</Text>
                <Ionicons name={showPracticePanel ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
              </Pressable>
              {showPracticePanel && (
                <View style={{ paddingTop: 8 }}>
                  {/* Info banner with goal & tip */}
                  <View style={{ padding: 10, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.text }} numberOfLines={2} ellipsizeMode="tail">{microPrompt()}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Tip: short focused sessions build consistency.</Text>
                  </View>
                  {/* Stats bar */}
                  <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>Streak: <Text style={{ color: colors.text, fontWeight: '700' }}>{streak}</Text></Text>
                      </View>
                      <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>Session: <Text style={{ color: colors.text }}>{secondsLeft}s</Text></Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {!sessionActive ? (
                        <Pressable onPress={() => { setSessionActive(true); setSecondsLeft(60); }} style={{ padding: 8, borderRadius: 999, backgroundColor: colors.primary }}>
                          <Ionicons name="play" color="#fff" size={14} />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => setSessionActive(false)} style={{ padding: 8, borderRadius: 999, backgroundColor: colors.border }}>
                          <Ionicons name="pause" color={colors.text} size={14} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
            {/* Scale Player (Collapsed by default) */}
            <View style={[styles.group, { borderColor: colors.border, marginTop: 12 }]}>
              <Pressable onPress={() => setShowScalePlayer((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Scales</Text>
                <Ionicons name={showScalePlayer ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
              </Pressable>
              {showScalePlayer && (
                <View style={{ paddingTop: 8 }}>
                  <View style={{ height: 8 }} />
                  {/* Pattern & Key in two columns */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, marginBottom: 4 }}>Scale Pattern</Text>
                      <Pressable onPress={() => setPatternOpen((v) => !v)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.text }} numberOfLines={1}>{PATTERN_OPTIONS.find((p) => p.key === selectedPattern)?.label}</Text>
                        <Ionicons name={patternOpen ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
                      </Pressable>
                      {patternOpen && (
                        <ScrollView style={{ marginTop: 6, maxHeight: 220, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                          {PATTERN_OPTIONS.map((opt) => (
                            <Pressable key={opt.key} onPress={() => { setSelectedPattern(opt.key); setPatternOpen(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: selectedPattern === opt.key ? colors.primary : colors.card }}>
                              <Text style={{ color: selectedPattern === opt.key ? '#fff' : colors.text }}>{opt.label}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, marginBottom: 4 }}>Key (Tonic)</Text>
                      <Pressable onPress={() => setKeyOpen((v) => !v)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.text }}>{selectedKey}</Text>
                        <Ionicons name={keyOpen ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
                      </Pressable>
                      {keyOpen && (
                        <ScrollView style={{ marginTop: 6, maxHeight: 220, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {KEYS.map((k) => (
                              <Pressable key={k} onPress={() => { setSelectedKey(k); setKeyOpen(false); setNotation(k.includes('#') ? 'sharp' : 'flat'); }} style={{ paddingVertical: 8, paddingHorizontal: 10, minWidth: 48, alignItems: 'center', backgroundColor: selectedKey === k ? colors.primary : colors.card, borderRightWidth: 1, borderRightColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                <Text style={{ color: selectedKey === k ? '#fff' : colors.text }}>{k}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                  </View>
                  <View style={{ height: 10 }} />
                  {/* Direction */}
                  <View>
                    <Text style={{ color: colors.muted, marginBottom: 4 }}>Direction</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['asc','desc','both'] as const).map((opt) => (
                        <Pressable key={opt} onPress={() => setDirection(opt)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: direction === opt ? colors.primary : colors.card }}>
                          <Text style={{ color: direction === opt ? '#fff' : colors.text, textTransform: 'capitalize' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={{ height: 12 }} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable accessibilityLabel="Play scale" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.primary }} onPress={async () => {
                      await playScaleSequence({
                        baseUrl: (noteName) => {
                          const fileBase = noteName.replace('#', 'sharp');
                          return `${API_URL}/instruments/piano/${fileBase}.mp3`;
                        },
                        patternKey: selectedPattern,
                        tonic: selectedKey as any,
                        direction,
                        bpm: 80,
                        onNoteStart: (n) => setActivePianoNotes([toSharpHash(n)]),
                        onNoteEnd: () => setActivePianoNotes([]),
                      });
                      setPlaysCount((c) => c + 1);
                      bumpStreak();
                    }}>
                      <Ionicons name="play" color="#fff" size={18} />
                    </Pressable>
                    <Pressable accessibilityLabel="Stop scale" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.border }} onPress={() => { stopScalePlayback(); setActivePianoNotes([]); }}>
                      <Ionicons name="stop" color={colors.text} size={18} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
            {/* Piano Visualization (collapsible) */}
            <View style={[styles.group, { borderColor: colors.border, marginTop: 12 }]}>
              <Pressable onPress={() => setShowPianoVisualization((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Piano Visualization</Text>
                <Ionicons name={showPianoVisualization ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
              </Pressable>
              {showPianoVisualization && (
                <View style={{ paddingTop: 8 }}>
                  <PianoView
                    highlightNotes={[]}
                    activeNotes={activePianoNotes}
                    notation={notation}
                    tonic={selectedKey as any}
                    patternKey={selectedPattern}
                    enableTouch
                    onKeyDown={async (note) => {
                      try {
                        stopScalePlayback();
                        audioPlayer.stop();
                        const fileBase = note.replace('#', 'sharp');
                        await audioPlayer.play(`${API_URL}/instruments/piano/${fileBase}.mp3`);
                        setActivePianoNotes([note]);
                      } catch {}
                    }}
                    onKeyUp={() => {
                      audioPlayer.stop();
                      setActivePianoNotes([]);
                    }}
                  />
                </View>
              )}
            </View>
            {showExercises ? <Text style={[styles.section, { color: colors.text }]}>Exercises</Text> : null}
          </View>
        }
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
        ListEmptyComponent={showExercises ? <Text style={{ color: colors.muted, textAlign: 'center' }}>No exercises</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  meta: { textAlign: 'center' },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  group: { padding: 12, borderWidth: 1, borderRadius: 10 },
  card: { borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardMeta: { marginTop: 4 },
});


