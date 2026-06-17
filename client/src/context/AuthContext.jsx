import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi, getMe } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      // Only log if it's not a 401 (expected when not logged in)
      if (error.response?.status !== 401) {
        console.error('Auth check error:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      // Save token to localStorage so the request interceptor can send it
      // as an Authorization header (fallback for when cookies are blocked in production)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isTL: user?.role === 'TL',
    isEmployee: user?.role === 'Employee'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
