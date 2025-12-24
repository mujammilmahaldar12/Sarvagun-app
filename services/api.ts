import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // For development, use your local IP
  if (__DEV__) {
    // Replace with your actual local IP address
    if (Platform.OS === 'android') {
      // For Android emulator, use 10.0.2.2
      // For Android physical device, use your computer's local IP
      return 'http://10.97.251.108:8000/api';
    } else if (Platform.OS === 'ios') {
      return 'http://10.97.251.108:8000/api';
    } else {
      // For web
      return 'http://localhost:8000/api';
    }
  }

  // For production
  return 'https://api.manager.blingsquare.in/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Detailed logging for debugging
      console.log(`🔍 REQUEST DETAILS:`, {
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        headers: {
          Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
          'Content-Type': config.headers['Content-Type'],
        },
        dataType: typeof config.data,
      });
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request config error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and auto-refresh tokens
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the full response object so services can access response.data
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // A single-flight refresh promise to prevent multiple parallel refresh calls
    (api as any)._refreshPromise = (api as any)._refreshPromise || null;

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 - Try to refresh token automatically
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log('🔄 Token expired, attempting refresh...');
          const refreshToken = await AsyncStorage.getItem('refresh');

          if (!refreshToken) {
            console.log('⚠️ No refresh token available');
            // Clear stored auth and reject
            await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
            error.message = 'Session expired. Please login again.';
            return Promise.reject(error);
          }

          // If another refresh is already in progress, wait for it
          if ((api as any)._refreshPromise) {
            console.log('⏳ Waiting for in-flight token refresh...');
            try {
              const newAccess = await (api as any)._refreshPromise;
              if (newAccess) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                return api(originalRequest);
              }
            } catch (e) {
              // fall through to attempt our own refresh
            }
          }

          // Start a refresh and store the promise on the axios instance
          (api as any)._refreshPromise = (async () => {
            try {
              const refreshResponse = await axios.post(`${API_BASE_URL}/hr/auth/refresh/`, {
                refresh: refreshToken,
              });

              const newAccessToken = refreshResponse.data.access;
              const newRefreshToken = refreshResponse.data.refresh || refreshToken;

              // Store new tokens
              await AsyncStorage.setItem('access', newAccessToken);
              if (refreshResponse.data.refresh) {
                await AsyncStorage.setItem('refresh', newRefreshToken);
              }

              console.log('✅ Token refreshed successfully');
              return newAccessToken;
            } catch (refreshError: any) {
              console.error('❌ Token refresh failed:', refreshError?.response?.status, refreshError?.response?.data || refreshError.message);
              // Clear storage to force re-login
              try {
                await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
              } catch (e) {
                console.warn('⚠️ Error clearing storage after failed refresh', e);
              }
              throw refreshError;
            } finally {
              // Clear the promise so subsequent requests can attempt refresh if needed
              (api as any)._refreshPromise = null;
            }
          })();

          // Wait for refresh to complete
          const newAccess = await (api as any)._refreshPromise;
          if (newAccess) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.log('❌ Token refresh failed, logging out...');
          error.message = 'Session expired. Please login again.';
          return Promise.reject(error);
        }
      }

      // For other 401 errors or when refresh fails ensure tokens are cleared
      if (status === 401) {
        try {
          await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
        } catch (e) {
          console.warn('⚠️ Error clearing storage after 401', e);
        }
      }

      // Extract error message
      let errorMessage = 'An error occurred';
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && typeof data === 'object') {
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else {
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }

      error.message = errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ NETWORK ERROR DETAILS:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        method: error.config?.method,
        timeout: error.config?.timeout,
        errorCode: error.code,
        errorMessage: error.message,
      });
      error.message = 'Network error - Please check your connection';
    } else {
      // Something else happened
      console.error('❌ UNKNOWN ERROR:', error);
      error.message = error.message || 'An unexpected error occurred';
    }

    return Promise.reject(error);
  }
);

// Create wrapper methods that extract data from response
const apiWrapper = {
  get: async <T>(url: string, config?: any): Promise<T> => {
    console.log(`🌐 API GET: ${url}`, config?.params ? `with params: ${JSON.stringify(config.params)}` : '');
    const response = await api.get<T>(url, config);
    const hasResultsKey = response.data && typeof response.data === 'object' && 'results' in response.data;
    console.log(`📦 API Response for ${url}:`, {
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      length: Array.isArray(response.data) ? response.data.length : 'not array',
      hasResults: hasResultsKey ? (response.data as any).results.length : 'no results key',
      data: response.data
    });
    return response.data;
  },
  post: async <T>(url: string, data?: any): Promise<T> => {
    console.log(`📤 API POST: ${url}`);
    if (data instanceof FormData) {
      console.log(`📦 Request data: FormData`);
    } else {
      console.log(`📦 Request data:`, JSON.stringify(data, null, 2));
    }

    // Set proper headers for FormData
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined;

    const response = await api.post<T>(url, data, config);
    console.log(`✅ API POST Response for ${url}:`, {
      status: response.status,
      data: response.data
    });
    return response.data;
  },
  put: async <T>(url: string, data?: any): Promise<T> => {
    console.log(`🔄 API PUT: ${url}`);
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined;
    const response = await api.put<T>(url, data, config);
    return response.data;
  },
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  },
  delete: async <T>(url: string): Promise<T> => {
    console.log(`🗑️ API DELETE: ${url}`);
    const response = await api.delete<T>(url);
    console.log(`✅ API DELETE Response for ${url}:`, {
      status: response.status,
      data: response.data
    });
    return response.data;
  }
};

export default apiWrapper;
