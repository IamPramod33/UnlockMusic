import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get API URL from environment configuration
export const API_URL = 'http://Pramods-Pro-14.local:4000';
console.log('API_URL configured as:', API_URL);
console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);

export function resolveMediaUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${API_URL}${pathOrUrl}`;
  return `${API_URL}/${pathOrUrl}`;
}

// Keys for token storage
const KEY_ACCESS = 'auth_token';
const KEY_REFRESH = 'refresh_token';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if available
api.interceptors.request.use(async (config) => {
  try {
    let token = await SecureStore.getItemAsync(KEY_ACCESS);
    if (!token && typeof window !== 'undefined') {
      token = window.localStorage?.getItem(KEY_ACCESS) || undefined;
    }
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token?: string) => void> = [];

async function getRefreshTokenFromStorage(): Promise<string | undefined> {
  try {
    let rt = await SecureStore.getItemAsync(KEY_REFRESH);
    if (!rt && typeof window !== 'undefined') {
      rt = window.localStorage?.getItem(KEY_REFRESH) || undefined;
    }
    return rt || undefined;
  } catch {
    if (typeof window !== 'undefined') {
      return window.localStorage?.getItem(KEY_REFRESH) || undefined;
    }
    return undefined;
  }
}

async function saveTokens(access?: string, refresh?: string) {
  try {
    if (access) {
      await SecureStore.setItemAsync(KEY_ACCESS, access);
      if (typeof window !== 'undefined') window.localStorage?.setItem(KEY_ACCESS, access);
    }
    if (refresh) {
      await SecureStore.setItemAsync(KEY_REFRESH, refresh);
      if (typeof window !== 'undefined') window.localStorage?.setItem(KEY_REFRESH, refresh);
    }
  } catch {
    if (typeof window !== 'undefined') {
      if (access) window.localStorage?.setItem(KEY_ACCESS, access);
      if (refresh) window.localStorage?.setItem(KEY_REFRESH, refresh);
    }
  }
}

async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(KEY_ACCESS);
    await SecureStore.deleteItemAsync(KEY_REFRESH);
  } catch {}
  if (typeof window !== 'undefined') {
    window.localStorage?.removeItem(KEY_ACCESS);
    window.localStorage?.removeItem(KEY_REFRESH);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        // queue the request until refresh completes
        return new Promise((resolve) => {
          pendingRequests.push((token?: string) => {
            if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      isRefreshing = true;
      try {
        const refreshToken = await getRefreshTokenFromStorage();
        if (!refreshToken) {
          await clearTokens();
          return Promise.reject(error);
        }
        const res = await api.post('/api/auth/refresh', { refreshToken });
        const newAccess = res.data?.token as string | undefined;
        const newRefresh = res.data?.refreshToken as string | undefined;
        if (newAccess) {
          await saveTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          pendingRequests.forEach((cb) => cb(newAccess));
          pendingRequests = [];
          return api(originalRequest);
        }
      } catch (e) {
        await clearTokens();
        pendingRequests.forEach((cb) => cb());
        pendingRequests = [];
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

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
  role?: string;
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
  // Auth
  async register(payload: { email: string; password: string; name?: string }): Promise<{ token: string }> {
    const res = await api.post('/api/auth/register', payload);
    const token = res.data?.token as string | undefined;
    const refresh = res.data?.refreshToken as string | undefined;
    await saveTokens(token, refresh);
    return { token: token || '' };
  }

  async login(payload: { email: string; password: string }): Promise<{ token: string }> {
    const res = await api.post('/api/auth/login', payload);
    const token = res.data?.token as string | undefined;
    const refresh = res.data?.refreshToken as string | undefined;
    await saveTokens(token, refresh);
    return { token: token || '' };
  }

  async logout(): Promise<void> {
    await clearTokens();
  }

  async getMe(): Promise<ApiResponse<{ user: any }>> {
    const res = await api.get('/api/auth/me');
    return res.data;
  }

  async updateProfile(payload: { name?: string; skillLevel?: string; preferences?: any }): Promise<ApiResponse<{ user: User }>> {
    const res = await api.put('/api/user/profile', payload);
    return res.data;
  }

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    const res = await api.post('/api/user/change-password', payload);
    return res.data;
  }

  async requestPasswordReset(payload: { email: string }): Promise<ApiResponse<{ token?: string }>> {
    const res = await api.post('/api/auth/request-password-reset', payload);
    return res.data;
  }

  async resetPassword(payload: { token: string; newPassword: string }): Promise<ApiResponse> {
    const res = await api.post('/api/auth/reset-password', payload);
    return res.data;
  }

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
    title?: string;
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

  // Admin APIs
  async adminListUsers(): Promise<ApiResponse<Array<{ id: string; email: string; name?: string; role: string; createdAt: string }>>> {
    const res = await api.get('/api/admin/users');
    return res.data;
  }

  async adminUpdateUserRole(id: string, role: 'student' | 'teacher' | 'admin'): Promise<ApiResponse> {
    const res = await api.post(`/api/admin/users/${id}/role`, { role });
    return res.data;
  }

  // Admin content APIs
  async adminCreateLesson(payload: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
    const res = await api.post('/api/admin/lessons', payload);
    return res.data;
  }
  async adminUpdateLesson(id: string, payload: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
    const res = await api.put(`/api/admin/lessons/${id}`, payload);
    return res.data;
  }
  async adminDeleteLesson(id: string): Promise<ApiResponse> {
    const res = await api.delete(`/api/admin/lessons/${id}`);
    return res.data;
  }
  async adminCreateExercise(payload: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    const res = await api.post('/api/admin/exercises', payload);
    return res.data;
  }
  async adminUpdateExercise(id: string, payload: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    const res = await api.put(`/api/admin/exercises/${id}`, payload);
    return res.data;
  }
  async adminDeleteExercise(id: string): Promise<ApiResponse> {
    const res = await api.delete(`/api/admin/exercises/${id}`);
    return res.data;
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
