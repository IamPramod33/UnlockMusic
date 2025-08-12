import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useThemeColors } from '../../../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/AppNavigator';
import Svg, { Line, Text as SvgText, Rect, Ellipse } from 'react-native-svg';
import type { Lesson } from '../../../../services/api';
import { resolveMediaUrl } from '../../../../services/api';
import { audioPlayer } from '../../../../services/audio';
import PianoView from '../../../../components/western/PianoView';

type Props = { lesson: Lesson };

type PitchClass = 'C'|'C#'|'Db'|'D'|'D#'|'Eb'|'E'|'F'|'F#'|'Gb'|'G'|'G#'|'Ab'|'A'|'A#'|'Bb'|'B';

const WHITE_PCS: PitchClass[] = ['C','D','E','F','G','A','B'];
const SHARP_PCS: PitchClass[] = ['C#','D#','F#','G#','A#'];
const FLAT_EQUIV: Record<string, PitchClass> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' } as const;
const SHARP_EQUIV: Record<string, PitchClass> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' } as const;

function getEquivalents(pc: PitchClass): PitchClass[] {
  if (pc in FLAT_EQUIV) return [pc, FLAT_EQUIV[pc as keyof typeof FLAT_EQUIV]] as PitchClass[];
  if (pc in SHARP_EQUIV) return [pc, SHARP_EQUIV[pc as keyof typeof SHARP_EQUIV]] as PitchClass[];
  return [pc];
}

function toPitchClass(noteWithOctave: string): PitchClass {
  return noteWithOctave.replace(/[0-9]/g, '').toUpperCase() as PitchClass;
}

function normalizeNoteForAsset(note: string): string {
  if (note.includes('#')) return note.replace('#', 'sharp');
  return note;
}

function assetBaseUrl(noteName: string): string {
  const path = `/instruments/piano/${noteName}.mp3`;
  return resolveMediaUrl(path)!;
}

function generateTarget(): PitchClass {
  const pool: PitchClass[] = [...WHITE_PCS, ...SHARP_PCS];
  const raw = pool[Math.floor(Math.random() * pool.length)] as PitchClass;
  if (SHARP_PCS.includes(raw) && Math.random() < 0.5) {
    const flat = FLAT_EQUIV[raw];
    return flat || raw;
  }
  return raw;
}

