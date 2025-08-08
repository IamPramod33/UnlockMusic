# Unlock Music Learning — Client

Expo (React Native + Web) application.

## Prerequisites
- Node.js 18+ and npm
- iOS/Android tooling if running native (optional)

## Setup (Milestone 1.1)
1. Install deps (first time only):
   ```bash
   npm install
   ```
2. Copy env and verify API URL:
   ```bash
   cp .env.example .env
   # Ensure API_URL matches your local server (default http://localhost:4000)
   ```
3. Start in development:
   - All platforms (metro):
     ```bash
     npm run dev:dev
     ```
   - Web only:
     ```bash
     npm run web
     ```

## Scripts
- `npm run dev:dev` — Dev server with NODE_ENV=development
- `npm run dev:staging` — Dev server with NODE_ENV=staging
- `npm run dev:prod` — Dev server with NODE_ENV=production
- `npm run web` — Web dev server
- `npm run android` — Build/run Android
- `npm run ios` — Build/run iOS

## Structure
```
src/
  components/{common,web,mobile}
  screens/{Dashboard,Lessons,Practice,Profile}
  navigation/{web,mobile}
  services/{audio,api,storage}
  store/
  utils/
  platform/{web,mobile}
```

## API
- The app reads `API_URL` from `.env` via `app.config.ts` (Expo `extra`).
- Ensure the server is running at `http://localhost:4000` or update `API_URL`.

