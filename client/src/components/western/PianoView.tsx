import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, useWindowDimensions, View, ScrollView } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
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
  showLabels?: boolean;
  labelColor?: string;
  labelMode?: 'note' | 'degree';
  octaves?: number[]; // which octaves to render (e.g., [3,4,5])
  scrollable?: boolean; // allow horizontal scroll instead of scaling to screen
  whiteKeyWidth?: number; // base width in viewBox units
  whiteKeyHeight?: number; // base height in viewBox units
  initialOctave?: number; // when scrollable, auto-scroll so this octave starts in view
  context?: 'mini' | 'drill' | 'default'; // UI behavior context
  autoScrollToHighlight?: boolean; // if true, auto-scroll to highlighted note
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

function computeScaleSet(tonic: ScaleKey, patternKey: string | undefined, octaves: number[]): Set<string> {
  const pattern = SCALE_PATTERNS[patternKey || 'major'] || SCALE_PATTERNS.major;
  const CHROMA = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const start = CHROMA.indexOf(tonic);
  const set = new Set<string>();
  octaves.forEach((oct) => {
    pattern.forEach((st) => {
      const idx = (start + st) % 12;
      set.add(`${CHROMA[idx]}${oct}`);
    });
  });
  const maxOct = Math.max(...octaves);
  set.add(`${tonic}${maxOct + 1}`); // top tonic for highest octave
  return set;
}

