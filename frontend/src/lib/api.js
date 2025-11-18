import axios from 'axios';
import { API_BASE_URL, logApiConfig } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

logApiConfig();

// Request interceptor to handle errors
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Only redirect to login if we're not already on a public auth route
const shouldRedirectToLogin = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const publicPaths = ['/login', '/signup'];
  return !publicPaths.includes(window.location.pathname);
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && shouldRedirectToLogin()) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;