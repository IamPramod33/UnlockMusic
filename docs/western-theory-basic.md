# Western Music Theory — Basic Topics

Extracted from `western-intro-theory.md` → Syllabus by Level → Basic Topics (Foundations).

- 1. Keyboard Orientation (Pitch Basics)
  - Middle C, octaves; C-major white keys C–B
  - Keyboard geography; note-to-key mapping
- 2. Ear Training (Starter)
  - Sing/play do‑re‑mi; recognize up/down by step
  - Feel “home” on C (tonic) and simple echoes
- 3. Notation & Staff
  - Clefs (treble, bass), ledger lines, note names A–G
  - Accidentals (sharps, flats, naturals), enharmonics (light)
- 4. Rhythm & Pulse (Basics)
  - Note values, rests, ties, dotted notes
  - Simple meters (2/4, 3/4, 4/4), steady pulse
- 5. Intervals (Intro)
  - Half/whole steps, naming (2nd, 3rd, ...), consonance vs dissonance (intuitive)
- 6. Scales & Key Signatures (Intro)
  - Major scale pattern (W‑W‑H‑W‑W‑W‑H)
  - Circle of fifths (conceptual), reading simple key signatures


## Lesson Approaches (Per Topic)

### 0. Quick Start (2 min)
- Goal: link sound ↔ key ↔ symbol with one win.
- Flow:
  - Tap C, D, E on the keyboard and say the letters out loud.
  - Look at treble staff: tap the matching noteheads to highlight keys.
  - Echo do‑re‑mi; identify “up” vs “down” once.
- Success: 1 correct mapping + 1 correct echo.

### 1. Keyboard Orientation (Pitch Basics)
- **Lesson ID**: `western-basic-keyboard-mapping`
- **Objective**: Understand octaves, Middle C, and find any named pitch on the keyboard.
- **App Components**: `PianoView` (labels on), `audioPlayer`
- **Flow (3–7 min)**:
  - Show Middle C; play C–G–C within one octave (C4–C5).
  - Task: “Find C, F#, Bb” prompts; press to verify; hear the sample.
  - Quick quiz: 6 prompts, shuffled; streak indicator.
- **Assessment**:
  - Find 5/6 prompted notes without hints
  - Identify Middle C twice in a row

### 2. Ear Training (Starter)
- **Lesson ID**: `western-basic-ear-training-starter`
- **Objective**: Develop pitch recognition using Western note names (C-D-E-F-G-A-B); identify melodic direction and intervals by ear.
- **App Components**: `PianoView` (labels on/off), `audioPlayer`, pitch visualization, melodic direction arrows
- **Flow (8–12 min)**:
  
  **Phase 1: Note Recognition (3 min)**
  - Warm-up: Play C, D, E individually; learner identifies by letter name
  - Visual feedback: Piano key highlights + note name appears
  - Progressive difficulty: Start with C-D-E, add F-G, then A-B
  - Success metric: 8/10 correct identifications
  
  **Phase 2: Melodic Direction (3 min)**
  - Two-note sequences: C→D (up), D→C (down), E→F (up), etc.
  - Visual cues: Arrows showing direction, piano keys highlight in sequence
  - Learner answers: "Up" or "Down" buttons
  - Include same-note sequences (C→C) to test attention
  - Success metric: 7/10 correct direction identifications
  
  **Phase 3: Step vs Skip Recognition (4 min)**
  - Three-note sequences: C-D-E (steps), C-E-G (skips), D-F-A (skips)
  - Visual pattern: Show piano keys with step/skip indicators
  - Learner identifies: "Steps" (adjacent notes) vs "Skips" (jumping notes)
  - Include mixed patterns: C-D-F (step then skip)
  - Success metric: 6/8 correct step/skip identifications
  
  **Phase 4: Echo Practice (2 min)**
  - Short melodic phrases: C-D-E, D-E-F, E-F-G
  - Learner echoes by tapping piano keys in sequence
  - Visual feedback: Correct sequence highlights green, errors show red
  - Success metric: Complete 2 phrases without errors

- **UX Features**:
  - **Progressive Difficulty**: Start simple, gradually increase complexity
  - **Visual Reinforcement**: Piano highlights + note names + direction arrows
  - **Audio-Visual Sync**: Perfect timing between sound and visual feedback
  - **Immediate Feedback**: Green/red indicators for correct/incorrect answers
  - **Confidence Building**: Start with easy wins, celebrate small successes
  - **Adaptive Pacing**: Allow learners to repeat sections if needed
  - **Engagement Elements**: 
    - Streak counter for consecutive correct answers
    - "Great ear!" / "Almost there!" encouraging messages
    - Visual progress bar through the lesson
    - Optional "hint" button for struggling learners

- **Assessment**:
  - Phase 1: 8/10 correct note identifications
  - Phase 2: 7/10 correct direction identifications  
  - Phase 3: 6/8 correct step/skip identifications
  - Phase 4: Complete 2 echo phrases without errors
  - Overall: 80% accuracy across all phases to advance

### 3. Notation & Staff
- **Lesson ID**: `western-basic-notation-staff`
- **Objective**: Read notes on treble/bass clefs at a beginner level and map A–G to staff positions.
- **App Components**:
  - Planned staff overlay/renderer (future component)
  - `PianoView` for keyboard mapping reinforcement
- **Flow (5–10 min)**:
  - Micro‑intro: lines/spaces; treble/bass clefs; ledger lines; A–G cycle
  - Tap staff notes → highlight matching key on `PianoView`
  - Drill: Name 8 randomly highlighted notes; optional 2‑second reveal
  - Tip: show enharmonics only as labels (F# = Gb), no extra theory yet
- **Assessment**:
  - 6/8 correct identifications within ~90s
  - Map Middle C across treble/bass once

### 4. Rhythm & Pulse (Basics)
- **Lesson ID**: `western-basic-rhythm-meter`
- **Objective**: Recognize note values and simple meters (2/4, 3/4, 4/4); clap/tap basic rhythms.
- **App Components**: Simple metronome (planned), tap input; text/emoji feedback
- **Flow (4–8 min)**:
  - Intro cards: whole/half/quarter/eighth
  - Tap along to 1–2 bar patterns at 60–80 bpm
  - Task: Identify the meter from a displayed pattern (2/4 vs 3/4 vs 4/4)
- **Assessment**:
  - 3 successful tap‑throughs within ±120ms average error
  - Correctly classify 3 patterns by meter

### 5. Intervals (Intro)
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

### 6. Scales & Key Signatures (Intro)
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

## Implementation Notes
- Audio assets: `/server/public/instruments/piano/{NOTE}.mp3` (e.g., `Csharp4.mp3`).
- For staff visuals and metronome/tap‑trainer, start with lightweight placeholders and text feedback; upgrade to dedicated components later.


