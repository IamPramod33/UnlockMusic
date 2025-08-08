# Unlock Music Learning

Welcome to the Unlock Music Learning project! This repository contains a cross-platform music education application supporting both Western and Carnatic music traditions.

## 🎵 About

Unlock Music Learning is designed to help users explore and understand music through interactive experiences and educational content. The app supports both Western music (staff notation, scales, chords) and Carnatic music (swaras, ragas, talas) with a unified learning experience.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)

### Single Commands for Development

#### **Complete Setup (First Time Only)**
```bash
# Install all dependencies and setup database
npm run setup:all
```

#### **Start Development Servers**
```bash
# Start both server and client (mobile)
npm run start:all

# Start server and web client
npm run start:web

# Start only server
npm run dev:server

# Start only client
npm run dev:client
```

#### **Database Management**
```bash
# Seed database with test data
npm run seed

# Reset and reseed database
npm run db:reset

# Open database inspection tool
npm run db:studio
```

#### **Testing**
```bash
# Test server health
npm run test:server

# Test database connection
npm run test:db

# Test both server and database
npm run test:all
```

## 📁 Project Structure

```
UnlockMusic/
├── client/                 # React Native + Web frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API services
│   │   └── ...
│   ├── App.tsx            # Main app component
│   └── package.json
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   └── index.ts       # API server
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Test data
│   └── package.json
└── package.json           # Root package.json with scripts
```

## 🛠️ Available Scripts

### Root Level Commands
- `npm run setup:all` - Complete setup (dependencies + database)
- `npm run start:all` - Start server + mobile client
- `npm run start:web` - Start server + web client
- `npm run dev:server` - Start server only
- `npm run dev:client` - Start client only
- `npm run seed` - Populate database with test data
- `npm run test:all` - Test server and database
- `npm run reset:all` - Clean install and setup

### Server Commands
- `npm run setup` - Install deps + setup database
- `npm run dev` - Start development server
- `npm run seed` - Seed database
- `npm run db:studio` - Open database tool

### Client Commands
- `npm run setup` - Install deps + web dependencies
- `npm run dev` - Start mobile development
- `npm run web` - Start web development

## 🗄️ Database

The application uses SQLite with Prisma ORM for local development:

- **Schema**: `server/prisma/schema.prisma`
- **Test Data**: `server/prisma/seed.ts`
- **Database File**: `server/dev.db`

### Test Data Includes:
- 2 Users (beginner/intermediate)
- 4 Lessons (Western/Carnatic)
- 4 Exercises (note reading, scales, swaras, ragas)
- 2 Progress records

## 🌐 API Endpoints

- `GET /health` - Server health check
- `GET /api/test` - Database connection test
- `GET /api/lessons` - List lessons (with filters)
- `GET /api/users` - List users
- `GET /api/exercises` - List exercises
- `GET /api/progress` - List progress records
- `GET /api/stats` - System statistics

## 🎨 Features

### Current Implementation (Milestone 1.1)
- ✅ Project setup and architecture
- ✅ Database integration with test data
- ✅ Basic API endpoints
- ✅ Welcome screen with music system selection
- ✅ Database connection testing in UI
- ✅ Cross-platform development setup

### Planned Features
- User authentication and profiles
- Interactive lesson viewer
- Real-time audio processing
- Progress tracking and analytics
- Gamification elements
- Social learning features

## 🔧 Development

### Environment Variables
The client reads API configuration from environment files:
- `.env.development` - Development settings
- `.env.staging` - Staging settings  
- `.env.production` - Production settings

### Technology Stack
- **Frontend**: React Native + Expo + React Native Web
- **Backend**: Node.js + Express + Prisma
- **Database**: SQLite (local) / PostgreSQL (production)
- **Language**: TypeScript

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run test:all`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
