# Raga Playback: Scale- and Instrument-aware with Tanpura

## Overview
This document defines the user-facing and technical approach for interactive Raga playback with:
- Scale selector (octave from middle C, default C)
- Instrument selector (harmonium, violin, flute; default violin)
- Tanpura section that drones the selected scale/tonic

The goal is to let learners audition any supported raga transposed to their chosen tonic/scale and instrument, with an optional tanpura drone for reference.

## User Experience
- Scale selector: dropdown with octaves relative to middle C (e.g., C, C#, D, …, B). Default: C.
- Instrument selector: dropdown { Harmonium, Violin, Flute }. Default: Violin.
- Raga playback: plays arohanam and avarohanam sequences (ascending/descending) mapped to the selected scale and instrument.
- Tanpura section: start/stop tanpura drone of the selected tonic; independent volume control.
- Controls: Play/Pause/Stop for raga; Play/Stop for tanpura.

## Raga Representation
- Store ragas as abstract pitch degrees relative to the tonic (Sa). Example (Mayamalavagowla):
  - Arohanam: S R1 G3 M1 P D1 N3 S
  - Avarohanam: S N3 D1 P M1 G3 R1 S
- MVP mapping: equal-tempered semitone offsets from the selected tonic.
  - S(0), R1(+1), R2(+2), G2(+3), G3(+4), M1(+5), M2(+6), P(+7), D1(+8), D2(+9), N2(+10), N3(+11)
- Later: support just intonation/microtonal adjustments and gamakas.

## Transposition Algorithm (MVP)
1. Parse the raga’s arohanam/avarohanam as a sequence of swara degrees.
2. Convert each degree to a semitone offset using the table above.
3. Add offset to tonic (selected scale) and wrap to the playable instrument range.
4. Trigger note playback per instrument with a fixed note duration and short legato.

## Instruments
- Approach: sample-based playback or soundfonts for { harmonium, violin, flute }.
- Asset layout (recommended):
  - `server/public/instruments/<instrument>/<note>.mp3` (e.g., `violin/C4.mp3`, `violin/D#4.mp3`)
  - Support at least one octave around middle C for MVP (C4–C5). Interpolate or transpose when out of range.
- Loading: prefetch required notes for selected raga and scale; cache in-app.

## Tanpura Section
- Drone: continuous loops on tonic (Sa) and Pa (5th) for the selected scale; optional Sa+Pa+Sa upper.
- Asset layout:
  - `server/public/tanpura/<tonic>/sa.mp3`, `server/public/tanpura/<tonic>/sa-pa.mp3` (or single well-looped sample per tonic)
- Controls: play/stop, volume slider (0–100%).
- Looping: seamless loop with small crossfade; cached client-side.

## UI Specification (Client)
- Scale dropdown: list 12 semitone choices; default C.
- Instrument dropdown: Harmonium, Violin, Flute; default Violin.
- Buttons: Play/Pause/Stop raga; Play/Stop tanpura.
- Status: current note and position; error toasts on missing assets.
- Accessibility: labels, focus order, sufficient contrast.

## Data & Assets
- Ragas JSON (example location): `server/public/ragas/<ragaId>.json`
  - `{ id, name, arohanam: string[], avarohanam: string[], tempoBpm?: number }`
- Instrument samples: `server/public/instruments/<instrument>/<note>.mp3`
- Tanpura loops: `server/public/tanpura/<tonic>/*.mp3`

## Playback Engine (Client)
- Note scheduling: use existing `AudioPlayer` for buffers; sequence notes with small gaps for clarity (e.g., 250–400ms per note MVP).
- Prefetch: fetch all needed sample URLs (instrument + tanpura) and prime cache.
- Error handling: if a note sample is missing, fall back to nearest available pitch.

## API (Optional)
- `GET /audio-index` → list available instruments, notes, tanpura tonics (derived from public directory scan).
- For MVP: static serving via `/audio`, `/instruments`, `/tanpura` is sufficient.

## Acceptance Criteria
- Changing the scale transposes raga playback correctly for both arohanam and avarohanam.
- Changing instrument switches timbre with no client errors.
- Tanpura plays drone in the selected scale tonic; stoppable independently.
- Missing asset yields clear error toast; UI remains responsive.
- Works on Web/iOS/Android with measurable startup ≤2s (first load) for a typical network.

## Notes on Musical Accuracy (Future)
- Microtonal swaras and gamakas are essential for Carnatic authenticity; MVP uses equal temperament.
- Future versions should add microtonal pitch bends and ornaments, and instrument-specific articulations.

## OpenAI Research Points
- Raga phrase generation: prompt models to generate practice phrases (sargam/phrases) conditioned on raga and target skill level.
- Gamaka synthesis: explore ML-based pitch-bend curves for Carnatic ragas to render natural ornaments.
- Instrument timbre transfer: research neural timbre transfer to render phrases in selected instrument from a neutral synthesis.
- Tanpura synthesis: generate long, seamless tanpura drones at arbitrary tonics procedurally.
- Quality assurance: use AI to validate that generated phrases adhere to raga lakshanas (allowed/forbidden phrases).
- Metadata extraction: auto-detect tonic and raga from user humming to set scale/tanpura automatically.

## Implementation Steps (MVP)
1. Add static directories for instruments and tanpura under `server/public` and serve them.
2. Provide a `RagaPlayback` screen with dropdowns (scale, instrument), raga selector, and tanpura controls.
3. Implement transposition and note sequencing using cached samples.
4. Add analytics logs for load time and playback errors.
5. Extend with microtonal bends and better articulations in later iterations.

## Folder Layout (Proposed)
- `server/public/ragas/*.json`
- `server/public/instruments/{harmonium|violin|flute}/*.mp3`
- `server/public/tanpura/{C|C#|D|...}/*.mp3`

## Risks & Mitigations
- Asset size → compress MP3 at 160–192kbps; lazy-load only required notes.
- Loop clicks → prepare loop points with crossfades; verify seamlessness.
- Pitch realism → start with quality samples; add microtonal support next.

## Skill-targeted UX Enhancements (Planned)
- Adaptive difficulty
  - Beginner: slower tempo (60–72 BPM), longer note sustain, visual cue per note, simplified arohanam/avarohanam only
  - Intermediate: moderate tempo (80–96 BPM), simple phrases derived from raga pakad, light articulation
  - Advanced: performance-like phrases with meends/gamakas, tempo variations, tanpura level tweaking, optional tala click
- Practice modes
  - Listen → Imitate: play phrase then leave a gap for the learner; record optional attempt
  - Call & Response: alternate phrases with gradual complexity increase
  - Loop a segment: user selects a sub-phrase to loop with configurable repeats
- Guidance
  - Display swaras and Western note names aligned to the current scale
  - Show current/next note, and elapsed time indicator
  - Presets per instrument (attack/release envelopes) for clarity at lower skill levels

## OpenAI Research: Skill Adaptation and Content Generation
- Phrase generation (constraints-aware)
  - Use GPT models to generate raga-conformant phrases given: raga name, target skill level, desired length, and focus (e.g., arohanam-centric, pakad emphasis)
  - Output format: array of swaras with durations and optional ornament tags (e.g., `[{ swara: 'R1', durMs: 350, gamaka: 'kampita' }]`)
- Explanatory overlays
  - Generate concise textual hints tailored to the learner’s level (what to listen for, common mistakes)
  - Provide cultural context snippets (lakshana, typical phrases) on demand
- Audio feedback (future)
  - Combine Whisper (transcription) with pitch contour extraction to evaluate sung/played attempts; generate rubric-based feedback (intonation, stability, timing)
- Ornaments synthesis (research)
  - Use models to propose pitch-bend envelopes for gamakas (meend, kampita) constrained by raga; export as control data to apply to sample playback
- Personalization
  - Maintain a per-user profile of mastered phrases/techniques; prompt models for next best exercise/phrase

## Asset Sourcing and Adding Assets
- Recommended sources (verify licenses before use)
  - University of Iowa MIS (CC-licensed orchestral instrument samples)
  - Philharmonia Orchestra sample library (free for education; check terms)
  - VSCO2 Community Edition (free orchestral set with strings/winds)
  - GeneralUser GS (SF2 soundfont with harmonium-like patches)
  - FreeSound.org (search: tanpura, drone, harmonium) → filter by CC0/CC-BY
  - Open-source soundfonts (SF2/SFZ) for Harmonium/Flute/Violin; convert to per-note MP3s as needed
- Tanpura loops
  - Prefer CC-licensed tanpura drones per tonic; or synthesize: layered sine/triangle partials (Sa/Pa/Sa upper) with slow amplitude modulation and room reverb
- Preparing assets
  - Normalize/loudness: target around -16 LUFS for consistency
  - Trim/crossfade loop points for tanpura to ensure seamless looping
  - Naming conventions:
    - Instruments: `server/public/instruments/{harmonium|violin|flute}/{NOTE}.mp3` (e.g., `C4.mp3`, `D#4.mp3`)
    - Tanpura: `server/public/tanpura/{C|C#|D|...}/sa-pa.mp3`
- Converting to MP3 (example)
  - `ffmpeg -i input.wav -ar 44100 -ac 2 -b:a 192k output.mp3`
- Verifying in app
  - Open Lessons → Raga Playback screen (when implemented)
  - Select scale and instrument; start tanpura; play raga; ensure no 404s and latency acceptable

## Can we add assets to this repository?
- This repo will not include 3rd-party audio due to licensing and size. We can add placeholders and directory structure only.
- You can place your licensed assets locally under:
  - `server/public/instruments/...`
  - `server/public/tanpura/...`
  - `server/public/ragas/...`
- If you share specific CC0/your-owned files, we can script ingestion and conversion but will not commit copyrighted media.
