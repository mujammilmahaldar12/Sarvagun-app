import { create } from "zustand";
import { authService } from "../services/auth.service";
import { getToken, isFirstTimeUser, markOnboardingComplete } from "../utils/storage";
import { useThemeStore } from "./themeStore";
import { cacheUtils } from "../lib/queryClient";
import type { User } from "@/types/user";

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showOnboarding: boolean;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  showOnboarding: false,

  login: async (username, password) => {
    try {
      console.log('🔐 Starting login process...');
      set({ isLoading: true });

      const response = await authService.login({ username, password });
      console.log('✅ Login API successful, received tokens');

      // Check if first-time user
      const isFirstTime = await isFirstTimeUser();
      console.log('👤 First time user check:', isFirstTime);

      // Update store state
      set({
        user: response.user,
        accessToken: response.access,
        refreshToken: response.refresh,
        isAuthenticated: true,
        isLoading: false,
        showOnboarding: isFirstTime,
      });

      console.log('💾 Auth store updated with user data');

      // Initialize theme from user preference
      if (response.user.theme_preference) {
        useThemeStore.getState().initializeTheme(response.user.theme_preference);
        console.log('🎨 Theme initialized:', response.user.theme_preference);
      }

      // Sync permissions from backend
      try {
        const { fetchPermissions } = require('./permissionStore').usePermissionStore.getState();
        await fetchPermissions();
        console.log('🔒 Permissions synced from backend');
      } catch (permError) {
        console.log('⚠️ Failed to sync permissions:', permError);
      }

      console.log('🎉 Login process complete');
      return true;
    } catch (error: any) {
      console.log('❌ Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    console.log('🔄 Starting logout...');
    const { refreshToken } = get();

    try {
      // STEP 1: Call logout API first
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (e) {
      console.log('⚠️ Logout API error (continuing):', e);
    }

    // STEP 2: Clear AsyncStorage (including push token cache)
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
        'access',
        'refresh',
        'user',
        '@sarvagun_push_token',
        '@sarvagun_push_token_sent',
      ]);
      console.log('✅ Storage cleared (including push token cache)');
    } catch (e) {
      console.log('⚠️ Storage clear error:', e);
    }

    // STEP 3: Clear cache
    try {
      cacheUtils.clearOnLogout();
      console.log('✅ Cache cleared');
    } catch (e) {
      console.log('⚠️ Cache clear error:', e);
    }

    // STEP 4: Clear auth state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    console.log('✅ Auth state cleared');

    // STEP 5: Clear permissions
    try {
      // STEP 5: Clear permissions
      try {
        const { clearPermissions } = require('./permissionStore').usePermissionStore.getState();
        clearPermissions();
        console.log('✅ Permissions cleared');
      } catch (e) {
        console.log('⚠️ Permissions clear error:', e);
        const { clearPermissions } = require('./permissionStore').usePermissionStore.getState();
        clearPermissions();
        console.log('✅ Permissions cleared');
      }

      console.log('✅ Logout complete');
    } catch (error) {
      console.log('⚠️ Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      console.log('🔍 Loading user from storage...');
      set({ isLoading: true });

      const accessToken = await getToken("access");
      const refreshToken = await getToken("refresh");
      const storedUser = await authService.getStoredUser();

      console.log('💾 Storage check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasStoredUser: !!storedUser,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        storedUserEmail: storedUser?.email,
      });

      // Helper function to decode JWT and check expiration
      const isTokenExpired = (token: string): boolean => {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) return true;

          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp;

          if (!exp) return true;

          // Check if token is expired (with 60 second buffer)
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = exp < currentTime + 60;

          console.log('🔐 Token expiration check:', {
            exp: new Date(exp * 1000).toISOString(),
            now: new Date(currentTime * 1000).toISOString(),
            isExpired,
          });

          return isExpired;
        } catch (e) {
          console.log('⚠️ Error decoding token:', e);
          return true; // If we can't decode, assume expired
        }
      };

      if (accessToken && storedUser) {
        // Check if access token is expired
        if (isTokenExpired(accessToken)) {
          console.log('⚠️ Access token expired, attempting refresh...');

          if (refreshToken && !isTokenExpired(refreshToken)) {
            try {
              // Attempt to refresh the token
              const newAccessToken = await authService.refreshToken();
              console.log('✅ Token refreshed successfully');

              // Restore session with new token
              set({
                user: storedUser,
                accessToken: newAccessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
              });

              // Initialize theme from stored user preference
              if (storedUser.theme_preference) {
                useThemeStore.getState().initializeTheme(storedUser.theme_preference);
                console.log('🎨 Theme restored:', storedUser.theme_preference);
              }

              // Sync permissions after loading user
              const { fetchPermissions } = require('./permissionStore').usePermissionStore.getState();
              fetchPermissions().catch(console.error);
              console.log('🔒 Permissions synced for restored session');
              return;
            } catch (refreshError) {
              console.log('❌ Token refresh failed, clearing session:', refreshError);
              // Clear storage and state - force re-login
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
              set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
              return;
            }
          } else {
            console.log('❌ Refresh token expired or missing, clearing session');
            // Clear storage and state - force re-login
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.multiRemove(['access', 'refresh', 'user']);
            set({ isLoading: false, isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
            return;
          }
        }

        // Token is valid, restore session
        console.log('✅ Token valid, restoring session');
        console.log('👤 Restored user:', {
          id: storedUser.id,
          email: storedUser.email,
          name: storedUser.first_name + ' ' + storedUser.last_name,
        });

        set({
          user: storedUser,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Initialize theme from stored user preference
        if (storedUser.theme_preference) {
          useThemeStore.getState().initializeTheme(storedUser.theme_preference);
          console.log('🎨 Theme restored:', storedUser.theme_preference);
        }

        // Sync permissions after loading user
        const { fetchPermissions } = require('./permissionStore').usePermissionStore.getState();
        fetchPermissions().catch(console.error);
        console.log('🔒 Permissions synced for restored session');
      } else {
        console.log('❌ No valid session found - missing:', {
          accessToken: !accessToken ? 'access token' : null,
          storedUser: !storedUser ? 'stored user' : null,
        });
        set({ isLoading: false });
      }
    } catch (error) {
      console.log('❌ Error loading user:', error);
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user });
    // Sync permissions when user is updated
    const { fetchPermissions } = require('./permissionStore').usePermissionStore.getState();
    fetchPermissions().catch(console.error);
  },

  completeOnboarding: async () => {
    await markOnboardingComplete();
    set({ showOnboarding: false });
  },

  checkOnboardingStatus: async () => {
    const isFirstTime = await isFirstTimeUser();
    set({ showOnboarding: isFirstTime });
  },
}));
