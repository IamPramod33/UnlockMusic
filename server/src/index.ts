import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
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
