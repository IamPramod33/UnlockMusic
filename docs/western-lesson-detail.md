# Western Lesson Detail Component (UI + Behavior)

## Purpose
This document describes the concrete functionality implemented in the Western lesson detail screen, including UI layout, interactions, audio playback, and the piano visualization.

## Key Files
- `client/src/screens/Lessons/western/WesternLessonDetail.tsx`
- `client/src/components/western/PianoView.tsx`
- `client/src/services/music/scalePlayer.ts`
- `client/src/services/music/scalePatterns.ts`
- `client/src/services/audio/index.ts`
- `server/public/instruments/piano/`

## UI Structure
- Header
  - Title with the word "Scales" (replacing "Major scales" when present)
  - Compact badges: `musicSystem` and `difficulty`
- Practice (collapsible, default: expanded)
  - Micro goal prompt (auto-generated based on selected pattern/key)
  - Streak counter (local storage)
  - 60s session timer with play/pause
- Scales (collapsible, default: expanded)
  - Scale Pattern selector (Major, Minor variants, Modes)
  - Key (Tonic) selector across 12 keys
  - Direction: ascending / descending / both
  - Controls: Play / Stop
- Piano Visualization (collapsible, default: expanded)
  - SVG keyboard (C4…B5 baseline) that adapts to selected tonic (first note label reflects tonic4)
  - Touch audition: tap keys to play a single note
  - Active note highlighting during playback and touch
- Exercises
  - Hidden for "major scales" lessons at this stage; otherwise shows lesson exercises with optional audio

## Core Behaviors
- Scale sequencing
  - Uses `SCALE_PATTERNS` to compute semitone offsets relative to selected tonic
  - Plays from tonic4 to tonic5 with correct octave transitions (e.g., D4 ascending crosses to C#5 correctly)
  - Supports `asc`, `desc`, and `both`
  - Console logs the currently playing note for debugging
- Audio mapping
  - Note names transformed for assets: `C#4` -> `Csharp4.mp3`
  - Files served from `API_URL/instruments/piano/{NOTE}.mp3`
  - Web uses Howler; native uses Expo AV via a shared `AudioPlayer`
- Visual sync
  - `onNoteStart` / `onNoteEnd` callbacks update `activePianoNotes`
  - `PianoView` highlights the currently playing note(s)
- Touch audition
  - Tapping a key stops any in-progress scale playback, plays that key’s note, and highlights it until released
- Notation
  - Auto-sets notation: keys with sharps use `sharp` display; otherwise `flat` (labels adapt)

## State Overview (selected)
- `selectedPattern`: current scale pattern key
- `selectedKey`: tonic (C…B, including sharps)
- `direction`: asc | desc | both
- `activePianoNotes`: list of active note names (e.g., `C#4`)
- `showPracticePanel` / `showScalePlayer` / `showPianoVisualization`: collapsible toggles
- `streak`, `sessionActive`, `secondsLeft`: retention aids

## Theming & Accessibility
- Colors sourced from `useThemeColors` for light/dark consistency
- Pressables have readable labels; ensure sufficient contrast on highlights

## Assets & Naming
- Piano assets should follow the "sharp" naming convention: `Csharp4.mp3`, `Dsharp4.mp3`, …
- Place under `server/public/instruments/piano/`
- Backend serves these via an Express static route at `/instruments`

## Extensibility
- Add metronome click and tempo control UI
- Add arpeggio/interval patterns (3rds, 6ths), broken chords
- Expand range to 2+ octaves; optionally horizontal scroll
- Soundfont-based fallback to reduce per-note asset needs (future)

## Acceptance Criteria (implemented)
- Selecting scale and tonic updates highlights instantly
- Play animates keys with correct audio (asset path and octave) and stops cleanly
- Touch audition works with low latency and visual feedback
- Works on Web/iOS/Android under existing audio stack

## Known Limitations
- No metronome or tempo knob in UI yet (tempo fixed in sequencing call)
- Assumes `.mp3` assets (`.ogg` fallback not wired)
- Exercises hidden for "major scales" lesson types temporarily

## Related
- See `docs/western-playback-README.md` for broader design, theory, and UX rationale
