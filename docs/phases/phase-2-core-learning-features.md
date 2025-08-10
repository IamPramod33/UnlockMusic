# Phase 2: Core Learning Features (Months 3–4)

**Goal**: Ship a usable learning experience with audio playback, basic exercises, and progress tracking, backed by minimal gamification and a tested infrastructure baseline.

---

#### Milestone 2.1: Audio System Foundation (Week 9–10)
Scope
- Cross‑platform audio playback and caching
- Audio upload pipeline and media registry
- Quality presets and platform abstractions

Deliverables
- `AudioPlayer` component with API: `play(url)`, `pause()`, `resume()`, `stop()`, `seek(seconds)`, `getPosition()`, `onStatus(callback)`
- Platform implementations
  - Web: Howler.js (Web Audio API) wrapper
  - Mobile: Expo AV (`expo-av`)
- Supported formats: Web `mp3, wav, ogg`; Mobile `mp3, wav, m4a`
- Upload flow (assumes S3 or compatible):
  - `POST /api/media/upload-url` → returns presigned `PUT` URL for `contentType` and `contentLength`
  - Client `PUT` to storage; then `POST /api/media` to register asset `{ title, type: 'audio', mime, bytes, storageKey }`
- Quality settings: `low (96kbps) | medium (160kbps, default) | high (256kbps)`; persisted in user preferences
- Offline caching
  - Web: Cache Storage + IndexedDB index (LRU, 250MB cap)
  - Mobile: `expo-file-system` with LRU (500MB cap)

Acceptance Criteria
- Playback: from first call to `play(url)` → audio starts within ≤300ms (web) / ≤500ms (mobile) for cached files; ≤2s for streamed uncached files on a 10 Mbps network
- Controls: `play/pause/resume/stop/seek` work without race conditions; seeking accuracy ±250ms
- Formats: All listed formats play successfully on each platform
- Upload: Files ≤25MB succeed; accepted mimes: `audio/mpeg, audio/wav, audio/x-m4a, audio/ogg`; server returns media id; UI shows success/error
- Caching: Second playback of same URL uses cache (verified via network inspector on web; file existence on mobile)
- Errors: Network or decode errors surface user-friendly toasts and do not crash

Out of Scope
- Background audio and audio ducking
- Waveform rendering and advanced DSP

---

#### Milestone 2.2: Basic Learning Interface (Week 11–12)
Scope
- Lesson viewer with inline audio
- Minimal exercise types and scoring
- Simple feedback and navigation

Deliverables
- `LessonViewer` screen: fetches `GET /api/lessons/:id` and renders title, markdown content, and an embedded `AudioPlayer`
- Exercise types (v1)
  - Multiple Choice (theory/ear): prompt + 2–5 options
  - Rhythm Tap: tap along; hit window ±150ms
- `ExerciseRunner` component: renders by `exercise.type` with shared header/footer
- Scoring: 0–100 per exercise
  - MCQ: `score = (correct ? 100 : 0)`
  - Rhythm: `score = 100 * (hits / (hits + misses))`
- Feedback: immediate outcome (Correct/Incorrect or Hit/Miss ratio) + one hint (static from exercise data)
- Navigation: `Prev/Next` within lesson; `Back to Lessons`

Acceptance Criteria
- Lesson content renders markdown correctly (headings, lists, code, images)
- Audio in lesson plays, pauses, and seeks without blocking scrolling
- MCQ: single submission per attempt; selecting an option locks choices and shows result
- Rhythm: latency compensation configurable by `settings.inputLatencyMs`; score computed deterministically
- Scores and attempt metadata emitted via `onExerciseComplete({ exerciseId, score, durationMs, startedAt, endedAt })`
- Keyboard and screen-reader labels present on actionable elements (baseline accessibility)

Out of Scope
- Advanced exercise types (interval singing, pitch detect)
- Rich feedback (AI‑generated explanations)

---

#### Milestone 2.3: Progress Tracking & Analytics (Week 13–14)
Scope
- Persist user progress and basic analytics
- Minimal achievements groundwork

Deliverables
- DB/entities (server)
  - `UserProgress`: `{ id, userId, lessonId, status: 'not_started'|'in_progress'|'completed', bestScore, lastScore, attempts, timeSpentSec, updatedAt }`
  - `ExerciseAttempt`: `{ id, userId, lessonId, exerciseId, score, durationMs, startedAt, endedAt }`
- Endpoints
  - `POST /api/progress/attempts` → create `ExerciseAttempt`
  - `GET /api/progress/lessons/:lessonId` → aggregate for user
  - `GET /api/progress/summary` → totals: lessons completed, average score, time spent
- Client integration: submit attempts from `ExerciseRunner` and update `UserProgress`
- Basic analytics widget: totals + last 5 attempts list in Profile or Learn

Acceptance Criteria
- Creating an attempt updates `UserProgress` aggregates (attempts++, lastScore, bestScore, timeSpentSec)
- Summary endpoint returns consistent values that match recent attempts
- P95 response time ≤200ms on local dev for progress reads/writes
- Data survives app reload and sign‑out/sign‑in

Out of Scope
- Cohort analytics and teacher dashboards

---

#### Milestone 2.4: Gamification Foundation (Week 15–16)
Scope
- Points, basic badges, milestones, and notifications

Deliverables
- Points rules (persisted server‑side on attempt creation)
  - Complete exercise ≥60 score: +10
  - Perfect score 100: +5 bonus
  - First lesson completion: +25
- Initial badges
  - `First Steps`: first exercise completed
  - `On a Roll`: 5 exercises completed
  - `Lesson Unlocked`: first lesson completed
- Milestones: every 100 points → milestone toast
- Leaderboard (simple): weekly, top 100 users by points; `GET /api/leaderboard/weekly`
- Notifications: in‑app toast + badge shelf in Profile

Acceptance Criteria
- Points awarded exactly per rules; idempotent on retry (server enforces once per attempt id)
- Badges issued once per user; visible in Profile
- Weekly leaderboard paginates (`?page, ?limit`); ties resolved by earliest reach time

Out of Scope
- Seasonal events and advanced achievements

---

#### Milestone 2.5: Cloud Infrastructure & Testing Setup (End of Phase 2)
Scope
- Minimal cloud resources and CI testing baseline

Deliverables
- Infrastructure
  - Storage bucket for media (S3 or compatible), lifecycle policy (30‑day incomplete uploads cleanup)
  - Env configs: `API_URL`, `MEDIA_BUCKET`, `MAX_UPLOAD_MB=25`
- Testing
  - Client unit tests for `AudioPlayer`, `ExerciseRunner` (≥20 tests; ≥70% coverage for these modules)
  - Server tests for progress endpoints (happy path + validation + idempotency)
- QA checklist
  - Playback, upload, caching verified on Web + iOS + Android (simulators acceptable)
  - Progress persists across sessions; summary matches attempts
  - Points/badges update immediately after attempt submission

Acceptance Criteria
- CI passes on PR with unit tests and type checks
- Manual QA checklist completed without blockers


