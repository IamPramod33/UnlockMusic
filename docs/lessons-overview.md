# Lessons Overview

## Purpose
This document provides a comprehensive overview of all lessons available in the Unlock Music Learning application, including their content, difficulty levels, and associated exercises.

## Lesson System Overview

### Music Systems Supported
- **Western Music**: Staff notation, scales, chords, and theory
- **Carnatic Music**: Swaras, ragas, talas, and traditional Indian music theory

### Difficulty Levels
- **Beginner**: Fundamental concepts and basic skills
- **Intermediate**: More complex techniques and advanced concepts
- **Advanced**: Expert-level content and specialized topics

### Categories
- **Theory**: Fundamental music theory concepts
- **Scales**: Scale patterns and practice
- **Ragas**: Carnatic raga exploration and practice
- **Technique**: Performance techniques and skills

## Current Lessons Database

### 🎼 Western Music Lessons

#### 1. Introduction to Musical Notes
- **ID**: `western-basic-notes`
- **Title**: Introduction to Musical Notes
- **Difficulty**: Beginner
- **Category**: Theory
- **Duration**: 15 minutes
- **Prerequisites**: None
- **Content**: Learn the fundamental notes in Western music: C, D, E, F, G, A, B. This lesson covers note names, their positions on the staff, and basic reading skills.
- **Exercises**:
  - **Type**: Note reading
  - **Audio**: `/audio/western/notes-c-major.mp3`
  - **Notation**: `C D E F G A B C`
  - **Instructions**: Play the C major scale ascending and descending
  - **Hints**: Start with middle C and follow the pattern: whole, whole, half, whole, whole, whole, half

#### 2. Major Scales
- **ID**: `western-major-scales`
- **Title**: Major Scales
- **Difficulty**: Beginner
- **Category**: Scales
- **Duration**: 20 minutes
- **Prerequisites**: `western-basic-notes`
- **Content**: (Content needs to be added)
- **Exercises**:
  - **Type**: Scale practice
  - **Audio**: `/audio/western/c-major-scale.mp3`
  - **Notation**: `C D E F G A B C B A G F E D C`
  - **Instructions**: Practice the C major scale with proper fingering
  - **Hints**: Use the correct finger pattern: 1-2-3, 1-2-3-4-5 for the right hand

### 🎵 Carnatic Music Lessons

#### 3. Introduction to Swaras
- **ID**: `carnatic-swaras`
- **Title**: Introduction to Swaras
- **Difficulty**: Beginner
- **Category**: Theory
- **Duration**: 18 minutes
- **Prerequisites**: None
- **Content**: Learn the seven basic swaras in Carnatic music: Sa, Re, Ga, Ma, Pa, Dha, Ni. Understand their relationship and basic pronunciation.
- **Exercises**:
  - **Type**: Swara practice
  - **Audio**: `/audio/carnatic/swaras-basic.mp3`
  - **Notation**: `Sa Re Ga Ma Pa Dha Ni Sa`
  - **Instructions**: Practice the basic swaras in order
  - **Hints**: Focus on clear pronunciation and maintaining sruti (pitch)

#### 4. Carnatic Ragas
- **ID**: `carnatic-ragas`
- **Title**: Carnatic Ragas
- **Difficulty**: Beginner
- **Category**: Ragas
- **Duration**: 25 minutes
- **Prerequisites**: `carnatic-swaras`
- **Content**: Explore Carnatic ragas interactively: select a raga (Melakarta or Janya), choose tonic, play arohana/avarohana with piano visualization and optional tanpura support.
- **Exercises**:
  - **Type**: Raga practice
  - **Audio**: `/audio/carnatic/mayamalavagowla.mp3` (example asset)
  - **Notation**: `Sa Re Ga Ma Pa Dha Ni Sa Ni Dha Pa Ma Ga Re Sa` (example)
  - **Instructions**: From the Carnatic Ragas lesson, select Mayamalavagowla and practice its arohana and avarohana with the piano visualization.
  - **Hints**: Use tanpura for sruti stability; focus on clean transitions between swaras.

