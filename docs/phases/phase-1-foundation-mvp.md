# Phase 1: Foundation MVP (Months 1-2)

**Goal**: Create a basic but functional music learning app with core features

#### Milestone 1.1: Project Setup & Architecture (Week 1-2)
- **React Native + Web project initialization**
- **Basic project structure and folder organization**
- **Development environment setup (dev, staging, prod)**
- **Git repository and CI/CD pipeline setup**
- **Basic database schema design**

#### Milestone 1.2: Core Authentication & User Management (Week 3-4)
- **User registration and login system**
- **Basic user profile management**
- **Password reset and email verification**
- **Session management and security**
- **User preferences storage**
- **Basic role management (student, teacher, admin)**

#### Milestone 1.3: Basic UI/UX Foundation (Week 5-6)
Objectives
- Establish a clean, responsive shell for the app with authenticated tabs and core screens
- Implement a theming system (Light/Dark) using the palette in 4.3 and ensure baseline accessibility

Deliverables
- Navigation
  - Public stack: `Login`, `Register`, `ForgotPassword`, `ResetPassword`
  - Private stack: Bottom tabs `Home`, `Learn` (placeholder), `Profile`
  - Fallback `NotFound` screen and guarded routes tied to auth state
- Screens (V1)
  - `HomeScreen`: Simple welcome, role-aware admin action visible only to admins
  - `ProfileScreen`: View/edit name and skill level; show email and role; show preferences snapshot
  - `SettingsScreen`: Toggle theme (light/dark), select language, audio quality; persists in store
  - `LearnScreen` (placeholder): stub for future lessons
  - `NotFoundScreen`: generic 404 within app container
- UI Components
  - `ScreenContainer`, `Header`, `Button`, `Input`, `Loader`, `Alert`, `EmptyState`
  - Theme tokens (spacing, colors, radius, typography) and `useTheme` hook
- Theming & Responsiveness
  - Light/Dark theme mapped from section 4.3 palette
  - Breakpoints: xs (<360), sm (360-599), md (600-959), lg (>=960)
  - Web: centered max-width container (e.g., 1200px), mobile-first layout
- Accessibility (baseline)
  - Minimum touch target 44x44
  - Sufficient color contrast per WCAG AA
  - Semantic roles/ARIA for web inputs/buttons; visible focus outlines on web

Task Breakdown
- Frontend
  - Add bottom tab navigator and route guards using the global auth store
  - Build `HomeScreen`, `ProfileScreen`, `SettingsScreen`, `LearnScreen`, `NotFoundScreen`
  - Implement theme context/provider with Light/Dark; connect to preferences in store
  - Extract shared UI primitives and spacing/typography scale
  - Implement responsive containers and platform-specific tweaks for web/mobile
- Backend
  - Reuse existing `/api/auth/me` and profile update endpoints; no new APIs required
  - Optional: add `/api/health` for uptime checks
- Design
  - Quick wireframes for 5 screens and tab layout
  - Define icon set (react-native-vector-icons) and placeholder illustrations

Acceptance Criteria
- Guarded navigation reliably switches Public ↔ Private based on auth state
- Bottom tabs render on mobile and web, with icons and labels
- Layout adapts without horizontal scroll at common breakpoints; web uses centered max width
- Theme toggle updates UI instantly and persists in store; applied across all screens
- Profile allows editing name and skill level and reflects saved state
- Settings updates preferences (theme, language, audio quality) in store; changes survive reload
- Basic accessibility: focus outlines on web, labels on inputs, color contrast meets AA

Runbook (Solo Dev)
- Prereqs: Backend running on port 4000; client configured with `API_URL`
- Start
  - Server: `npm run dev:server` (root) or `cd server && npm run dev`
  - Client: `npm run dev:client` (root) or `cd client && npm run start`
- Test
  - Web: open http://localhost:8081 (Expo Web) and validate nav, theme toggle, responsive layout
  - Mobile: Expo Go → scan QR, verify tabs, theme, and profile edits
- Manual QA checklist
  - Login → tabs appear; logout → auth screens appear
  - Switch theme; reload app; theme persists
  - Change name/skill; revisit Profile; values persist
  - Resize browser from 320px to 1440px; no layout breaks

Out of Scope (deferred)
- Final visual design polish, animations, and advanced accessibility audits
- Lessons content, audio playback, and learning flows
- Localization strings beyond toggles and placeholders

#### Milestone 1.4: Content Management System (Week 7-8)
Objectives
- Provide a minimal CMS to create, edit, and delete Lessons and Exercises (admin-only)
- Enable learners to browse, filter, and view lesson details with exercises

Deliverables
- Backend (admin-protected CRUD)
  - POST/PUT/DELETE `/api/admin/lessons` and `/api/admin/lessons/:id`
  - POST/PUT/DELETE `/api/admin/exercises` and `/api/admin/exercises/:id`
  - Reuse GET `/api/lessons` with filters `musicSystem`, `difficulty`, `category` (already implemented)
  - Reuse GET `/api/lessons/:id` with exercises (already implemented)
  - Reuse GET `/api/exercises` with optional filters (already implemented)
  - Simple validation: title/content/difficulty/musicSystem required for lessons; type/lessonId for exercises
- Frontend (screens)
  - Public: `LessonListScreen` (filters + search), `LessonDetailScreen` (shows lesson with exercises)
  - Admin: `ContentListScreen` (tabs: Lessons, Exercises), `LessonEditorScreen`, `ExerciseEditorScreen`
  - Navigation: add an Admin-only entry to Content screens (from Settings or Admin area)
- Filtering & Search
  - Client-side controls for music system, difficulty, category; search by title (client-side contains text match, server filter via `title` optional when added)

Task Breakdown
- Backend
  - Implement admin CRUD endpoints for lessons/exercises
  - Add basic request validation and 400/404 handling
  - Extend GET `/api/lessons` to support `title` contains (optional)
  - Protect endpoints with `authMiddleware` + `requireRole('admin')`
- Frontend
  - Build `LessonListScreen` with filter bar and search input; fetch via `/api/lessons`
  - Build `LessonDetailScreen` to display content and exercises
  - Build admin list (paginated or simple lists) for lessons/exercises
  - Build simple editors with text inputs/selects for required fields; call admin CRUD
  - Add Admin-only navigation entry (visible only if `user.role === 'admin'`)

Acceptance Criteria
- Admin can create, edit, delete a lesson with required fields and see it appear in public list
- Admin can add exercises to a lesson and see them on the lesson detail view
- Non-admin users can list lessons, filter by musicSystem/difficulty/category, and view details
- Search by lesson title filters results on the client; no errors for empty queries
- All admin endpoints require valid auth and admin role; invalid payloads return 400

Runbook (Solo Dev)
- Prereqs: Server running, admin user available (seeded `admin@example.com`)
- Create sample lessons
  - Admin login → use Admin Content → create a Western and a Carnatic lesson with different difficulties
  - Add 1–2 exercises to each lesson
- Verify public browsing
  - As a normal user: open Lesson list → filter by music system and difficulty → open details
- API sanity checks (optional)
  - `GET /api/lessons?musicSystem=Western&difficulty=beginner`
  - `GET /api/lessons/:id`

Out of Scope (deferred)
- Rich text editor, media uploads, and attachments
- Versioning, draft/publish workflow, bulk import/export
- Advanced validation and server-side search indexing


