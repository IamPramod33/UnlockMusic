# Development Guide

## 🚀 Quick Development Workflow

### First Time Setup
```bash
# Complete setup - installs dependencies and sets up database
npm run setup:all
```

### Daily Development
```bash
# Start both server and client (recommended for full development)
npm run start:all

# Or start server and web client (faster for web development)
npm run start:web
```

### Individual Services
```bash
# Start only the server (API + Database)
npm run dev:server

# Start only the client (React Native + Web)
npm run dev:client
```

## 📋 Command Reference

### Root Level Commands (from project root)

#### Setup & Installation
- `npm run setup:all` - Complete project setup
- `npm run install:all` - Install all dependencies
- `npm run reset:all` - Clean install and setup

#### Development Servers
- `npm run start:all` - Server + Mobile client
- `npm run start:web` - Server + Web client
- `npm run dev:server` - Server only
- `npm run dev:client` - Client only

#### Database Management
- `npm run seed` - Populate database with test data
- `npm run db:reset` - Reset and reseed database
- `npm run db:studio` - Open Prisma Studio

#### Testing
- `npm run test:server` - Test server health
- `npm run test:db` - Test database connection
- `npm run test:all` - Test both server and database

### Server Commands (from server directory)
- `npm run setup` - Install deps + setup database
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run seed` - Seed database

### Client Commands (from client directory)
- `npm run setup` - Install deps + web dependencies
- `npm run dev` - Start mobile development
- `npm run web` - Start web development
- `npm run android` - Start Android
- `npm run ios` - Start iOS

## 🔧 Development Workflow

### 1. Initial Setup (One-time)
```bash
# Clone the repository
git clone <repository-url>
cd UnlockMusic

# Complete setup
npm run setup:all
```

### 2. Daily Development
```bash
# Start both server and client
npm run start:all

# Or for web development
npm run start:web
```

### 3. Testing
```bash
# Test everything is working
npm run test:all
```

### 4. Database Management
```bash
# Add new test data
npm run seed

# Reset database
npm run db:reset

# Inspect database
npm run db:studio
```

## 🌐 Access Points

Once running, you can access:

- **Server API**: http://localhost:4000
- **Client Web**: http://localhost:8081 (or Expo web)
- **Database Studio**: http://localhost:5555 (when running `npm run db:studio`)

## 📱 Development Platforms

### Web Development
```bash
npm run start:web
```
- Opens in browser automatically
- Hot reload for both client and server
- Best for UI development

### Mobile Development
```bash
npm run start:all
```
- Use Expo Go app on your phone
- Scan QR code from terminal
- Best for mobile-specific features

### Server-Only Development
```bash
npm run dev:server
```
- API development only
- Test with curl or Postman
- Best for backend features

## 🐛 Troubleshooting

### Common Issues

#### Server won't start
```bash
# Check if port 4000 is in use
lsof -i :4000

# Kill existing process
pkill -f "node.*dist/index.js"

# Restart server
npm run dev:server
```

#### Database issues
```bash
# Reset database
npm run db:reset

# Check database status
npm run test:db
```

#### Client won't start
```bash
# Clear Expo cache
cd client && npx expo start --clear

# Or reset everything
npm run reset:all
```

#### Dependencies issues
```bash
# Clean install
npm run clean
npm run install:all
```

### Environment Issues
- Ensure Node.js 18+ is installed
- Ensure Expo CLI is installed globally
- Check that ports 4000 and 8081 are available

## 📊 Monitoring

### Server Health
```bash
curl http://localhost:4000/health
```

### Database Status
```bash
curl http://localhost:4000/api/test
```

### System Statistics
```bash
curl http://localhost:4000/api/stats
```

## 🎯 Best Practices

1. **Always test after setup**: Run `npm run test:all` after any major changes
2. **Use appropriate commands**: Use `start:web` for web development, `start:all` for mobile
3. **Check database**: Use `npm run db:studio` to inspect data when debugging
4. **Reset when needed**: Use `npm run reset:all` if things get messy
5. **Monitor logs**: Watch both server and client terminal outputs for errors

## 🔄 Continuous Development

The development servers support hot reload, so:
- Server changes restart automatically
- Client changes reload in browser/app
- Database changes require manual restart or reseed

For the best development experience, keep both server and client running with `npm run start:all` or `npm run start:web`.
