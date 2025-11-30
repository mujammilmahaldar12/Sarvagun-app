// Safe auth service implementation
import api from './api';
import { storeToken, getToken, removeToken } from '../utils/storage';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      console.log('🔐 Auth Service: Attempting login...');
      const response: any = await api.post('/hr/auth/login/', {
        username: credentials.username,
        password: credentials.password,
      });
      
      console.log('📡 Auth Service: Login API successful, response:', {
        hasResponse: !!response,
        responseType: typeof response,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : [],
        fullResponse: response,
      });
      
      // Handle different response structures
      let responseData;
      if (response && response.data) {
        responseData = response.data;
      } else if (response && typeof response === 'object' && (response as any).access) {
        // Direct response without .data wrapper
        responseData = response as any;
      } else {
        console.log('❌ Auth Service: Unexpected response structure:', response);
        throw new Error('Invalid response structure from login API');
      }
      
      const { access, refresh, user } = responseData;
      
      console.log('💾 Auth Service: Extracting tokens...', {
        hasAccess: !!access,
        hasRefresh: !!refresh,
        hasUser: !!user,
        accessLength: access?.length,
        refreshLength: refresh?.length,
        userEmail: user?.email,
        responseDataKeys: Object.keys(responseData),
      });
      
      if (!access || !refresh || !user) {
        console.log('❌ Auth Service: Missing required fields in response');
        throw new Error('Missing access token, refresh token, or user data');
      }
      
      // Store tokens safely
      await storeToken('access', access);
      await storeToken('refresh', refresh);
      await storeToken('user', JSON.stringify(user));
      
      console.log('✅ Auth Service: Tokens stored successfully');
      return { access, refresh, user };
    } catch (error) {
      console.log('❌ Auth Service: Login error:', error);
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

      const response: any = await api.post('/hr/auth/token/refresh/', {
        refresh: refreshToken,
      });

      const responseData = response?.data || response;
      const { access } = responseData;
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

  // Profile Management
  getProfile: async () => {
    try {
      const response: any = await api.get('/hr/profile/');
      return response?.data || response;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData: {
    first_name?: string;
    last_name?: string;
    designation?: string;
    gender?: string;
    dob?: string;
    address?: string;
    mobileno?: string;
  }) => {
    try {
      const response: any = await api.patch('/hr/profile/', profileData);
      
      // Update stored user data
      const responseData = response?.data || response;
      const updatedUser = responseData?.user || responseData;
      await storeToken('user', JSON.stringify(updatedUser));
      
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  uploadProfilePhoto: async (photoUri: string) => {
    try {
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri: photoUri,
        name: filename,
        type,
      } as any);

      const response: any = await api.post('/hr/profile/photo/', formData);

      // Update stored user data with new photo URL
      const userString = await getToken('user');
      if (userString) {
        const user = JSON.parse(userString);
        const responseData = response?.data || response;
        user.photo = responseData?.photo_url || responseData?.photo;
        await storeToken('user', JSON.stringify(user));
      }

      return response?.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Theme Management
  getThemePreference: async () => {
    try {
      const response: any = await api.get('/hr/profile/theme/');
      return response?.theme_preference || response?.data?.theme_preference;
    } catch (error) {
      throw error;
    }
  },

  updateThemePreference: async (theme: 'light' | 'dark') => {
    try {
      const response: any = await api.post('/hr/profile/theme/', {
        theme_preference: theme,
      });

      // Update stored user data with new theme preference
      const userString = await getToken('user');
      if (userString) {
        const user = JSON.parse(userString);
        user.theme_preference = theme;
        await storeToken('user', JSON.stringify(user));
      }

      return response?.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Change Password
  changePassword: async (data: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    try {
      const response: any = await api.post('/hr/auth/change-password/', data);
      return response?.data || response || { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  },
};
