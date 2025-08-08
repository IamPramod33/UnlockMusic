import axios from 'axios';
import Constants from 'expo-constants';

// Get API URL from environment configuration
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

export interface DatabaseTestResponse {
  status: 'success';
  message: string;
  counts: {
    users: number;
    lessons: number;
    exercises: number;
    progress: number;
  };
  timestamp: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  musicSystem: string;
  category?: string;
  duration?: number;
  prerequisites?: string;
  createdAt: string;
  updatedAt: string;
  exercises: Exercise[];
  _count: {
    exercises: number;
    progress: number;
  };
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  audioFile?: string;
  notation?: string;
  difficulty?: string;
  instructions?: string;
  hints?: string;
  createdAt: string;
  lesson?: {
    title: string;
    musicSystem: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  skillLevel?: string;
  subscriptionStatus?: string;
  createdAt: string;
  _count: {
    progress: number;
  };
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completionStatus: string;
  score?: number;
  timeSpent?: number;
  attempts?: number;
  lastAttempted: string;
  user?: {
    name: string;
    email: string;
  };
  lesson?: {
    title: string;
    musicSystem: string;
  };
}

export interface Statistics {
  totalUsers: number;
  totalLessons: number;
  totalExercises: number;
  totalProgress: number;
  musicSystemBreakdown: Array<{
    musicSystem: string;
    _count: { id: number };
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    _count: { id: number };
  }>;
}

// API service class
class ApiService {
  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Database test
  async testDatabase(): Promise<DatabaseTestResponse> {
    try {
      const response = await api.get('/api/test');
      return response.data;
    } catch (error) {
      console.error('Database test failed:', error);
      throw error;
    }
  }

  // Get lessons
  async getLessons(params?: {
    musicSystem?: string;
    difficulty?: string;
    category?: string;
  }): Promise<ApiResponse<Lesson[]>> {
    try {
      const response = await api.get('/api/lessons', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      throw error;
    }
  }

  // Get lesson by ID
  async getLesson(id: string): Promise<ApiResponse<Lesson>> {
    try {
      const response = await api.get(`/api/lessons/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      throw error;
    }
  }

  // Get users
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  // Get exercises
  async getExercises(params?: {
    lessonId?: string;
    type?: string;
    difficulty?: string;
  }): Promise<ApiResponse<Exercise[]>> {
    try {
      const response = await api.get('/api/exercises', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      throw error;
    }
  }

  // Get progress
  async getProgress(params?: {
    userId?: string;
    lessonId?: string;
  }): Promise<ApiResponse<UserProgress[]>> {
    try {
      const response = await api.get('/api/progress', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics(): Promise<ApiResponse<Statistics>> {
    try {
      const response = await api.get('/api/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export default for convenience
export default apiService;