## Special Features

### 🎹 Carnatic Ragas Interactive Component
- **Component**: `CarnaticRaga.tsx`
- **Screen**: `CarnaticRagasScreen.tsx`
- **Features**:
  - Interactive raga selection (72 Melakarta + 17 Janya ragas)
  - Piano visualization with raga note highlighting
  - Tanpura drone playback
  - Arohana/Avarohana playback
  - Touch audition on piano keys

### 🎼 Western Scales Interactive Component
- **Component**: `WesternLessonDetail.tsx`
- **Features**:
  - Scale pattern selection
  - Key (tonic) selection
  - Piano visualization
  - Interactive playback
  - Touch audition

## Database Schema

### Lesson Model
```typescript
interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  musicSystem: 'Western' | 'Carnatic';
  category?: string;
  duration?: number; // minutes
  prerequisites?: string; // lesson ID
  createdAt: string;
  updatedAt: string;
  exercises: Exercise[];
}
```

### Exercise Model
```typescript
interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  audioFile?: string;
  notation?: string;
  difficulty?: string;
  instructions?: string;
  hints?: string;
  createdAt: string;
}
```

## Lesson Management

### Adding New Lessons
1. **Database**: Add lesson data to `server/prisma/seed.ts`
2. **Content**: Create lesson content and exercises
3. **Assets**: Add required audio files to appropriate directories
4. **Testing**: Verify lesson appears in client app

### Lesson Categories by Music System

#### Western Music
- **Theory**: Basic music concepts, notation, terminology
- **Scales**: Major, minor, pentatonic, and other scale patterns
- **Chords**: Triads, seventh chords, chord progressions
- **Technique**: Performance techniques, fingering, practice methods

#### Carnatic Music
- **Theory**: Swaras, sruti, basic concepts
- **Ragas**: Individual raga exploration and practice
- **Talas**: Rhythmic patterns and time cycles
- **Technique**: Gamakas, ornamentations, performance techniques

## Future Lesson Plans

### Western Music Expansion
- **Minor Scales**: Natural, harmonic, and melodic minor scales
- **Chord Progressions**: Common chord progressions and their applications
- **Sight Reading**: Note reading practice and exercises
- **Ear Training**: Interval recognition and melodic dictation

### Carnatic Music Expansion
- **More Ragas**: Additional popular ragas beyond the current 17
- **Tala Practice**: Basic talas and their applications
- **Gamaka Training**: Ornamentation techniques and practice
- **Composition**: Basic composition techniques in Carnatic music

### Cross-System Lessons
- **Music Theory Comparison**: Similarities and differences between systems
- **Fusion Concepts**: Combining elements from both traditions
- **Cultural Context**: Historical and cultural background of each system

## Technical Implementation

### File Locations
- **Database Seed**: `server/prisma/seed.ts`
- **Database Schema**: `server/prisma/schema.prisma`
- **API Endpoints**: `server/src/index.ts`
- **Client Components**: `client/src/screens/Lessons/`
- **Audio Assets**: `server/public/audio/`

### API Endpoints
- `GET /api/lessons` - List all lessons with filters
- `GET /api/lessons/:id` - Get specific lesson with exercises
- `POST /api/admin/lessons` - Create new lesson (admin only)
- `PUT /api/admin/lessons/:id` - Update lesson (admin only)
- `DELETE /api/admin/lessons/:id` - Delete lesson (admin only)

### Filtering Options
- **Music System**: `?musicSystem=Western` or `?musicSystem=Carnatic`
- **Difficulty**: `?difficulty=beginner`, `intermediate`, or `advanced`
- **Category**: `?category=Theory`, `Scales`, `Ragas`, etc.
- **Title Search**: `?title=keyword` (case-insensitive)

## User Progress Tracking

### Progress Model
```typescript
interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  score?: number; // 0-100
  timeSpent?: number; // seconds
  attempts: number;
  lastAttempted: string;
}
```

