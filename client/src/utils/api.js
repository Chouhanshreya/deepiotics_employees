import axios from 'axios';

// In development, VITE_API_URL is not set so it falls back to '/api'
// which is handled by Vite's dev proxy (localhost:5000).
// In production (Render), VITE_API_URL is set to the deployed backend URL.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach token from localStorage as Authorization header fallback.
// This covers cases where the browser blocks cross-site cookies in production.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors on /auth/me endpoint (expected when not logged in)
    if (error.response?.status === 401 && !error.config.url.includes('/auth/me')) {
      console.error('Authentication error:', error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);

// Users
export const getAllUsers = () => api.get('/users');
export const getUserById = (id) => api.get(`/users/${id}`);
export const createUser = (userData) => api.post('/users', userData);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getLeaderboard = () => api.get('/users/leaderboard');
export const getTeamMembers = () => api.get('/users/team');
export const assignPoints = (id, data) => api.post(`/users/${id}/points`, data);
export const getPointHistory = (id) => api.get(`/users/${id}/points/history`);

// Tasks
export const getAllTasks = () => api.get('/tasks');
export const getMyTasks = () => api.get('/tasks/my-tasks');
export const createTask = (taskData) => api.post('/tasks', taskData);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Analytics
export const getOverview = () => api.get('/analytics/overview');
export const getTopPerformers = () => api.get('/analytics/top-performers');
export const getPointsTimeline = (period) => api.get(`/analytics/points-timeline?period=${period}`);
export const getUserStats = (id) => api.get(`/analytics/user-stats/${id || ''}`);

// Admin
export const getTLLeaderboard = () => api.get('/admin/leaderboard/tls');
export const getBestPerformers = () => api.get('/admin/best-performers');
export const declareBestEmployee = (userId) => api.post('/admin/best-employee', { userId });
export const declareBestTL = (userId) => api.post('/admin/best-tl', { userId });
export const resetMonth = () => api.post('/admin/reset-month');
export const getArchives = () => api.get('/admin/archives');
export const getArchiveById = (id) => api.get(`/admin/archives/${id}`);

export default api;
