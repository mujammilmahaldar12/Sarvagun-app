import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getToken, storeToken, removeToken } from "../../utils/storage";

// Base API URL - Using your local network IP
const API_BASE_URL = __DEV__ 
  ? "http://10.121.1.106:8000/api"  // Your PC's current local IP
  : "https://api.manager.blingsquare.in/api";  // Production

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await getToken('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📡 API: ${config.method?.toUpperCase()} ${config.url} [AUTHENTICATED]`);
    } else {
      console.log(`📡 API: ${config.method?.toUpperCase()} ${config.url} [NO TOKEN]`);
    }
    return config;
  },
  (error) => {
    console.log('❌ API: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshToken = await getToken("refresh");
        if (refreshToken) {
          console.log('🔄 API: Attempting token refresh...');
          const response = await axios.post(`${API_BASE_URL}/hr/auth/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          await storeToken('access', newAccessToken);
          console.log('✅ API: Token refreshed successfully');

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        } else {
          console.log('❌ API: No refresh token available, clearing storage');
          // No refresh token, clear everything
          await removeToken('access');
          await removeToken('refresh');
          await removeToken('user');
          throw new Error('Session expired');
        }
      } catch (refreshError) {
        console.log('❌ API: Token refresh failed, clearing storage:', refreshError);
        // Refresh failed - clear tokens and reject
        await removeToken('access');
        await removeToken('refresh');
        await removeToken('user');
        return Promise.reject(new Error('Session expired, please login again'));
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Pagination response type
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// API helper functions
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => {
      console.log(`📦 apiClient.get response for ${url}:`, {
        hasResults: res.data && typeof res.data === 'object' && 'results' in res.data,
        isArray: Array.isArray(res.data),
        dataType: typeof res.data,
        resultsLength: (res.data as any)?.results?.length,
        directLength: Array.isArray(res.data) ? res.data.length : undefined,
      });
      
      // Return full paginated response if it has pagination metadata
      if (res.data && typeof res.data === 'object' && 'results' in res.data) {
        console.log(`✅ Returning paginated response: ${(res.data as any).results.length} items, total: ${(res.data as any).count}`);
        return res.data;
      }
      console.log(`✅ Returning data directly`);
      return res.data;
    }),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((res) => res.data),
};
