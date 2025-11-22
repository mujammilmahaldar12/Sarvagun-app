// Safe auth service implementation
import api from './api';
import { storeToken, getToken, removeToken } from '../utils/storage';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post('/hr/auth/login/', {
        username: credentials.username,
        password: credentials.password,
      });
      
      const { access, refresh, user } = response.data;
      
      // Store tokens safely
      await storeToken('access', access);
      await storeToken('refresh', refresh);
      await storeToken('user', JSON.stringify(user));
      
      return { access, refresh, user };
    } catch (error) {
      throw error;
    }
  },

  logout: async (refreshToken?: string) => {
    try {
      console.log('🔐 Auth Service: Starting logout...');
      
      if (refreshToken) {
        console.log('📡 Auth Service: Calling logout API...');
        await api.post('/hr/auth/logout/', {
          refresh: refreshToken,
        });
        console.log('✅ Auth Service: Logout API successful');
      } else {
        console.log('⚠️ Auth Service: No refresh token provided');
      }
    } catch (error) {
      console.log('❌ Auth Service: Logout API error:', error);
      // Silent error - proceed with local cleanup
    } finally {
      console.log('🧹 Auth Service: Clearing all storage...');
      // Always clean local storage
      await removeToken('access');
      await removeToken('refresh');
      await removeToken('user');
      console.log('✅ Auth Service: Storage cleared');
    }
  },

  getStoredUser: async () => {
    try {
      const userString = await getToken('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = await getToken('refresh');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/hr/auth/token/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      await storeToken('access', access);
      
      return access;
    } catch (error) {
      // Token refresh failed, clear everything
      await removeToken('access');
      await removeToken('refresh');
      await removeToken('user');
      throw error;
    }
  },
};
