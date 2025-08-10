import { audioPlayer } from '../audio';
import { SCALE_PATTERNS, ScaleKey } from './scalePatterns';

const KEY_TO_SEMITONES: Record<ScaleKey, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
};

function noteNameFor(tonic: ScaleKey, semitoneOffset: number, octave: number): string {
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const baseIndex = NOTES.indexOf(tonic);
  const val = baseIndex + semitoneOffset;
  const idx = ((val % 12) + 12) % 12;
  const octaveAdj = Math.floor(val / 12);
  const base = NOTES[idx];
  const name = base.includes('#') ? base.replace('#', 'sharp') : base;
  return `${name}${octave + octaveAdj}`;
}

let abortToken: { aborted: boolean } | null = null;

export function stopScalePlayback(): void {
  if (abortToken) abortToken.aborted = true;
  audioPlayer.stop();
}

export async function playScaleSequence(args: {
  baseUrl: (noteName: string) => string; // resolver for instrument note url
  patternKey: string; // e.g., 'major'
  tonic: ScaleKey; // e.g., 'C'
  direction: 'asc' | 'desc' | 'both';
  bpm: number; // tempo
  onNoteStart?: (noteName: string) => void;
  onNoteEnd?: (noteName: string) => void;
}): Promise<void> {
  const { baseUrl, patternKey, tonic, direction, bpm } = args;
  const pattern = SCALE_PATTERNS[patternKey] || SCALE_PATTERNS.major;
  const msPerBeat = Math.max(150, Math.floor(60000 / Math.max(1, bpm)));

  abortToken = { aborted: false };
  let sequence: string[] = [];
  // Ascending from tonic4 to tonic5
  const ascend: string[] = pattern.map((semitone) => noteNameFor(tonic, semitone, 4));
  const top = noteNameFor(tonic, 0, 5);
  ascend.push(top);

  if (direction === 'asc') {
    sequence = ascend;
  } else if (direction === 'desc') {
    // Descend from tonic5 down to tonic4
    const descend: string[] = [...ascend].reverse();
    sequence = descend;
  } else {
    // both: up then down excluding repeated top note
    const descend: string[] = [...ascend].slice(0, -1).reverse();
    sequence = [...ascend, ...descend];
  }

  try {
    // Debug: print planned sequence
    // eslint-disable-next-line no-console
    console.log('[ScalePlayer] sequence', { patternKey, tonic, direction, bpm, sequence });
  } catch {}

  // Sequential playback using existing audioPlayer; not polyphonic for MVP
  for (const noteName of sequence) {
    if (abortToken.aborted) break;
    try {
      args.onNoteStart?.(noteName);
      try {
        // eslint-disable-next-line no-console
        console.log('[ScalePlayer] note', noteName);
      } catch {}
    const url = baseUrl(noteName);
    await audioPlayer.play(url);
      await new Promise((r) => setTimeout(r, msPerBeat));
      args.onNoteEnd?.(noteName);
    } catch {
      // ignore
    }
  }
  audioPlayer.stop();
}