### Progress Features
- **Completion Tracking**: Track lesson completion status
- **Score Recording**: Record performance scores
- **Time Tracking**: Monitor time spent on lessons
- **Attempt Counting**: Track number of attempts
- **Progress Analytics**: View learning progress over time

## Related Documentation
- `docs/carnatic-raga-details.md` - Detailed Carnatic raga implementation
- `docs/western-lesson-detail.md` - Western lesson detail implementation
- `DESIGN_DOCUMENT.md` - Overall project design and architecture

### Planned Lesson Tracks

- **Carnatic Music Theory**: Structured theory-first track covering swaras, sruti, talas, melakarta framework, and notation. Short, scaffolded modules with immediate practice prompts.
- **Carnatic Raga Demonstrations (Theory-Based)**: Demonstrations that connect theory to sound using interactive raga playback, tonic selection, piano visualization, and tanpura. Includes arohana/avarohana, signature phrases, and quick ear-training snippets.
- **Western Music Theory**: Staff notation, intervals, keys, chord-quality recognition, and harmonic functions. Each concept is paired with a simple sonic demonstration.
- **Western Practical Lessons (Theory-Based)**: Hands-on scale/chord playback and visualization. Start with guided patterns, then move to self-led practice with coaching tips and micro-goals.

## Engagement & UX Psychology Strategy

Goal: Nudge learners away from low-value distractions and toward small, satisfying wins that compound into a consistent learning habit.

### Core Principles
- **Micro-Commitments**: Convert intent into action with 30–120 second tasks. Example: “Play arohana once + tap 3 keys.”
- **Progress Visibility**: Always show “You did X today” and “2 mins to next streak save.”
- **Friction Reduction**: One-tap Resume, prefilled selections, and sticky recents/favorites.
- **Timeboxing**: 2, 5, and 10-minute quick sessions to reduce perceived effort.
- **Variable Rewards**: Lightweight celebrations on completion; occasional surprise badges.
- **Loss Aversion (Gentle)**: Streak freeze token if the learner completes a 2-minute session.
- **Temptation Bundling**: Pleasant tanpura drone or backing pad during practice to make sessions intrinsically rewarding.
- **Choice Architecture**: Default to “Next best step” based on the last session and current difficulty.

### Distraction Redirection Patterns
- **Exit Nudge**: On back/close, prompt: “Quick win before you go? 2-min session to save your streak.”
- **Focus Mode**: Minimal UI during active playback; hide non-essentials, emphasize Play/Stop and the next actionable step.
- **Just-in-Time Tips**: Show one line, context-aware tips after a short idle (“Try tapping Pa to anchor your ear”).

### Habit & Motivation Hooks
- **Daily Goal Slider**: 2/5/10 minutes; completion ring visible on Lessons and Detail screens.
- **Session Recap**: “You practiced 6 notes in 3 mins. New best tempo: 80 BPM.”
- **Weekly Path**: Auto-generated path mixing theory and practical demos to avoid boredom.
- **Social Proof (Later)**: “1,248 learners practiced this today.” (toggleable; add when community features land)

### Implementation Notes
- Reuse collapsible sections with “Resume” CTA pinned at the top.
- Persist: last selected raga/scale, tonic, and direction; default to those on next open.
- Surface “2-min plan” on open: Play scale once, tap 3 highlighted keys, stop.
- Idle detector (10–15s) to suggest a micro-action rather than showing empty states.

### Acceptance Criteria (Engagement)
- A user can start a meaningful 2-minute session with a single tap from any lesson detail screen.
- Streaks increase only when a minimum threshold is met (e.g., 2-minute timer or 1 complete arohana+avarohana).
- Exit nudge appears contextually and can be dismissed; accepting starts a guided 2-minute flow.
- Resume CTA resumes from last tonic/raga/scale in under 300ms (cached state).
- Completion recap appears at session end with at least one positive reinforcement signal.
