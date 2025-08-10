import React from 'react';
import { View, Text } from 'react-native';
import { SCALE_PATTERNS, type ScaleKey } from '../../services/music/scalePatterns';

type Props = {
  highlightNotes?: string[]; // e.g., ['C4','D4']
  activeNotes?: string[];
  notation?: 'sharp' | 'flat' | 'plain';
  tonic?: ScaleKey; // starting key for the first note label row (default 'C')
  patternKey?: string; // e.g., 'major'
};

// MVP placeholder: simple row of labels. Replace with SVG keyboard later.
function displayName(name: string, notation: 'sharp' | 'flat' | 'plain'): string {
  // name like 'C4', 'C#4', 'Csharp4'
  let n = name.replace('sharp', '#');
  if (notation === 'flat') {
    n = n
      .replace('C#', 'Db')
      .replace('D#', 'Eb')
      .replace('F#', 'Gb')
      .replace('G#', 'Ab')
      .replace('A#', 'Bb');
  }
  return n;
}

function generateChromaticOctaveFromTonic(tonic: ScaleKey = 'C'): string[] {
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const start = NOTES.indexOf(tonic);
  const rotated = [...NOTES.slice(start), ...NOTES.slice(0, start)];
  return rotated.map((n) => `${n}4`);
}

function generateScaleRow(tonic: ScaleKey, patternKey: string | undefined): string[] {
  const pattern = SCALE_PATTERNS[patternKey || 'major'] || SCALE_PATTERNS.major;
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const start = NOTES.indexOf(tonic);
  const row: string[] = [];
  pattern.forEach((semitone) => {
    const idx = (start + semitone) % 12;
    row.push(`${NOTES[idx]}4`);
  });
  // add octave tonic (next octave)
  row.push(`${tonic}5`);
  return row;
}

export default function PianoView({ highlightNotes = [], activeNotes = [], notation = 'sharp', tonic = 'C', patternKey = 'major' }: Props) {
  const noteRow = generateScaleRow(tonic, patternKey);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {noteRow.map((n) => {
        const isActive = activeNotes.includes(n);
        const isHighlight = highlightNotes.includes(n);
        return (
          <View key={n} style={{ paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: isActive ? '#2563EB' : isHighlight ? '#E5E7EB' : '#F3F4F6' }}>
            <Text style={{ color: isActive ? '#fff' : '#111827', fontWeight: isHighlight ? '700' : '500' }}>{displayName(n, notation)}</Text>
          </View>
        );
      })}
    </View>
  );
}


