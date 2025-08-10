import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme';
import { AudioPlayerUI } from '../../../components/common';
import type { Lesson } from '../../../services/api';
import { resolveMediaUrl } from '../../../services/api';

type Props = { lesson: Lesson };

export default function CarnaticLessonDetail({ lesson }: Props) {
  const colors = useThemeColors();
  const [scale, setScale] = useState<string>('C');
  const [instrument, setInstrument] = useState<'violin' | 'harmonium' | 'flute'>('violin');
  const [tanpuraOn, setTanpuraOn] = useState(false);
  const [showPlayback, setShowPlayback] = useState(false);
  const [showTanpura, setShowTanpura] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{lesson.musicSystem} • {lesson.difficulty}</Text>
      <View style={{ marginTop: 8, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12 }}>
        <Markdown style={{ body: { color: colors.text } }}>{lesson.content || ''}</Markdown>
      </View>
      <Text style={[styles.section, { color: colors.text }]}>Exercises</Text>
      <FlatList
        data={lesson.exercises}
        keyExtractor={(i) => i.id}
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
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center' }}>No exercises</Text>}
        ListFooterComponent={
          <View>
            {/* Compact Raga Playback */}
            <View style={[styles.playbackRow, { borderColor: colors.border }]}>
              <Pressable onPress={() => setShowPlayback((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Raga Playback</Text>
                <Ionicons name={showPlayback ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
              </Pressable>
              {showPlayback && (
                <View>
                  <View style={{ height: 8 }} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((s) => (
                      <Pressable key={s} onPress={() => setScale(s)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: scale === s ? colors.primary : colors.card }}>
                        <Text style={{ color: scale === s ? '#fff' : colors.text }}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ height: 8 }} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['violin','harmonium','flute'] as const).map((ins) => (
                      <Pressable key={ins} onPress={() => setInstrument(ins)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: instrument === ins ? colors.primary : colors.card }}>
                        <Text style={{ color: instrument === ins ? '#fff' : colors.text, textTransform: 'capitalize' }}>{ins}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ height: 8 }} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable accessibilityLabel="Play raga" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.primary }} onPress={() => { /* TODO */ }}>
                      <Ionicons name="play" color="#fff" size={18} />
                    </Pressable>
                    <Pressable accessibilityLabel="Stop raga" style={{ padding: 10, borderRadius: 999, backgroundColor: colors.border }} onPress={() => { /* TODO */ }}>
                      <Ionicons name="stop" color={colors.text} size={18} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
            {/* Compact Tanpura */}
            <View style={[styles.playbackRow, { borderColor: colors.border }]}>
              <Pressable onPress={() => setShowTanpura((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Tanpura</Text>
                <Ionicons name={showTanpura ? 'chevron-up' : 'chevron-down'} color={colors.muted} size={18} />
              </Pressable>
              {showTanpura && (
                <View style={{ marginTop: 8, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Pressable accessibilityLabel={tanpuraOn ? 'Stop tanpura' : 'Play tanpura'} style={{ padding: 10, borderRadius: 999, backgroundColor: tanpuraOn ? colors.border : colors.success }} onPress={() => setTanpuraOn((v) => !v)}>
                    <Ionicons name={tanpuraOn ? 'stop' : 'play'} color={tanpuraOn ? colors.text : '#0b1220'} size={18} />
                  </Pressable>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Tip: Use tanpura to anchor your ear to {scale}.</Text>
                </View>
              )}
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flex: 1 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  meta: { textAlign: 'center' },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 6 },
  card: { borderColor: '#334155', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 6 },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  cardMeta: { marginTop: 4 },
  playbackRow: { padding: 12, borderWidth: 1, borderRadius: 10, marginTop: 12 },
});


