import axios, { InternalAxiosRequestConfig } from 'axios';

const ENV =
  typeof import.meta !== 'undefined' ? import.meta.env : ({} as ImportMetaEnv);

const API_BASE_URL = ENV.VITE_API_URL || '/api';
const MEDIA_BASE_URL = ENV.VITE_MEDIA_URL || 'http://localhost:8000/media';
const STATIC_BASE_URL = ENV.VITE_STATIC_URL || 'http://localhost:8000/static';

// Create axios instance with optimized defaults
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Simple in-memory cache for GET requests
const requestCache = new Map<string, { data: unknown; timestamp: number }>();
// Request interceptor for auth and caching
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add cache bypass for mutations
    if (
      config.method &&
      ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())
    ) {
      // Clear related cache entries
      const urlBase = config.url?.split('?')[0] || '';
      requestCache.forEach((_, key) => {
        if (key.startsWith(urlBase)) {
          requestCache.delete(key);
        }
      });
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = /\/auth\/(login|register|token\/refresh|logout)\/?$/.test(
      requestUrl
    );

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await apiClient.post('/auth/token/refresh/', {});

        // Retry original request after cookie refresh.
        return apiClient(originalRequest);
      } catch (refreshError) {
        try {
          await apiClient.post('/auth/logout/', {});
        } catch {
          // Ignore logout failures; the session is already unusable.
        }
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for URL construction
export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getStaticUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${STATIC_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper for image URLs - try media first, fallback to static or local
export const getImageUrl = (
  path: string,
  fallback = '/images/placeholder.png'
) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/products/') || path.startsWith('/images/')) {
    // Static assets in public folder
    return path;
  }
  // API media files
  return getMediaUrl(path);
};

export default apiClient;
