import React, { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { SCALE_PATTERNS, type ScaleKey } from '../../services/music/scalePatterns';

type Props = {
  highlightNotes?: string[]; // e.g., ['C4','D4']
  activeNotes?: string[];
  notation?: 'sharp' | 'flat' | 'plain';
  tonic?: ScaleKey; // starting key for the first note label row (default 'C')
  patternKey?: string; // e.g., 'major'
  enableTouch?: boolean;
  onKeyDown?: (note: string) => void;
  onKeyUp?: (note: string) => void;
};

// Simple two-octave keyboard (C4–B5) SVG with highlight/active rendering
const WHITE_KEYS_ORDER = ['C','D','E','F','G','A','B'] as const;
const BLACK_KEYS_MAP: Record<string, string | null> = {
  C: 'C#', D: 'D#', E: null, F: 'F#', G: 'G#', A: 'A#', B: null,
};

function buildNoteList(octaves: number[] = [4, 5]) {
  const notes: string[] = [];
  octaves.forEach((oct) => {
    WHITE_KEYS_ORDER.forEach((w) => {
      notes.push(`${w}${oct}`);
      const b = BLACK_KEYS_MAP[w];
      if (b) notes.push(`${b}${oct}`);
    });
  });
  return notes;
}

function computeScaleSet(tonic: ScaleKey, patternKey?: string): Set<string> {
  const pattern = SCALE_PATTERNS[patternKey || 'major'] || SCALE_PATTERNS.major;
  const CHROMA = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const start = CHROMA.indexOf(tonic);
  const set = new Set<string>();
  [4, 5].forEach((oct) => {
    pattern.forEach((st) => {
      const idx = (start + st) % 12;
      set.add(`${CHROMA[idx]}${oct}`);
    });
  });
  set.add(`${tonic}6`); // top tonic
  return set;
}

export default function PianoView({ highlightNotes = [], activeNotes = [], notation = 'sharp', tonic = 'C', patternKey = 'major', enableTouch = false, onKeyDown, onKeyUp }: Props) {
  const width = 560; // 14 white keys * 40
  const screenW = useWindowDimensions().width;
  const maxWidth = Math.min(screenW - 32, width); // keep some padding
  const scale = maxWidth / width;
  const whiteKeyW = 40 * scale;
  const whiteKeyH = 120 * scale;
  const blackKeyW = 26 * scale;
  const blackKeyH = 72 * scale;

  const scaleSet = useMemo(() => computeScaleSet(tonic, patternKey), [tonic, patternKey]);
  const [pressedSet, setPressedSet] = useState<Set<string>>(new Set());
  const activeSet = useMemo(() => {
    const s = new Set(activeNotes);
    pressedSet.forEach((n) => s.add(n));
    return s;
  }, [activeNotes, pressedSet]);
  const highlightSet = useMemo(() => new Set(highlightNotes.length ? highlightNotes : Array.from(scaleSet)), [highlightNotes, scaleSet]);

  // Build layout positions for two octaves C4–B5 (14 white keys)
  const whiteKeys: Array<{ note: string; x: number; y: number; w: number; h: number }> = [];
  const blackKeys: Array<{ note: string; x: number; y: number; w: number; h: number }> = [];

  let xCursor = 0;
  [4, 5].forEach((oct) => {
    WHITE_KEYS_ORDER.forEach((w) => {
      const note = `${w}${oct}`;
      whiteKeys.push({ note, x: xCursor, y: 0, w: whiteKeyW, h: whiteKeyH });
      // black key between C-D, D-E, F-G, G-A, A-B
      const black = BLACK_KEYS_MAP[w];
      if (black) {
        const bx = xCursor + whiteKeyW - blackKeyW / 2;
        blackKeys.push({ note: `${black}${oct}`, x: bx, y: 0, w: blackKeyW, h: blackKeyH });
      }
      xCursor += whiteKeyW;
    });
  });

  function colorFor(note: string, isBlack: boolean): string {
    if (activeSet.has(note)) return '#2563EB';
    if (highlightSet.has(note)) return isBlack ? '#94a3b8' : '#e2e8f0';
    return isBlack ? '#0f172a' : '#ffffff';
  }

  function handlePressIn(note: string): void {
    if (!enableTouch) return;
    setPressedSet((prev) => new Set(prev).add(note));
    onKeyDown && onKeyDown(note);
  }

  function handlePressOut(note: string): void {
    if (!enableTouch) return;
    setPressedSet((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    onKeyUp && onKeyUp(note);
  }

  return (
    <View>
      <Svg width={maxWidth} height={whiteKeyH} viewBox={`0 0 ${width} ${120}`}>
        {/* White keys behind */}
        {whiteKeys.map((k) => (
          <Rect
            key={`w-${k.note}`}
            x={k.x}
            y={k.y}
            width={k.w}
            height={k.h}
            fill={colorFor(k.note, false)}
            stroke="#0f172a"
            strokeWidth={1}
            onPressIn={() => handlePressIn(k.note)}
            onPressOut={() => handlePressOut(k.note)}
          />
        ))}
        {/* Black keys on top */}
        {blackKeys.map((k) => (
          <Rect
            key={`b-${k.note}`}
            x={k.x}
            y={k.y}
            width={k.w}
            height={k.h}
            fill={colorFor(k.note, true)}
            rx={2}
            onPressIn={() => handlePressIn(k.note)}
            onPressOut={() => handlePressOut(k.note)}
          />
        ))}
      </Svg>
    </View>
  );
}


