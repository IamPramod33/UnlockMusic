import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Simple JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = '7d';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signRefreshToken(): { token: string; expiresAt: Date } {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days
  return { token, expiresAt };
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1] as string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as any).userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
}

function requireRole(...roles: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const userId = (req as any).userId as string | undefined;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      if (!roles.includes(user.role)) return res.status(403).json({ status: 'error', message: 'Forbidden' });
      return next();
    } catch (e) {
      return res.status(500).json({ status: 'error', message: 'Role check failed' });
    }
  };
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const verifyTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    const user = await prisma.user.create({
      data: { email, name, passwordHash, emailVerified: false, subscriptionStatus: 'free', verifyToken, verifyTokenExpires },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    const token = signToken(user.id);
    const { token: refreshToken, expiresAt } = signRefreshToken();
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });
    return res.status(201).json({ status: 'success', data: { user, verifyToken }, token, refreshToken });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ status: 'error', message: 'Registration failed' });
  }
});

// Email verification (dev)
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body ?? {};
    if (!token) return res.status(400).json({ status: 'error', message: 'Token required' });
    const user = await prisma.user.findFirst({ where: { verifyToken: token, verifyTokenExpires: { gt: new Date() } } });
    if (!user) return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: null, verifyTokenExpires: null } });
    return res.json({ status: 'success', message: 'Email verified' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Verification failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }
    const token = signToken(user.id);
    const { token: refreshToken, expiresAt } = signRefreshToken();
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });
    return res.json({
      status: 'success',
      data: { user: { id: user.id, email: user.email, name: user.name } },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ status: 'error', message: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, role: true, preferences: true, skillLevel: true }
    });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    return res.json({ status: 'success', data: { user } });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch current user' });
  }
});

// Refresh access token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return res.status(400).json({ status: 'error', message: 'refreshToken required' });
    const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!record || record.revokedAt || record.expiresAt <= new Date()) {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
    }
    const newAccess = signToken(record.userId);
    const { token: newRefresh, expiresAt } = signRefreshToken();
    await prisma.refreshToken.update({ where: { token: refreshToken }, data: { revokedAt: new Date(), replacedByToken: newRefresh } });
    await prisma.refreshToken.create({ data: { userId: record.userId, token: newRefresh, expiresAt } });
    return res.json({ status: 'success', token: newAccess, refreshToken: newRefresh });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to refresh' });
  }
});

// Revoke all sessions (logout all)
app.post('/api/auth/revoke-all', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return res.json({ status: 'success', message: 'All sessions revoked' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to revoke' });
  }
});

// Admin: list users
app.get('/api/admin/users', authMiddleware, requireRole('admin'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
    return res.json({ status: 'success', data: users });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to list users' });
  }
});

// Admin: update user role
app.post('/api/admin/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role' });
    }
    const updated = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, role: true } });
    return res.json({ status: 'success', data: updated });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Failed to update role' });
  }
});

// Update profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { name, preferences, skillLevel } = req.body ?? {};
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, preferences, skillLevel },
      select: { id: true, email: true, name: true, preferences: true, skillLevel: true }
    });
    return res.json({ status: 'success', data: { user: updated } });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update profile' });
  }
});

// Change password
app.post('/api/user/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'currentPassword and newPassword are required' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Invalid current password' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return res.json({ status: 'success', message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to change password' });
  }
});

// Request password reset (issues token)
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ status: 'error', message: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ status: 'success', message: 'If that account exists, an email was sent' });
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpires: expires } });
    // In production: send email. For dev, return token.
    return res.json({ status: 'success', message: 'Reset token issued', token });
  } catch (error) {
    console.error('Request reset error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to request reset' });
  }
});

// Confirm password reset
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword) return res.status(400).json({ status: 'error', message: 'token and newPassword are required' });
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpires: { gt: new Date() } } });
    if (!user) return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExpires: null } });
    return res.json({ status: 'success', message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to reset password' });
  }
});

// Database test endpoint
app.get('/api/test', async (_req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get counts for verification
    const userCount = await prisma.user.count();
    const lessonCount = await prisma.lesson.count();
    const exerciseCount = await prisma.exercise.count();
    const progressCount = await prisma.userProgress.count();
    
    res.json({
      status: 'success',
      message: 'Database connection and queries working',
      counts: {
        users: userCount,
        lessons: lessonCount,
        exercises: exerciseCount,
        progress: progressCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Lessons endpoints
app.get('/api/lessons', async (req, res) => {
  try {
    const { musicSystem, difficulty, category } = req.query;
    
    const where: any = {};
    if (musicSystem) where.musicSystem = musicSystem;
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    
    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: true,
        _count: {
          select: { exercises: true, progress: true }
        }
      }
    });
    
    res.json({
      status: 'success',
      data: lessons,
      count: lessons.length
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lessons',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: true,
        progress: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: 'Lesson not found'
      });
    }
    
    res.json({
      status: 'success',
      data: lesson
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch lesson',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        skillLevel: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: { progress: true }
        }
      }
    });
    
    res.json({
      status: 'success',
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Exercises endpoints
app.get('/api/exercises', async (req, res) => {
  try {
    const { lessonId, type, difficulty } = req.query;
    
    const where: any = {};
    if (lessonId) where.lessonId = lessonId;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    
    const exercises = await prisma.exercise.findMany({
      where,
      include: {
        lesson: {
          select: { title: true, musicSystem: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      status: 'success',
      data: exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exercises',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Progress endpoints
app.get('/api/progress', async (req, res) => {
  try {
    const { userId, lessonId } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (lessonId) where.lessonId = lessonId;
    
    const progress = await prisma.userProgress.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        },
        lesson: {
          select: { title: true, musicSystem: true }
        }
      },
      orderBy: { lastAttempted: 'desc' }
    });
    
    res.json({
      status: 'success',
      data: progress,
      count: progress.length
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [userCount, lessonCount, exerciseCount, progressCount] = await Promise.all([
      prisma.user.count(),
      prisma.lesson.count(),
      prisma.exercise.count(),
      prisma.userProgress.count()
    ]);
    
    const musicSystemStats = await prisma.lesson.groupBy({
      by: ['musicSystem'],
      _count: { id: true }
    });
    
    const difficultyStats = await prisma.lesson.groupBy({
      by: ['difficulty'],
      _count: { id: true }
    });
    
    res.json({
      status: 'success',
      data: {
        totalUsers: userCount,
        totalLessons: lessonCount,
        totalExercises: exerciseCount,
        totalProgress: progressCount,
        musicSystemBreakdown: musicSystemStats,
        difficultyBreakdown: difficultyStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🎵 Unlock Music Learning API listening on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Database test: http://localhost:${port}/api/test`);
  console.log(`📈 Statistics: http://localhost:${port}/api/stats`);
});
