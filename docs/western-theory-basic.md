# Western Music Theory — Basic Topics

Extracted from `western-intro-theory.md` → Syllabus by Level → Basic Topics (Foundations).

- Notation & Staff
  - Clefs (treble, bass), ledger lines, note names A–G
  - Accidentals (sharps, flats, naturals), enharmonics
- Pitch & Keyboard Mapping
  - Middle C, octaves, chromatic vs diatonic notes
  - Keyboard geography; note-to-key mapping
- Rhythm & Meter
  - Note values, rests, ties, dotted notes
  - Simple meters (2/4, 3/4, 4/4), tempo basics, subdivision
- Intervals (Intro)
  - Half/whole steps, naming (2nd, 3rd, ...), consonance vs dissonance (intuitive)
- Scales & Key Signatures (Intro)
  - Major scale pattern (W-W-H-W-W-W-H)
  - Circle of fifths (conceptual), reading simple key signatures
- Ear Training (Starter)
  - Sing/play do-re-mi; recognize steps up/down, tonic stability


## Lesson Approaches (Per Topic)

### Notation & Staff
- **Lesson ID**: `western-basic-notation-staff`
- **Objective**: Read notes on treble/bass clefs at a beginner level and map A–G to staff positions.
- **App Components**:
  - Planned staff overlay/renderer (future component)
  - `PianoView` for keyboard mapping reinforcement
- **Flow (5–10 min)**:
  - Micro‑intro: staff lines/spaces, clefs, ledger lines; A–G cycle
  - Tap staff notes (planned overlay) → show corresponding key on `PianoView`
  - Drill: Name 10 randomly highlighted notes; reveal answer after 2s
  - Reinforce concept of enharmonics when relevant (e.g., F# vs Gb labeling)
- **Assessment**:
  - 8/10 correct note identifications within 90s
  - Correctly map Middle C across treble/bass once

### Pitch & Keyboard Mapping
- **Lesson ID**: `western-basic-keyboard-mapping`
- **Objective**: Understand octaves, Middle C, and find any named pitch on the keyboard.
- **App Components**: `PianoView` (labels on), `audioPlayer`
- **Flow (3–7 min)**:
  - Show Middle C, explain octaves (C3–C5 target range)
  - Task: “Find C, F#, Bb” prompts; press to verify; play sample via `audioPlayer`
  - Quick quiz: 8 prompts, shuffled, with streak indicator
- **Assessment**:
  - Find 6/8 prompted notes without hints
  - Identify Middle C twice in a row

### Rhythm & Meter
- **Lesson ID**: `western-basic-rhythm-meter`
- **Objective**: Recognize note values and simple meters (2/4, 3/4, 4/4); clap/tap basic rhythms.
- **App Components**: Simple metronome (planned), tap input; text/emoji feedback
- **Flow (4–8 min)**:
  - Intro cards: whole/half/quarter/eighth; dotted; rests at a glance
  - Metronome 60–80 bpm; tap along to short 1–2 bar patterns
  - Task: Identify the meter from a displayed pattern (2/4 vs 3/4 vs 4/4)
- **Assessment**:
  - 3 successful tap‑throughs within ±120ms average error
  - Correctly classify 3 patterns by meter

### Intervals (Intro)
- **Lesson ID**: `western-basic-intervals-intro`
- **Objective**: Distinguish half vs whole steps; name simple intervals by number (2nd, 3rd...).
- **App Components**: `PianoView` with two‑note highlight; `audioPlayer`
- **Flow (5–10 min)**:
  - Demo: C→C# (half step), C→D (whole step); play and show labels
  - Task: Listen to two notes; choose “step” or “skip”; show correct keyboard mapping
  - Build intervals: from a tonic, step through the major scale degrees by number
- **Assessment**:
  - 8/10 correct step/skip identifications
  - Build 5 intervals by choosing the second note correctly

### Scales & Key Signatures (Intro)
- **Lesson ID**: `western-basic-scales-keys-intro`
- **Objective**: Build the major scale using W‑W‑H‑W‑W‑W‑H; recognize simple key signatures conceptually.
- **App Components**: `PianoView`, `playScaleSequence`, `SCALE_PATTERNS.major`
- **Flow (5–10 min)**:
  - Stepper: advance through the major pattern; highlight notes on `PianoView`
  - Play C major ascending/descending using `playScaleSequence`
  - Circle of fifths concept: switch keys (C→G→D) and observe sharps count
- **Assessment**:
  - Correctly build a major scale in 2 keys using the stepper without hints
  - State the pattern from memory once (W‑W‑H‑W‑W‑W‑H)

### Ear Training (Starter)
- **Lesson ID**: `western-basic-ear-training-starter`
- **Objective**: Sing/play do‑re‑mi; feel tonic stability; identify up/down motion.
- **App Components**: `PianoView` (labels on), `audioPlayer`
- **Flow (3–7 min)**:
  - Do‑re‑mi playback; learner echoes; then press highlighted keys
  - Task: Hear two notes; answer “up/down” and “by step/skip”
  - Optionally hide labels for a short challenge round
- **Assessment**:
  - 6/8 correct “up/down + step/skip” responses
  - One clean do‑re‑mi echo sequence

## Implementation Notes
- Audio assets: `/server/public/instruments/piano/{NOTE}.mp3` (e.g., `Csharp4.mp3`).
- For staff visuals and metronome/tap‑trainer, start with lightweight placeholders and text feedback; upgrade to dedicated components later.


