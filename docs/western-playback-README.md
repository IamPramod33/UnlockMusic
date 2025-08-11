# Western Music: Piano Scale Playback and Visualization

## Overview
Goal: Provide a piano keyboard visualization that highlights keys for the selected western scale/mode and animates keys as they are played (audio + visual sync). Supports scale selection, tonic (key) transposition, instrument (piano default), and practice options (stepwise, arpeggio, hands/voices, tempo).

## User Experience
- Scales: choose a scale pattern (Major, Natural Minor, Harmonic/Melodic Minor, or modes Ionian…Locrian) and a tonic key (C…B).
- Key selector (tonic): 12 keys (C … B including sharps/flats); default C.
- Visualization: full or compact piano (2–4 octaves) with highlighted scale degrees and real‑time key press animation.
- Playback controls: Play/Pause/Stop, Tempo, Direction (ascending/descending), Pattern (stepwise, 3rds, arpeggio, broken chords).
- Options:
  - Show note names (C, D, …) and scale degrees (1, 2, b3, …)
  - Metronome on/off
  - Octave range (e.g., C4–C5 by default)
- Accessibility: keyboard navigation and screen-reader labels; sufficient contrast for highlighted keys.

## Scale Theory Mapping
Represent scales as semitone patterns relative to tonic (0 = tonic):
- Major (Ionian): [0, 2, 4, 5, 7, 9, 11]
- Natural Minor (Aeolian): [0, 2, 3, 5, 7, 8, 10]
- Harmonic Minor: [0, 2, 3, 5, 7, 8, 11]
- Melodic Minor (ascending): [0, 2, 3, 5, 7, 9, 11] (descending ≈ natural minor)
- Modes (relative to Ionian):
  - Ionian: [0,2,4,5,7,9,11]
  - Dorian: [0,2,3,5,7,9,10]
  - Phrygian: [0,1,3,5,7,8,10]
  - Lydian: [0,2,4,6,7,9,11]
  - Mixolydian: [0,2,4,5,7,9,10]
  - Aeolian: [0,2,3,5,7,8,10]
  - Locrian: [0,1,3,5,6,8,10]

Given a tonic MIDI (e.g., C4 = 60), scale notes = tonic + pattern, optionally extended to multiple octaves.

See also: [Western Lesson Detail Component (UI + Behavior)](./western-lesson-detail.md)

