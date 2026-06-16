import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
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
