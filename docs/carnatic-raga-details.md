# Carnatic Raga Details Component (UI + Behavior)

## Purpose
Define the UI and behavior for Carnatic lesson details where a user selects a raga from a dropdown and hears/visualizes its notes on a piano keyboard. Includes tonic selection, tanpura drone, and practice aids.

## Key Files (implemented)
- `client/src/components/carnatic/CarnaticRaga.tsx` (main component)
- `client/src/screens/Lessons/CarnaticRagasScreen.tsx` (dedicated screen)
- `client/src/components/western/PianoView.tsx` (reused for visualization)
- `client/src/services/music/ragaPlayer.ts` (raga data and playback logic)
- `client/src/services/music/tanpura.ts` (tanpura drone functionality)
- `client/src/services/audio/index.ts` (shared AudioPlayer)
- `server/public/instruments/piano/` (per-note piano assets, e.g., `Csharp4.mp3`)
- `server/public/tanpura/` (tonic drones)

## Current Implementation Status

### ✅ Implemented Features
- **Raga Playback Section**: Category selector (Popular/Melakarta/Janya), raga dropdown, tonic selection, direction controls
- **Piano Visualization**: SVG keyboard with raga note highlighting and touch audition
- **Tanpura Playback**: Toggle control with automatic tonic matching
- **Collapsible Sections**: All major sections can be expanded/collapsed
- **Cross-platform Audio**: Works on Web/iOS/Android using unified AudioPlayer
- **Theming**: Consistent light/dark mode using `useThemeColors`

### 🔄 Partially Implemented
- **Practice Section**: Not yet implemented (streak counter, session timer, micro-goals)
- **Exercises**: Not yet implemented

## UI Structure (Current)
- **Raga Playback** (collapsible, default: expanded)
  - Category selector: `Popular` / `Melakarta` / `Janya`
  - Raga selector: Searchable dropdown with full raga list
  - Tonic selector (Sa): 12 keys (C…B); default C
  - Direction: `arohana` / `avarohana` / `both`
  - Controls: Play / Stop (tempo fixed at 80 BPM)
- **Piano Visualization** (collapsible, default: expanded)
  - SVG keyboard with raga note highlighting
  - Animates key presses during playback
  - Touch audition: tap keys to hear notes
- **Tanpura** (collapsible, default: expanded)
  - Toggle: On/Off with play/stop button
  - Automatic tonic matching
  - Tip text for user guidance

## Raga Dataset (Current)

### Melakarta Ragas (72)
- **Implementation**: Programmatically generated using standard Chakra patterns
- **Naming**: Uses traditional Melakarta names (Kanakangi, Ratnangi, etc.)
- **Structure**: Each raga has proper arohana/avarohana in swara notation
- **Example**: Mayamalavagowla (Mela 15) - `S,R1,G3,M1,P,D1,N3,S`

### Janya Ragas (17)
- **Abhogi** (Mela 22): `S,R2,G2,M1,D2,S` / `S,D2,M1,G2,R2,S`
- **Abheri** (Mela 22): `S,G2,M1,P,N2,S` / `S,N2,D2,P,M1,G2,R2,S`
- **Mohanam** (Mela 28): `S,R2,G3,P,D2,S` / `S,D2,P,G3,R2,S`
- **Hamsadhwani** (Mela 29): `S,R2,G3,P,N3,S` / `S,N3,P,G3,R2,S`
- **Hindolam** (Mela 20): `S,G2,M1,D1,N2,S` / `S,N2,D1,M1,G2,S`
- **Shuddha Saveri** (Mela 29): `S,R2,M1,P,D2,S` / `S,D2,P,M1,R2,S`
- **Kambhoji** (Mela 28): `S,R2,G3,M1,P,D2,S` / `S,N2,D2,P,M1,G3,R2,S`
- **Bilahari** (Mela 29): `S,R2,G3,P,D2,S` / `S,N3,D2,P,M1,G3,R2,S`
- **Madhyamavathi** (Mela 22): `S,R2,M1,P,N2,S` / `S,N2,P,M1,R2,S`
- **Sriranjani** (Mela 22): `S,R2,G2,M1,D2,S` / `S,D2,M1,G2,R2,S`
- **Arabhi** (Mela 29): `S,R2,M1,P,D2,S` / `S,N2,D2,P,M1,R2,S`
- **Kedaragowla** (Mela 29): `S,M1,G3,M1,P,N2,S` / `S,N2,D2,P,M1,G3,R2,S`
- **Reetigowla** (Mela 22): `S,R2,G2,M1,N2,D2,N2,S` / `S,N2,D2,M1,G2,R2,S`
- **Sahana** (Mela 28): `S,R2,G3,M1,P,M1,D2,N2,S` / `S,N2,D2,P,M1,G3,R2,S`
- **Pantuvarali** (Mela 51): `S,R1,G3,M2,P,D1,N3,S` / `S,N3,D1,P,M2,G3,R1,S`
- **Yamunakalyani** (Mela 65): `S,R2,G3,P,D2,S` / `S,N3,D2,P,M2,G3,R2,S`
- **Lalitha** (Mela 15): `S,R1,G3,M1,D1,N3,S` / `S,N3,D1,M1,G3,R1,S`

