import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { API_BASE_URL } from '../lib/config';

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

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');

        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated, clear state
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (email, username, password, name) => {
    try {
      const response = await api.post('/auth/signup', {
        email,
        username,
        password,
        name
      });

      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed' 
      };
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      });

      setUser(response.data.user);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state regardless of API call success
      setUser(null);
    }
  };

  const refreshTokens = async () => {
    try {
      const response = await api.post('/auth/refresh');
      return { success: true, data: response.data };
    } catch (error) {
      // If refresh fails, logout user
      logout();
      return { 
        success: false, 
        error: error.response?.data?.error || 'Token refresh failed' 
      };
    }
  };

  const isAuthenticated = !!user;
  const isRoot = user?.role === 'root';

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshTokens,
    isAuthenticated,
    isRoot,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};