## Piano Visualization
- Web
  - Canvas or SVG for keyboard rendering; maintain aspect ratio responsive layout.
  - Key geometry: white keys (C,D,E,F,G,A,B), black keys (C#, D#, F#, G#, A#) overlay.
  - Highlight logic: keys that belong to selected scale (different fill/stroke).
  - Animation: on note on/off, flash/press effect (color change + slight key depression illusion).
- Mobile (React Native)
  - Use `react-native-svg` or `@shopify/react-native-skia` to draw keys similarly.
  - Keep to 2–3 octaves for space; allow horizontal scroll for more.

## Audio Generation
- Preferred: Soundfont-based playback (Piano) to avoid licensing overhead
  - Web: use WebAudio + soundfont (e.g., `soundfont-player`, or load an SF2/SFZ via a suitable wrapper).
  - Mobile (Expo AV): ship per-note short samples (C4–B4) under `server/public/instruments/piano/` or use a compact soundfont player if available; pitch-shift small intervals when needed.
- Sequencing
  - Tempo (BPM) → note duration (e.g., quarter = 60000/BPM ms)
  - Stepwise scale: ascend then descend or as configured
  - Arpeggios: triads/7ths derived from the scale; broken chord patterns
  - Metronome: click on beats (sine/click buffer)

## Interaction
- Keyboard clicks/taps: audition individual notes; reflect in audio/visual.
- Hotkeys (web): space = play/pause; arrows to change tonic/scale (optional).
- Tooltips: show note name + degree on hover/focus.

## Data Structures (Example)
```ts
// scale patterns
const SCALE_PATTERNS: Record<string, number[]> = {
  major: [0,2,4,5,7,9,11],
  naturalMinor: [0,2,3,5,7,8,10],
  harmonicMinor: [0,2,3,5,7,8,11],
  melodicMinorAsc: [0,2,3,5,7,9,11],
  ionian: [0,2,4,5,7,9,11],
  dorian: [0,2,3,5,7,9,10],
  // ...
};

// keyboard range
const KEY_RANGE = { low: 48 /* C3 */, high: 72 /* C5 */ };
```

## Implementation Steps (MVP)
1. Build a `PianoView` component (web/mobile) that renders keys for a selectable range; props: `highlightNotes: number[]`, `activeNotes: number[]`.
2. Add a `ScalePlayer` service: given tonic, pattern, tempo, and range → schedule notes.
3. Wire UI controls for scale/mode and tonic; update highlight set → `tonic + pattern` across octaves within range.
4. Implement audio via soundfont/samples; sync note on/off with key visuals.
5. Add metronome and patterns (stepwise, arpeggio) as optional toggles.

## UX Notes (Retention)
- Progressive disclosure: compact controls by default, expand advanced options.
- Immediate feedback: pressing a key plays instantly, with subtle animations.
- Goal framing: show “You’re practicing C [Selected Scale]” (e.g., C Ionian/Major) and a small streak counter.
- Micro-chunks: 30–60s practice prompts; “Next: D Dorian in 1 octave”.

## Asset Sourcing
- Generate your own using a piano soundfont to avoid licensing friction:
  - Render MIDI → WAV (Fluidsynth) → MP3 (ffmpeg); store under `server/public/instruments/piano/{NOTE}.mp3` when needed.
- Public sources (verify license): University of Iowa MIS, VSCO2 CE, GeneralUser GS, Philharmonia samples, FreeSound CC0.

## Accessibility
- Ensure focusable controls and ARIA labels; sufficient contrast for highlighted keys.
- Provide text labels for note names/scale degrees that screen readers can read.

## Optional OpenAI Aids
- Generate short practice prompts (“Play 1–3–5–3 on C Major”) tailored to skill and recently practiced keys.
- Provide quick explanations (differences between modes) and suggest next scale.

## Folder Layout (Proposed)
- `client/src/components/western/PianoView.*`
- `client/src/services/music/scalePatterns.ts`
- `server/public/instruments/piano/{C4..B4}.mp3` (optional)

## Acceptance Criteria
- Selecting a scale and tonic updates highlighted keys instantly.
- Play animates key presses with correct audio and tempo; stop halts both.
- Works on Web/iOS/Android with low latency for single-note auditions.

## Exercises (Scales)
Curated practice ideas from well-regarded pedagogy for scales (start with Major, then extend to Minor/Modes). Adapt and verify licensing if quoting verbatim:
- Scale Fundamentals
  - One octave hands-separate at 60–72 BPM, quarter notes; focus on smooth fingering and even tone.
  - Two octaves hands-together at 72–96 BPM; use standard fingerings (e.g., C: RH 1-2-3-1-2-3-4-5; LH 5-4-3-2-1-3-2-1).
  - Rhythmic variants: long-short and short-long on each pair to improve control.
- Articulation and Dynamics
  - Staccato up, legato down; reverse; crescendo ascending, decrescendo descending.
  - Accented degrees (1 and 5) to reinforce tonic/dominant sense.
- Patterns and Intervals
  - Thirds: play 1–3–2–4–3–5 … up and down (hands separate); later hands together.
  - Sixths: complementary interval practice for melodic control.
  - Arpeggios: I (maj), IV (maj), V (maj) triads; later 7th chords (IMaj7, IIm7, V7) in the key.
- Coordination and Metronome
  - Start with 2 notes per click; progress to 4 notes per click as control improves.
  - Use a light swing feel occasionally to reduce tension and promote flow.
- Sight and Theory Integration
  - Say note names or scale degrees aloud while playing.
  - Identify key signature and scale degree functions on the staff.

References to explore (instructors/texts typically cite):
- Hanon The Virtuoso Pianist (scale technique drills)
- Czerny exercises (various opuses)
- ABRSM and RCM scale requirements (structured progression across grades)
