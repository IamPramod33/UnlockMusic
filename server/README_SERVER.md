# Unlock Music Learning — Server

Minimal Node/Express API with Prisma (SQLite) for local development.

## Prerequisites
- Node.js 18+ and npm

## Setup (Milestone 1.1)
1. Install deps (first time only):
   ```bash
   npm install
   ```
2. Ensure local database is configured:
   ```bash
   echo 'DATABASE_URL="file:./dev.db"' > .env
   npx prisma migrate dev --name init --skip-seed
   ```
3. Seed the database with test data:
   ```bash
   npm run seed
   ```
4. Run API:
   ```bash
   npm run dev
   # API listening on http://localhost:4000
   ```

## Scripts
- `npm run dev` — Live-reload dev (nodemon + ts-node)
- `npm run build` — TypeScript build to `dist/`
- `npm run start` — Run compiled server
- `npm run seed` — Populate database with test data
- `npm run db:reset` — Reset database and reseed
- `npm run db:studio` — Open Prisma Studio for database inspection

## API Endpoints

### Health & Testing
- `GET /health` — Basic health check
- `GET /api/test` — Database connection test with counts
- `GET /api/stats` — Comprehensive statistics

### Core Data
- `GET /api/lessons` — List all lessons (with filters)
- `GET /api/lessons/:id` — Get specific lesson with exercises
- `GET /api/users` — List all users
- `GET /api/exercises` — List exercises (with filters)
- `GET /api/progress` — List user progress records

### Query Parameters
- Lessons: `?musicSystem=Western&difficulty=beginner&category=Theory`
- Exercises: `?lessonId=western-basic-notes&type=note_reading`
- Progress: `?userId=user-id&lessonId=lesson-id`

## Database Schema
- **Users**: Basic user profiles with preferences
- **Lessons**: Music lessons for Western and Carnatic systems
- **Exercises**: Practice exercises linked to lessons
- **UserProgress**: Learning progress tracking

## Test Data
The seed script creates:
- **2 Users**: John Doe (beginner), Jane Smith (intermediate)
- **4 Lessons**: 2 Western, 2 Carnatic (beginner/intermediate)
- **4 Exercises**: Note reading, scale practice, swara practice, raga practice
- **2 Progress Records**: Sample learning progress

## Testing the Integration

### 1. Server Health Check
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"...","database":"connected"}
```

### 2. Database Test
```bash
curl http://localhost:4000/api/test
# Expected: {"status":"success","message":"Database connection and queries working","counts":{"users":2,"lessons":4,"exercises":4,"progress":2}}
```

### 3. Get Lessons
```bash
curl http://localhost:4000/api/lessons
# Expected: List of 4 lessons with exercises and counts

curl "http://localhost:4000/api/lessons?musicSystem=Western"
# Expected: 2 Western music lessons
```

### 4. Get Statistics
```bash
curl http://localhost:4000/api/stats
# Expected: Comprehensive statistics with breakdowns
```

### 5. Client Integration
The client app will automatically test the database connection on startup and display the status in the welcome screen.

## Database File
- Location: `dev.db` (SQLite file)
- Can be inspected with: `npm run db:studio`
- Reset with: `npm run db:reset`

## Notes
- Prisma client uses SQLite by default for local work
- Schema: `prisma/schema.prisma`
- Seed data: `prisma/seed.ts`
- All endpoints return consistent JSON responses with status and data
- Error handling includes proper HTTP status codes and error messages

