import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme';
import PianoView from '../western/PianoView';
import { audioPlayer } from '../../services/audio';
import { API_URL } from '../../services/api';
import { RAGAS, JANYA_RAGAS, POPULAR_RAGAS, playRagaSequence, stopRagaPlayback, computeRagaNoteSet } from '../../services/music/ragaPlayer';
import { startTanpura, stopTanpura } from '../../services/music/tanpura';

type Props = {
  defaultRagaId?: string;
  defaultTonic?: string; // e.g., 'C'
  scrollable?: boolean; // if true, wraps content in a ScrollView (use false when embedded in FlatList)
};

export default function CarnaticRaga({ defaultRagaId, defaultTonic = 'C', scrollable = true }: Props) {
  const colors = useThemeColors();
  const [selectedTonic, setSelectedTonic] = useState<string>(defaultTonic);
  const [selectedRagaId, setSelectedRagaId] = useState<string>(defaultRagaId || RAGAS[0]?.id || 'mayamalavagowla');
  const [ragaOpen, setRagaOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [category, setCategory] = useState<'Popular' | 'Melakarta' | 'Janya'>('Popular');
  const [keyOpen, setKeyOpen] = useState(false);
  const [direction, setDirection] = useState<'arohana'|'avarohana'|'both'>('both');
  const [tanpuraOn, setTanpuraOn] = useState(false);
  const [showPlayback, setShowPlayback] = useState(true);
  const [showPianoVisualization, setShowPianoVisualization] = useState(true);
  const [showTanpura, setShowTanpura] = useState(true);
  const [activePianoNotes, setActivePianoNotes] = useState<string[]>([]);
  const notation: 'sharp'|'flat'|'plain' = selectedTonic.includes('#') ? 'sharp' : 'flat';

  const SELECTABLE_KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const ragaOptions = category === 'Popular' ? POPULAR_RAGAS : category === 'Melakarta' ? RAGAS : JANYA_RAGAS;
  const selectedRaga = useMemo(() => ragaOptions.find(r => r.id === selectedRagaId) || ragaOptions[0], [selectedRagaId, ragaOptions]);
  const highlightNotes = useMemo(() => computeRagaNoteSet(selectedTonic as any, selectedRaga), [selectedTonic, selectedRaga]);

  useEffect(() => {
    return () => {
      stopRagaPlayback();
      stopTanpura();
    };
  }, []);

  const content = (
    <View style={{ width: '100%' }}>
      {/* Raga Playback */}
      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable onPress={() => setShowPlayback((v) => !v)} style={styles.headerRow}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Raga Playback</Text>
          <Ionicons name={showPlayback ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
        </Pressable>
        {showPlayback && (
          <View>
            <View style={{ height: 8 }} />
            {/* Category selector */}
            <Text style={{ color: colors.muted, marginBottom: 4 }}>Category</Text>
            <Pressable onPress={() => setCategoryOpen(v => !v)} style={[styles.select, { borderColor: colors.border, backgroundColor: colors.card }]}> 
              <Text style={{ color: colors.text }}>{category}</Text>
              <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
            </Pressable>
            {categoryOpen && (
              <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                {(['Popular','Melakarta','Janya'] as const).map((opt) => (
                  <Pressable key={opt} onPress={() => { setCategory(opt); setCategoryOpen(false); const list = opt === 'Popular' ? POPULAR_RAGAS : opt === 'Melakarta' ? RAGAS : JANYA_RAGAS; setSelectedRagaId(list[0]?.id || ''); }} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: category === opt ? colors.primary : colors.card }}>
                    <Text style={{ color: category === opt ? '#fff' : colors.text }}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Raga selector */}
            <Text style={{ color: colors.muted, marginBottom: 4 }}>Raga</Text>
            <Pressable onPress={() => setRagaOpen(v => !v)} style={[styles.select, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text }} numberOfLines={1}>{selectedRaga?.name}</Text>
              <Ionicons name={ragaOpen ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
            </Pressable>
            {ragaOpen && (
              <ScrollView
                style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              > 
                {ragaOptions.map((r) => (
                  <Pressable key={r.id} onPress={() => { setSelectedRagaId(r.id); setRagaOpen(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: selectedRagaId === r.id ? colors.primary : colors.card }}>
                    <Text style={{ color: selectedRagaId === r.id ? '#fff' : colors.text }}>{r.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={{ height: 8 }} />
            {/* Tonic selector */}
            <Text style={{ color: colors.muted, marginBottom: 4 }}>Tonic (Sa)</Text>
            <Pressable onPress={() => setKeyOpen(v => !v)} style={[styles.select, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text }}>{selectedTonic}</Text>
              <Ionicons name={keyOpen ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={16} />
            </Pressable>
            {keyOpen && (
              <ScrollView
                style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              > 
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {SELECTABLE_KEYS.map((k) => (
                    <Pressable key={k} onPress={() => { setSelectedTonic(k); setKeyOpen(false); }} style={{ paddingVertical: 8, paddingHorizontal: 10, minWidth: 48, alignItems: 'center', backgroundColor: selectedTonic === k ? colors.primary : colors.card, borderRightWidth: 1, borderRightColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ color: selectedTonic === k ? '#fff' : colors.text }}>{k}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            <View style={{ height: 8 }} />
            {/* Direction */}
            <Text style={{ color: colors.muted, marginBottom: 4 }}>Direction</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['arohana','avarohana','both'] as const).map((opt) => (
                <Pressable key={opt} onPress={() => setDirection(opt)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: direction === opt ? colors.primary : colors.card }}>
                  <Text style={{ color: direction === opt ? '#fff' : colors.text, textTransform: 'capitalize' }}>{opt}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 8 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable accessibilityLabel="Play raga" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.primary }} onPress={async () => {
                await playRagaSequence({
                  raga: selectedRaga,
                  tonic: selectedTonic as any,
                  direction,
                  bpm: 80,
                  baseUrl: (noteName) => `${API_URL}/instruments/piano/${noteName.replace('#','sharp')}.mp3`,
                  onNoteStart: (n) => {
                    // eslint-disable-next-line no-console
                    console.log('[RagaPlayer] note', n);
                    setActivePianoNotes([n]);
                  },
                  onNoteEnd: () => setActivePianoNotes([]),
                });
              }}>
                <Ionicons name="play" color="#fff" size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Stop raga" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.border }} onPress={() => { stopRagaPlayback(); setActivePianoNotes([]); }}>
                <Ionicons name="stop" color={colors.text} size={18} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Piano Visualization */}
      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.card }]}> 
        <Pressable onPress={() => setShowPianoVisualization((v) => !v)} style={styles.headerRow}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Piano Visualization</Text>
          <Ionicons name={showPianoVisualization ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
        </Pressable>
        {showPianoVisualization && (
          <View style={{ paddingTop: 8 }}>
            <PianoView
              highlightNotes={highlightNotes}
              activeNotes={activePianoNotes}
              notation={notation}
              tonic={selectedTonic as any}
              patternKey={'major'}
              enableTouch
              onKeyDown={async (note) => {
                try {
                  stopRagaPlayback();
                  audioPlayer.stop();
                  const fileBase = note.replace('#','sharp');
                    // eslint-disable-next-line no-console
                    console.log('[RagaTouch] note', note);
                  await audioPlayer.play(`${API_URL}/instruments/piano/${fileBase}.mp3`);
                  setActivePianoNotes([note]);
                } catch {}
              }}
              onKeyUp={() => { audioPlayer.stop(); setActivePianoNotes([]); }}
            />
          </View>
        )}
      </View>

      {/* Tanpura */}
      <View style={[styles.group, { borderColor: colors.border, backgroundColor: colors.card }]}> 
        <Pressable onPress={() => setShowTanpura((v) => !v)} style={styles.headerRow}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Tanpura</Text>
          <Ionicons name={showTanpura ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
        </Pressable>
        {showTanpura && (
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable accessibilityLabel={tanpuraOn ? 'Stop tanpura' : 'Play tanpura'} style={{ padding: 10, borderRadius: 999, backgroundColor: tanpuraOn ? colors.border : colors.success }} onPress={async () => {
              if (!tanpuraOn) {
                await startTanpura(API_URL, selectedTonic as any, 0.6);
                setTanpuraOn(true);
              } else {
                await stopTanpura();
                setTanpuraOn(false);
              }
            }}>
              <Ionicons name={tanpuraOn ? 'stop' : 'play'} color={tanpuraOn ? colors.text : '#0b1220'} size={18} />
            </Pressable>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Tip: Use tanpura to anchor your ear to {selectedTonic}.</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  group: { padding: 12, borderWidth: 1, borderRadius: 10, marginTop: 12, width: '100%', overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  select: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: { marginTop: 6, maxHeight: 320, borderWidth: 1, borderRadius: 8 },
});