export default function PianoView({ highlightNotes = [], activeNotes = [], notation = 'sharp', tonic = 'C', patternKey = 'major', enableTouch = false, onKeyDown, onKeyUp, showLabels = false, labelColor = '#0f172a', labelMode = 'note', octaves = [4], scrollable = false, whiteKeyWidth = 56, whiteKeyHeight = 160, initialOctave, context = 'default', autoScrollToHighlight = true }: Props) {
  const screenW = useWindowDimensions().width;
  const baseWhiteKeyW = whiteKeyWidth;
  const baseWhiteKeyH = whiteKeyHeight;
  const numWhiteKeys = octaves.length * WHITE_KEYS_ORDER.length;
  const baseWidth = numWhiteKeys * baseWhiteKeyW;
  const baseHeight = baseWhiteKeyH;
  const maxWidth = scrollable ? baseWidth : Math.min(screenW - 32, baseWidth);
  const scale = scrollable ? 1 : maxWidth / baseWidth;
  const whiteKeyW = baseWhiteKeyW * scale;
  const whiteKeyH = baseWhiteKeyH * scale;
  const blackKeyW = (baseWhiteKeyW * 0.65) * scale;
  const blackKeyH = (baseWhiteKeyH * 0.6) * scale;

  const scrollRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    if (!scrollable || !initialOctave || !octaves?.length) return;
    const idx = Math.max(0, octaves.findIndex((o) => o === initialOctave));
    const x = Math.max(0, idx) * 7 * whiteKeyW;
    // Defer to ensure ScrollView is ready
    const id = setTimeout(() => {
      try {
        scrollRef.current?.scrollTo({ x, y: 0, animated: false });
      } catch {}
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollable, initialOctave, octaves?.length, whiteKeyW]);

  const scaleSet = useMemo(() => computeScaleSet(tonic, patternKey, octaves), [tonic, patternKey, octaves]);
  const degreeMap = useMemo(() => {
    if (labelMode !== 'degree') return new Map<string, number>();
    const CHROMA = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const start = CHROMA.indexOf(tonic);
    const pattern = SCALE_PATTERNS[patternKey || 'major'] || SCALE_PATTERNS.major;
    const map = new Map<string, number>();
    pattern.forEach((st, idx) => {
      const pc = CHROMA[((start + st) % 12 + 12) % 12];
      map.set(pc, idx + 1);
    });
    // Degree for top tonic
    map.set(tonic, 1);
    return map;
  }, [labelMode, tonic, patternKey]);
  const [pressedSet, setPressedSet] = useState<Set<string>>(new Set());
  const activeSet = useMemo(() => {
    const s = new Set(activeNotes);
    pressedSet.forEach((n) => s.add(n));
    return s;
  }, [activeNotes, pressedSet]);
  const highlightSet = useMemo(() => new Set(highlightNotes.length ? highlightNotes : Array.from(scaleSet)), [highlightNotes, scaleSet]);

  // Build layout positions for provided octaves
  const whiteKeys: Array<{ note: string; x: number; y: number; w: number; h: number }> = [];
  const blackKeys: Array<{ note: string; x: number; y: number; w: number; h: number }> = [];

  let xCursor = 0;
  octaves.forEach((oct) => {
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
    if (highlightSet.has(note)) return isBlack ? '#f59e0b' : '#fde68a';
    return isBlack ? '#0f172a' : '#ffffff';
  }

  function strokeFor(note: string): { color: string; width: number } {
    if (highlightSet.has(note)) return { color: '#2563EB', width: 2 };
    return { color: '#0f172a', width: 1 };
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

  function eventsFor(note: string) {
    if (!enableTouch) return {} as any;
    return {
      onPressIn: () => handlePressIn(note),
      onPressOut: () => handlePressOut(note),
    } as any;
  }

  const svg = (
    <Svg width={maxWidth} height={whiteKeyH} viewBox={`0 0 ${baseWidth} ${baseHeight}`}>
        {/* White keys behind */}
        {whiteKeys.map((k) => (
          <Rect
            key={`w-${k.note}`}
            x={k.x}
            y={k.y}
            width={k.w}
            height={k.h}
            fill={colorFor(k.note, false)}
            stroke={strokeFor(k.note).color}
            strokeWidth={strokeFor(k.note).width}
             {...(Platform.OS === 'web'
               ? ({
                   onClick: () => { handlePressIn(k.note); setTimeout(() => handlePressOut(k.note), 120); },
                   onMouseDown: () => handlePressIn(k.note),
                   onMouseUp: () => handlePressOut(k.note),
                   onTouchStart: () => handlePressIn(k.note),
                   onTouchEnd: () => handlePressOut(k.note),
                 } as any)
               : eventsFor(k.note))}
          />
        ))}
        {/* Labels for white keys */}
        {showLabels && whiteKeys.map((k) => {
          const pc = k.note.replace(/[0-9]/g, '');
          const label = labelMode === 'degree' ? (degreeMap.get(pc)?.toString() || '') : k.note;
          if (!label) return null;
          return (
            <SvgText
              key={`l-${k.note}`}
              x={k.x + k.w / 2}
              y={k.y + k.h - 8}
              fontSize={10 * scale}
              fill={labelColor}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
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
            stroke={strokeFor(k.note).color}
            strokeWidth={strokeFor(k.note).width}
             {...(Platform.OS === 'web'
               ? ({
                   onClick: () => { handlePressIn(k.note); setTimeout(() => handlePressOut(k.note), 120); },
                   onMouseDown: () => handlePressIn(k.note),
                   onMouseUp: () => handlePressOut(k.note),
                   onTouchStart: () => handlePressIn(k.note),
                   onTouchEnd: () => handlePressOut(k.note),
                 } as any)
               : eventsFor(k.note))}
          />
        ))}
      </Svg>
  );

  if (scrollable) {
    // Auto-scroll to keep the first highlighted note roughly centered
    useEffect(() => {
      if (!scrollable || !autoScrollToHighlight || !highlightNotes?.length) return;
      const target = highlightNotes[0];
      // Try to find either white or black key position
      let match: { x: number; w: number } | null = null;
      const wHit = whiteKeys.find((k) => k.note === target);
      if (wHit) match = { x: wHit.x, w: wHit.w };
      if (!match) {
        const bHit = blackKeys.find((k) => k.note === target);
        if (bHit) match = { x: bHit.x, w: bHit.w };
      }
      if (!match) return;
      const centerX = Math.max(0, match.x - (screenW - match.w) / 2);
      const id = setTimeout(() => {
        try {
          scrollRef.current?.scrollTo({ x: centerX, y: 0, animated: true });
        } catch {}
      }, 0);
      return () => clearTimeout(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(highlightNotes), scrollable, screenW, JSON.stringify(octaves), whiteKeyW, autoScrollToHighlight, context]);
    return (
      <View>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
          {svg}
        </ScrollView>
      </View>
    );
  }

  return <View>{svg}</View>;
}