### Popular Ragas (23)
- **Melakarta**: Mayamalavagowla, Kharaharapriya, Harikambhoji, Sankarabharanam, Simhendramadhyamam, Mechakalyani
- **Janya**: All 17 janya ragas listed above

## Core Behaviors (Implemented)

### Raga Data Model
```typescript
export type RagaDef = {
  id: string;
  name: string;
  mela?: number; // Melakarta number if applicable
  arohana: Swara[];
  avarohana: Swara[];
};
```

### Swara to Semitone Mapping
- S=0, R1=1, R2=2, R3=3, G1=2, G2=3, G3=4, M1=5, M2=6, P=7, D1=8, D2=9, D3=10, N1=9, N2=10, N3=11
- Octave handling: Arohana ends at S5, Avarohana starts from S5

### Playback Sequencing
- **Arohana**: Play swaras in ascending order from S4 to S5
- **Avarohana**: Play swaras in descending order from S5 to S4
- **Both**: Ascend then descend seamlessly
- **Note conversion**: MIDI to note names (C, C#, D, etc.) to asset filenames (`Csharp4.mp3`)

### Visual Sync
- `PianoView` receives `activeNotes` with western note names (e.g., `G#4`)
- Highlights notes belonging to the raga for the current tonic
- Animates during playback and touch audition

### Tanpura Drone
- **Purpose**: Continuous Sa drone for sruti and intonation
- **Implementation**: Looped audio matching selected tonic
- **Control**: `startTanpura(tonic)`, `stopTanpura()`
- **Assets**: `server/public/tanpura/{TONIC}.mp3`

## Component Architecture

### CarnaticRaga Component
```typescript
type Props = {
  defaultRagaId?: string;
  defaultTonic?: string; // e.g., 'C'
  scrollable?: boolean; // if true, wraps content in ScrollView
};
```

### State Management
- `selectedRagaId`: raga chosen from dropdown
- `selectedTonic`: Sa (C…B)
- `category`: Popular | Melakarta | Janya
- `direction`: arohana | avarohana | both
- `activePianoNotes`: currently sounding notes
- `showPlayback` / `showPianoVisualization` / `showTanpura`: collapsible sections
- `tanpuraOn`: tanpura playback state

## Assets & Naming Conventions
- **Piano notes**: `server/public/instruments/piano/{NOTE}.mp3` using `sharp` naming (e.g., `Fsharp4.mp3`)
- **Tanpura drones**: `server/public/tanpura/{TONIC}.mp3` (looped)
- **Backend routes**: Express static routes `/instruments` and `/tanpura`

## Current Limitations
- **Gamakas**: Not modeled; playback is discrete pitches
- **Practice features**: Streak counter, session timer, micro-goals not implemented
- **Exercises**: Raga-specific exercises not implemented
- **Search**: Dropdown not yet searchable (planned enhancement)
- **Favorites**: No persistence of user preferences yet

## Planned Enhancements
- **Practice Section**: Add streak counter, session timer, micro-goals
- **Search functionality**: Typeahead search in raga dropdown
- **Favorites**: Persist user's favorite ragas
- **Exercises**: Raga-specific practice exercises
- **Gamaka simulation**: Approximate gamakas via pitch modulation
- **Alternative instruments**: Violin/veena playback options

## Acceptance Criteria (Current Status)
- ✅ Selecting a raga updates highlighted keys for the selected tonic Sa immediately
- ✅ Play (arohana/avarohana/both) produces correct western-note sequence from S4 to S5
- ✅ Piano visualization animates keys during playback and on touch audition
- ✅ Tanpura drone (if enabled) matches the tonic and loops cleanly
- ✅ Works on Web/iOS/Android using existing AudioPlayer
- 🔄 Practice features (streak, timer, goals) - Not implemented
- 🔄 Searchable raga dropdown - Not implemented

## Related Documentation
- See `docs/raga-playback-README.md` for broader raga playback design and UX guidance
- See `docs/western-lesson-detail.md` for Western music lesson implementation reference