export default function NotationStaff({ lesson }: Props) {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [drillActive, setDrillActive] = useState<boolean>(false);
  const [showTreble, setShowTreble] = useState<boolean>(true);
  const [showBass, setShowBass] = useState<boolean>(true);
  const [staffDrillActive, setStaffDrillActive] = useState<boolean>(false);
  const [staffClef, setStaffClef] = useState<'treble' | 'bass'>('treble');
  const [staffQuestionIndex, setStaffQuestionIndex] = useState<number>(0);
  const [staffCorrectCount, setStaffCorrectCount] = useState<number>(0);
  const [staffTarget, setStaffTarget] = useState<{ type: 'line' | 'space' | 'middleC'; idx: number; answer: PitchClass } | null>(null);
  const [includeMiddleC, setIncludeMiddleC] = useState<boolean>(false);
  const [staffFeedback, setStaffFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showMiniKeys, setShowMiniKeys] = useState<boolean>(true);
  const [miniOctaves, setMiniOctaves] = useState<number[]>([3,4,5]);
  const [currentMiniOctave, setCurrentMiniOctave] = useState<number>(4);

  function clampOct(o: number): number { return Math.max(1, Math.min(7, o)); }
  function computeOctaveWindow(center: number): number[] {
    const c = clampOct(center);
    const win = Array.from(new Set([clampOct(c-1), c, clampOct(c+1)])).sort((a,b)=>a-b);
    return win;
  }
  const staffTotalQuestions = 10;
  const staffFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [currentTarget, setCurrentTarget] = useState<PitchClass | null>(null);
  const [reveal, setReveal] = useState<boolean>(false);
  const [answered, setAnswered] = useState<boolean>(false);
  const [highlightNotes, setHighlightNotes] = useState<string[]>([]);
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = 10;

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      audioPlayer.stop();
    };
  }, []);

  function playNote(note: string) {
    const asset = normalizeNoteForAsset(note);
    const url = assetBaseUrl(asset);
    void audioPlayer.play(url);
  }

  function startDrill(): void {
    setDrillActive(true);
    setQuestionIndex(0);
    setCorrectCount(0);
    startTimeRef.current = Date.now();
    nextQuestion(true);
  }

  function stopDrill(): void {
    setDrillActive(false);
    setCurrentTarget(null);
    setReveal(false);
    setHighlightNotes([]);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  }

  function scheduleReveal(target: PitchClass): void {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      setReveal(true);
      const notes = [`${equivalentSharp(target)}4`];
      setHighlightNotes(notes);
    }, 2000);
  }

  function equivalentSharp(pc: PitchClass): PitchClass {
    if (pc in SHARP_EQUIV) return SHARP_EQUIV[pc as keyof typeof SHARP_EQUIV];
    return pc;
  }

  function toSharp(pc: PitchClass): PitchClass {
    return equivalentSharp(pc);
  }

  function nextQuestion(resetTimer = false): void {
    const t = generateTarget();
    setCurrentTarget(t);
    setReveal(false);
    setAnswered(false);
    setHighlightNotes([]);
    if (resetTimer) scheduleReveal(t);
  }

  function handleKeyDown(note: string) {
    playNote(note);
    setLastPressed(note);
    if (!drillActive || !currentTarget || answered) return;
    const pressedPc = toPitchClass(note);
    // Normalize to sharps on both sides to avoid enharmonic mismatches (e.g., Db vs C#)
    const ok = toSharp(pressedPc as PitchClass) === toSharp(currentTarget);
    if (ok) {
      setCorrectCount((c) => c + 1);
      setQuestionIndex((i) => i + 1);
      setAnswered(true);
      setReveal(true);
      setHighlightNotes([`${equivalentSharp(currentTarget)}4`]);
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }
  }

  function staffNoteName(clef: 'treble' | 'bass', type: 'line' | 'space', idx: number): PitchClass {
    // idx comes from top→bottom positions on the staff arrays (0 = top, increasing downwards)
    // Our note-name arrays are bottom→top, so we must flip the index
    const lineIdxFromBottom = 4 - idx; // 5 lines
    const spaceIdxFromBottom = 3 - idx; // 4 spaces

    if (clef === 'treble') {
      const linesBottomToTop: PitchClass[] = ['E', 'G', 'B', 'D', 'F'];
      const spacesBottomToTop: PitchClass[] = ['F', 'A', 'C', 'E'];
      return (type === 'line' ? linesBottomToTop[lineIdxFromBottom] : spacesBottomToTop[spaceIdxFromBottom]) as PitchClass;
    }
    const linesBottomToTop: PitchClass[] = ['G', 'B', 'D', 'F', 'A'];
    const spacesBottomToTop: PitchClass[] = ['A', 'C', 'E', 'G'];
    return (type === 'line' ? linesBottomToTop[lineIdxFromBottom] : spacesBottomToTop[spaceIdxFromBottom]) as PitchClass;
  }

  function staffNoteNameWithOctave(
    clef: 'treble' | 'bass',
    type: 'line' | 'space',
    idxFromTop: number
  ): string {
    // Arrays are bottom→top with octave annotations
    const TREBLE_LINES_BT = ['E4','G4','B4','D5','F5'];
    const TREBLE_SPACES_BT = ['F4','A4','C5','E5'];
    const BASS_LINES_BT = ['G2','B2','D3','F3','A3'];
    const BASS_SPACES_BT = ['A2','C3','E3','G3'];

    const lineIdxFromBottom = 4 - idxFromTop;
    const spaceIdxFromBottom = 3 - idxFromTop;

    if (clef === 'treble') {
      return type === 'line'
        ? TREBLE_LINES_BT[lineIdxFromBottom]
        : TREBLE_SPACES_BT[spaceIdxFromBottom];
    }
    return type === 'line'
      ? BASS_LINES_BT[lineIdxFromBottom]
      : BASS_SPACES_BT[spaceIdxFromBottom];
  }

  function startStaffDrill(): void {
    setStaffDrillActive(true);
    setStaffQuestionIndex(0);
    setStaffCorrectCount(0);
    nextStaffQuestion();
  }

  function stopStaffDrill(): void {
    setStaffDrillActive(false);
    setStaffTarget(null);
  }

  function nextStaffQuestion(): void {
    if (includeMiddleC && Math.random() < 0.2) {
      setStaffTarget({ type: 'middleC', idx: -1, answer: 'C' });
      return;
    }
    const type: 'line' | 'space' = Math.random() < 0.5 ? 'line' : 'space';
    // generate index from TOP to bottom for drawing purposes (0 = top)
    const idxFromTop = type === 'line' ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 4);
    const answer = staffNoteName(staffClef, type, idxFromTop);
    setStaffTarget({ type, idx: idxFromTop, answer });
  }

  function submitStaffAnswer(choice: PitchClass): void {
    if (!staffDrillActive || !staffTarget) return;
    const isCorrect = choice === staffTarget.answer;
    if (isCorrect) setStaffCorrectCount((c) => c + 1);

    const nextIndex = staffQuestionIndex + 1;
    setStaffQuestionIndex(nextIndex);

    if (nextIndex >= staffTotalQuestions) {
      setStaffDrillActive(false);
      setStaffTarget(null);
      setStaffFeedback(isCorrect ? 'correct' : 'wrong');
      if (staffFeedbackTimerRef.current) clearTimeout(staffFeedbackTimerRef.current);
      staffFeedbackTimerRef.current = setTimeout(() => setStaffFeedback(null), 600);
      return;
    }

    // Flash feedback before moving to next prompt
    setStaffFeedback(isCorrect ? 'correct' : 'wrong');
    if (staffFeedbackTimerRef.current) clearTimeout(staffFeedbackTimerRef.current);
    staffFeedbackTimerRef.current = setTimeout(() => {
      setStaffFeedback(null);
      nextStaffQuestion();
    }, 600);
  }

  const finished = drillActive && questionIndex >= totalQuestions;
  const elapsedSec = useMemo(() => Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000), [questionIndex, drillActive, reveal]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.breadcrumbRow}>
        <Pressable onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })} style={styles.breadcrumbChip}>
          <Text style={{ color: colors.text }}>‹ Back</Text>
        </Pressable>
        <View style={{ width: 8 }} />
        <Pressable onPress={() => navigation.navigate('LessonDetail', { id: 'western-theory-intro' })}>
          <Text style={{ color: colors.muted }}>Beginner</Text>
        </Pressable>
        <Text style={{ color: colors.muted }}> › </Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Notation & Staff</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title || 'Notation & Staff'}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>
        Read staff note names and map them to the keyboard. Use the quick overview, then jump into the drill.
      </Text>

      <View style={[styles.card, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Staffs have five lines and four spaces. Treble clef generally for higher pitches; bass clef for lower. Tap any note on the staff to highlight the corresponding key on the keyboard below.
        </Text>
        <View style={{ height: 12 }} />
        <Pressable onPress={() => setShowTreble((s) => !s)} style={[styles.sectionHeader, { borderColor: colors.border }] }>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Treble Staff</Text>
          <Text style={{ color: colors.muted }}>{showTreble ? 'Hide' : 'Show'}</Text>
        </Pressable>
        {showTreble && (
          <>
            <View style={{ height: 12 }} />
            <StaffDiagram clef="treble" colors={colors as any} onTapNote={(noteName: string) => {
              setShowMiniKeys(true);
              const oct = parseInt(noteName.replace(/[^0-9]/g, ''), 10) || 4;
              setCurrentMiniOctave(oct);
              setMiniOctaves(computeOctaveWindow(oct));
              // Defer highlight to next tick so PianoView picks up new octaves before auto-scrolling
              setTimeout(() => setHighlightNotes([noteName]), 0);
            }} />
            <View style={{ height: 12 }} />
            <TrebleStaffNamesDiagram colors={colors as any} />
          </>
        )}
        {/* Mini keyboard and toggle between Treble and Bass sections */}
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pressable onPress={() => setShowMiniKeys((v) => !v)} style={[styles.chip, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>{showMiniKeys ? 'Hide Mini Keyboard' : 'Show Mini Keyboard'}</Text>
          </Pressable>
        </View>
        {showMiniKeys && (
          <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 6 }}>
            <Text style={{ color: colors.muted, marginBottom: 4 }}>Keyboard (Interactive)</Text>
            <PianoView
              enableTouch
              showLabels={showLabels}
              labelColor={colors.text}
              onKeyDown={(n) => handleKeyDown(n)}
              highlightNotes={highlightNotes}
              scrollable
              octaves={[2,3,4,5]}
              whiteKeyWidth={56}
              whiteKeyHeight={160}
              context="drill"
              autoScrollToHighlight
            />
          </View>
        )}
        <View style={{ height: 12 }} />
        <Pressable onPress={() => setShowBass((s) => !s)} style={[styles.sectionHeader, { borderColor: colors.border }] }>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bass Staff</Text>
          <Text style={{ color: colors.muted }}>{showBass ? 'Hide' : 'Show'}</Text>
        </Pressable>
        {showBass && (
          <>
            <View style={{ height: 12 }} />
            <StaffDiagram clef="bass" colors={colors as any} onTapNote={(noteName: string) => {
              setShowMiniKeys(true);
              const oct = parseInt(noteName.replace(/[^0-9]/g, ''), 10) || 3;
              setCurrentMiniOctave(oct);
              setMiniOctaves(computeOctaveWindow(oct));
              setTimeout(() => setHighlightNotes([noteName]), 0);
            }} />
            <View style={{ height: 12 }} />
            <BassStaffNamesDiagram colors={colors as any} />
          </>
        )}
        <View style={{ height: 12 }} />
        <MiddleCDiagram colors={colors as any} />
        <View style={{ height: 12 }} />
        <GrandStaffNoteNames colors={colors as any} />
        <View style={{ height: 12 }} />
        <Text style={{ color: colors.muted }}>
          Note names cycle A–G. Accidentals modify pitches: sharp (♯) raises by a half step, flat (♭) lowers by a half step.
          Naturals (♮) cancel sharps/flats. Enharmonics are different names for the same pitch (e.g., C♯ and D♭).
        </Text>
        
      </View>

      <View style={[styles.card, { borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Staff Note Identification</Text>
          {!staffDrillActive ? (
            <Pressable onPress={startStaffDrill} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{staffQuestionIndex > 0 ? 'Restart' : 'Start'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={stopStaffDrill} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Stop</Text>
            </Pressable>
          )}
        </View>
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable onPress={() => setStaffClef('treble')} style={[styles.chip, { borderColor: colors.border, backgroundColor: staffClef === 'treble' ? colors.border + '33' : 'transparent' }]}>
            <Text style={{ color: colors.text }}>Treble</Text>
          </Pressable>
          <Pressable onPress={() => setStaffClef('bass')} style={[styles.chip, { borderColor: colors.border, backgroundColor: staffClef === 'bass' ? colors.border + '33' : 'transparent' }]}>
            <Text style={{ color: colors.text }}>Bass</Text>
          </Pressable>
          <Pressable onPress={() => setIncludeMiddleC((v) => !v)} style={[styles.chip, { borderColor: colors.border, backgroundColor: includeMiddleC ? colors.border + '33' : 'transparent' }]}>
            <Text style={{ color: colors.text }}>Include Middle C</Text>
          </Pressable>
          <Text style={{ color: colors.muted, alignSelf: 'center' }}>Score: {staffCorrectCount}/{staffQuestionIndex}</Text>
        </View>
        <View style={{ height: 8 }} />
        {staffTarget && (
          <View style={{
            borderWidth: 1,
            borderColor: staffFeedback === 'correct' ? '#22c55e' : staffFeedback === 'wrong' ? '#ef4444' : colors.border,
            borderRadius: 8,
            padding: 6,
          }}>
            <StaffSingleNoteDiagram
              colors={colors as any}
              clef={staffClef}
              type={staffTarget.type}
              idx={staffTarget.idx}
              onTapNote={(pc: PitchClass) => {
                // Highlight corresponding key on the keyboard below
                const note = `${pc}4` as string; // default octave reference
                setHighlightNotes([note]);
                // If the user taps the staff note, auto-submit the same answer
                submitStaffAnswer(pc);
              }}
            />
          </View>
        )}
        {!staffTarget && !staffDrillActive && staffQuestionIndex >= staffTotalQuestions && (
          <Text style={{ color: colors.muted, marginTop: 8 }}>Drill Complete. Score: {staffCorrectCount}/{staffTotalQuestions}</Text>
        )}
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['A','B','C','D','E','F','G'] as PitchClass[]).map((n) => (
            <Pressable key={n} onPress={() => submitStaffAnswer(n)} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{n}</Text>
            </Pressable>
          ))}
        </View>
        {/* Mini keyboard intentionally removed from Staff Note Identification */}
      </View>

      <View style={[styles.card, { borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Note Mapping Drill</Text>
          {!drillActive ? (
            <Pressable onPress={startDrill} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Start</Text>
            </Pressable>
          ) : (
            <Pressable onPress={stopDrill} style={[styles.chip, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Stop</Text>
            </Pressable>
          )}
        </View>
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Pressable onPress={() => setShowLabels((s) => !s)} style={[styles.chip, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>{showLabels ? 'Hide Key Labels' : 'Show Key Labels'}</Text>
          </Pressable>
        </View>
        <View style={{ height: 8 }} />
        {drillActive && !finished && (
          <>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
              Find: {currentTarget}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Tap the matching key on the keyboard.</Text>
            {!!lastPressed && !!currentTarget && (
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Last: {toPitchClass(lastPressed)} • Expected: {currentTarget} {getEquivalents(currentTarget).length > 1 ? `(or ${getEquivalents(currentTarget)[1]})` : ''}
              </Text>
            )}
            {!!reveal && !!currentTarget && (
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Answer: {currentTarget} {getEquivalents(currentTarget).length > 1 ? `(or ${getEquivalents(currentTarget)[1]})` : ''}
              </Text>
            )}
            <View style={{ height: 8 }} />
          </>
        )}
        {finished && (
          <>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>Drill Complete</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Score: {correctCount}/{totalQuestions} • Time: ~{elapsedSec}s
            </Text>
            <View style={{ height: 8 }} />
            <Pressable onPress={startDrill} style={[styles.primaryBtn, { backgroundColor: colors.primary, alignSelf: 'flex-start' }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Restart</Text>
            </Pressable>
          </>
        )}
        <View style={{ height: 8 }} />
        <PianoView
          enableTouch
          showLabels={showLabels}
          labelColor={colors.text}
          onKeyDown={(n) => handleKeyDown(n)}
          highlightNotes={highlightNotes}
          scrollable
          octaves={[3,4,5]}
          whiteKeyWidth={56}
          whiteKeyHeight={160}
          context="drill"
          autoScrollToHighlight
        />
        <View style={{ height: 8 }} />
        {drillActive && !finished && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => {
                if (answered) {
                  if (questionIndex < totalQuestions) {
                    nextQuestion(true);
                  }
                  setAnswered(false);
                } else {
                  setQuestionIndex((i) => {
                    const next = i + 1;
                    if (next < totalQuestions) {
                      nextQuestion(true);
                    }
                    return next;
                  });
                }
              }}
              style={[styles.chip, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>Next</Text>
            </Pressable>
            <Text style={{ color: colors.muted }}>Correct: {correctCount} / {questionIndex} </Text>
          </View>
        )}
      </View>

      
    </ScrollView>
  );
}

// Map a staff position (top→bottom index) to a concrete note name with octave
function mapStaffNoteWithOctave(
  clef: 'treble' | 'bass',
  type: 'line' | 'space',
  idxFromTop: number
): string {
  const TREBLE_LINES_BT = ['E4','G4','B4','D5','F5'];
  const TREBLE_SPACES_BT = ['F4','A4','C5','E5'];
  const BASS_LINES_BT = ['G2','B2','D3','F3','A3'];
  const BASS_SPACES_BT = ['A2','C3','E3','G3'];
  const lineIdxFromBottom = 4 - idxFromTop;
  const spaceIdxFromBottom = 3 - idxFromTop;
  if (clef === 'treble') {
    return type === 'line' ? TREBLE_LINES_BT[lineIdxFromBottom] : TREBLE_SPACES_BT[spaceIdxFromBottom];
  }
  return type === 'line' ? BASS_LINES_BT[lineIdxFromBottom] : BASS_SPACES_BT[spaceIdxFromBottom];
}

function StaffDiagram({ clef = 'treble', colors, onTapNote }: { clef: 'treble' | 'bass'; colors: { text: string }; onTapNote?: (noteName: string) => void }) {
  const width = 360;
  const height = 130;
  const padding = 16;
  const staffGap = (height - padding * 2) / 6; // 5 lines → 6 gaps
  const lineYs = [0, 1, 2, 3, 4].map((i) => padding + staffGap + i * staffGap);
  const title = clef === 'treble' ? 'Treble Staff' : 'Bass Staff';
  const lines = clef === 'treble' ? ['E', 'G', 'B', 'D', 'F'] : ['G', 'B', 'D', 'F', 'A'];
  const spaces = clef === 'treble' ? ['F', 'A', 'C', 'E'] : ['A', 'C', 'E', 'G'];

  // Compute space Ys between lines
  const spaceYs = [0, 1, 2, 3].map((i) => (lineYs[i] + lineYs[i + 1]) / 2);

  // Note head positions
  const lineX = 100; // x for line notes
  const spaceX = 220; // x for space notes
  const headW = 18;
  const headH = 12;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>{title}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Staff background */}
        <Rect x={8} y={padding} width={width - 16} height={height - padding * 2} fill="#ffffff" stroke="#e2e8f0" />
        {/* 5 staff lines */}
        {lineYs.map((y, idx) => (
          <Line key={`l-${idx}`} x1={16} y1={y} x2={width - 16} y2={y} stroke="#0f172a" strokeWidth={1} />
        ))}

        {/* Line notes with labels */}
        {lineYs.map((y, idx) => {
          const noteLabel = lines[idx];
          const hideLabel = clef === 'bass' ? true : (noteLabel === 'F' || noteLabel === 'E');
          return (
            <React.Fragment key={`line-note-${idx}`}>
              <Ellipse cx={lineX} cy={y} rx={headW / 2} ry={headH / 2} fill="#0f172a" onPress={() => {
                if (!onTapNote) return;
                const n = mapStaffNoteWithOctave(clef, 'line', idx);
                onTapNote(n);
              }} />
              {!hideLabel && (
                <SvgText x={lineX} y={y - headH} fontSize={10} fill={colors.text} textAnchor="middle">
                  {noteLabel}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}

        {/* Space notes with labels */}
        {spaceYs.map((y, idx) => {
          const noteLabel = spaces[idx];
          const hideLabel = clef === 'bass' ? true : (noteLabel === 'F' || noteLabel === 'E');
          return (
            <React.Fragment key={`space-note-${idx}`}>
              <Ellipse cx={spaceX} cy={y} rx={headW / 2} ry={headH / 2} fill="#0f172a" onPress={() => {
                if (!onTapNote) return;
                const n = mapStaffNoteWithOctave(clef, 'space', idx);
                onTapNote(n);
              }} />
              {!hideLabel && (
                <SvgText x={spaceX} y={y - headH} fontSize={10} fill={colors.text} textAnchor="middle">
                  {noteLabel}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
      <Text style={{ color: colors.text, marginTop: 6 }}>Lines: {lines.join('  ')}</Text>
      <Text style={{ color: colors.text }}>Spaces: {spaces.join('  ')}</Text>
    </View>
  );
}

function MiddleCDiagram({ colors }: { colors: { text: string } }) {
  const width = 320;
  const height = 60;
  const midY = height / 2;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Middle C (Ledger Line)</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Ledger line */}
        <Line x1={80} y1={midY} x2={width - 80} y2={midY} stroke="#0f172a" strokeWidth={1} />
        {/* Note head approximation */}
        <Rect x={width / 2 - 10} y={midY - 6} width={20} height={12} rx={6} fill="#0f172a" />
        <SvgText x={width / 2} y={midY - 10} fontSize={12} fill={colors.text} textAnchor="middle">C</SvgText>
      </Svg>
      <Text style={{ color: colors.text }}>This sits between treble and bass staves.</Text>
    </View>
  );
}

function TrebleStaffNamesDiagram({ colors }: { colors: { text: string } }) {
  const width = 360;
  const height = 130;
  const padding = 16;
  const staffGap = (height - padding * 2) / 6;
  const lineYs = [0, 1, 2, 3, 4].map((i) => padding + staffGap + i * staffGap);
  const spaceYs = [0, 1, 2, 3].map((i) => (lineYs[i] + lineYs[i + 1]) / 2);
  const lines = ['E', 'G', 'B', 'D', 'F']; // bottom→top
  const spaces = ['F', 'A', 'C', 'E']; // bottom→top
  const textXLine = 190;
  const textXSpace = 270;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Treble Staff — Note Names</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Rect x={8} y={padding} width={width - 16} height={height - padding * 2} fill="#ffffff" stroke="#e2e8f0" />
        {lineYs.map((y, idx) => (
          <Line key={`tl-${idx}`} x1={16} y1={y} x2={width - 16} y2={y} stroke="#0f172a" strokeWidth={1} />
        ))}
        {/* Put labels directly on staff positions */}
        {lineYs.map((y, idx) => (
          <SvgText key={`tll-${idx}`} x={textXLine} y={y + 3} fontSize={12} fill={colors.text} textAnchor="middle">
            {lines[lines.length - 1 - idx]}
          </SvgText>
        ))}
        {spaceYs.map((y, idx) => (
          <SvgText key={`tls-${idx}`} x={textXSpace} y={y + 3} fontSize={12} fill={colors.text} textAnchor="middle">
            {spaces[spaces.length - 1 - idx]}
          </SvgText>
        ))}
      </Svg>
      <Text style={{ color: colors.text, marginTop: 6 }}>Lines (bottom→top): {lines.join('  ')}</Text>
      <Text style={{ color: colors.text }}>Spaces (bottom→top): {spaces.join('  ')}</Text>
    </View>
  );
}

function BassStaffNamesDiagram({ colors }: { colors: { text: string } }) {
  const baseWidth = 360;
  const height = 130;
  const padding = 16;
  const staffGap = (height - padding * 2) / 6;
  const lineYs = [0, 1, 2, 3, 4].map((i) => padding + staffGap + i * staffGap);
  const spaceYs = [0, 1, 2, 3].map((i) => (lineYs[i] + lineYs[i + 1]) / 2);
  const lines = ['G', 'B', 'D', 'F', 'A']; // bottom→top
  const spaces = ['A', 'C', 'E', 'G']; // bottom→top
  const textXLine = Math.round(baseWidth * 0.38);
  const textXSpace = Math.round(baseWidth * 0.68);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Bass Staff — Note Names</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${baseWidth} ${height}`}>
        <Rect x={8} y={padding} width={baseWidth - 16} height={height - padding * 2} fill="#ffffff" stroke="#e2e8f0" />
        {lineYs.map((y, idx) => (
          <Line key={`bl-${idx}`} x1={16} y1={y} x2={baseWidth - 16} y2={y} stroke="#0f172a" strokeWidth={1} />
        ))}
        {/* Put labels directly on staff positions */}
        {lineYs.map((y, idx) => (
          <SvgText key={`bll-${idx}`} x={textXLine} y={y + 3} fontSize={12} fill={colors.text} textAnchor="middle">
            {lines[lines.length - 1 - idx]}
          </SvgText>
        ))}
        {spaceYs.map((y, idx) => (
          <SvgText key={`bls-${idx}`} x={textXSpace} y={y + 3} fontSize={12} fill={colors.text} textAnchor="middle">
            {spaces[spaces.length - 1 - idx]}
          </SvgText>
        ))}
      </Svg>
      <Text style={{ color: colors.text, marginTop: 6 }}>Lines (bottom→top): {lines.join('  ')}</Text>
      <Text style={{ color: colors.text }}>Spaces (bottom→top): {spaces.join('  ')}</Text>
    </View>
  );
}

function StaffSingleNoteDiagram({ colors, clef, type, idx, onTapNote }: { colors: { text: string }; clef: 'treble' | 'bass'; type: 'line' | 'space' | 'middleC'; idx: number; onTapNote?: (pc: PitchClass) => void }) {
  const baseWidth = 360;
  const height = 120;
  const padding = 20;
  const staffGap = (height - padding * 2) / 6;
  const lineYsTopToBottom = [0, 1, 2, 3, 4].map((i) => padding + staffGap + i * staffGap);
  const spaceYsTopToBottom = [0, 1, 2, 3].map((i) => (lineYsTopToBottom[i] + lineYsTopToBottom[i + 1]) / 2);
  let y = type === 'line' ? lineYsTopToBottom[idx] : spaceYsTopToBottom[idx];
  if (type === 'middleC') {
    // Place ledger line centered between top line of bass and bottom line of treble; in this simplified single staff view, use middle
    y = (lineYsTopToBottom[4] + lineYsTopToBottom[0]) / 2;
  }
  const x = baseWidth / 2;
  const headW = 18;
  const headH = 12;
  const answer = type === 'middleC'
    ? 'C'
    : clef === 'treble'
      ? (type === 'line' ? ['E','G','B','D','F'][idx] : ['F','A','C','E'][idx])
      : (type === 'line' ? ['G','B','D','F','A'][idx] : ['A','C','E','G'][idx]);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${baseWidth} ${height}`}>
        <Rect x={8} y={padding} width={baseWidth - 16} height={height - padding * 2} fill="#ffffff" stroke="#e2e8f0" />
        {lineYsTopToBottom.map((ly: number, i: number) => (
          <Line key={`sl-${i}`} x1={16} y1={ly} x2={baseWidth - 16} y2={ly} stroke="#0f172a" strokeWidth={1} />
        ))}
        {type === 'middleC' && (
          <Line x1={x - 40} y1={y} x2={x + 40} y2={y} stroke="#0f172a" strokeWidth={1} />
        )}
        <Ellipse
          cx={x}
          cy={y}
          rx={headW / 2}
          ry={headH / 2}
          fill="#0f172a"
          onPress={() => onTapNote && onTapNote(answer as PitchClass)}
        />
      </Svg>
      <Text style={{ color: colors.text, marginTop: 6 }}>Which note is this? ({type === 'middleC' ? 'between staves' : clef + ' clef'})</Text>
    </View>
  );
}

function GrandStaffNoteNames({ colors }: { colors: { text: string } }) {
  const baseWidth = 380;
  const height = 220;
  const padding = 18;
  const staffSpacing = 18;
  const trebleTop = padding;
  const bassTop = padding + staffSpacing * 5 + 36;
  const trebleLineYs = [0,1,2,3,4].map((i) => trebleTop + i * staffSpacing);
  const bassLineYs = [0,1,2,3,4].map((i) => bassTop + i * staffSpacing);
  const trebleSpaceYs = [0,1,2,3].map((i) => (trebleLineYs[i] + trebleLineYs[i+1]) / 2);
  const bassSpaceYs = [0,1,2,3].map((i) => (bassLineYs[i] + bassLineYs[i+1]) / 2);
  const trebleLines = ['E','G','B','D','F'];
  const trebleSpaces = ['F','A','C','E'];
  const bassLines = ['G','B','D','F','A'];
  const bassSpaces = ['A','C','E','G'];
  const textXLine = Math.round(baseWidth * 0.34);
  const textXSpace = Math.round(baseWidth * 0.64);
  const cY = (trebleLineYs[4] + bassLineYs[0]) / 2;
  const noteX = baseWidth / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Grand Staff — Note Names (C between staves)</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${baseWidth} ${height}`}>
        {trebleLineYs.map((y, idx) => (
          <Line key={`gt-${idx}`} x1={16} y1={y} x2={baseWidth - 16} y2={y} stroke="#0f172a" strokeWidth={1} />
        ))}
        {bassLineYs.map((y, idx) => (
          <Line key={`gb-${idx}`} x1={16} y1={y} x2={baseWidth - 16} y2={y} stroke="#0f172a" strokeWidth={1} />
        ))}
        {trebleLineYs.map((y, idx) => (
          <SvgText key={`gtl-${idx}`} x={textXLine} y={y + 3} fontSize={11} fill={colors.text} textAnchor="middle">
            {trebleLines[trebleLines.length - 1 - idx]}
          </SvgText>
        ))}
        {trebleSpaceYs.map((y, idx) => (
          <SvgText key={`gts-${idx}`} x={textXSpace} y={y + 3} fontSize={11} fill={colors.text} textAnchor="middle">
            {trebleSpaces[trebleSpaces.length - 1 - idx]}
          </SvgText>
        ))}
        {bassLineYs.map((y, idx) => (
          <SvgText key={`gbl-${idx}`} x={textXLine} y={y + 3} fontSize={11} fill={colors.text} textAnchor="middle">
            {bassLines[bassLines.length - 1 - idx]}
          </SvgText>
        ))}
        {bassSpaceYs.map((y, idx) => (
          <SvgText key={`gbs-${idx}`} x={textXSpace} y={y + 3} fontSize={11} fill={colors.text} textAnchor="middle">
            {bassSpaces[bassSpaces.length - 1 - idx]}
          </SvgText>
        ))}
        {/* Middle C ledger line and label */}
        <Line x1={noteX - 40} y1={cY} x2={noteX + 40} y2={cY} stroke="#0f172a" strokeWidth={1} />
        <SvgText x={noteX} y={cY - 8} fontSize={12} fill={colors.text} textAnchor="middle">C</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 10, padding: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
  primaryBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  breadcrumbChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
});


