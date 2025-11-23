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
      return 'http://10.231.38.95:8000/api';
    } else if (Platform.OS === 'ios') {
      return 'http://10.231.38.95:8000/api';
    } else {
      // For web
      return 'http://localhost:8000/api';
    }
  }
  
  // For production
  return 'https://your-production-api.com/api';
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
    } catch (error) {
      // Silent error
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the full response object so services can access response.data
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        await AsyncStorage.removeItem('access');
        await AsyncStorage.removeItem('refresh');
        await AsyncStorage.removeItem('user');
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
          // Handle field-specific errors
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
      error.message = 'Network error - Please check your connection';
    } else {
      // Something else happened
      error.message = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

export default api;
