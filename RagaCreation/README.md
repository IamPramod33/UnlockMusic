# Raga Creation

This project supports the UnlockMusic app with tools and guidance for raga playback and asset preparation.

## Transforming C Scale to Other Scales

Two solid ways:

- Pre-baked assets (recommended for tanpura quality)
  - Generate all 12 tonics from your C recording offline.
  - Example (SoX):
    - C→C#: pitch +100; C→D: +200; … C→B: +1100 (cents)
    - sox c.mp3 Csharp.mp3 pitch 100
    - sox c.mp3 D.mp3 pitch 200
  - Put results in `server/public/tanpura/{C|C#|...}/sa-pa.mp3`.

- Runtime transposition (for instruments and prototyping)
  - Web: use Web Audio detune/playbackRate; for pitch without tempo change, use a library like soundtouch.js.
  - Mobile (Expo AV): set playback rate with pitch correction:
    - rate = 2^(semitones/12)
    - await sound.setRateAsync(rate, true) // shouldCorrectPitch = true

Guidance
- Tanpura: pre-bake each tonic for best timbre/loop quality.
- Instruments: either supply per-note samples (C4–B4), or runtime pitch‑shift from nearest sample (slightly lower fidelity).

If you provide the C tanpura and/or instrument sample(s), we can wire:
- an automatic semitone map,
- mobile/web pitch-shift hooks,
- and a script to pre-generate the 12 keys.

## Repository Structure

- docs/: shared docs (see `../docs/raga-playback-README.md`)
- server/public/: where audio assets are served by the app server
- RagaCreation/: this folder for future scripts (CLI) to convert assets and manage raga JSON

## Next Steps

- Add CLI to batch-generate tonics from a C sample
- Add schema for `ragas/*.json` and validators
- Add preview UI to audition instrument/tanpura combinations
