import { create } from "zustand";
import { authService } from "../services/auth.service";
import { getToken, isFirstTimeUser, markOnboardingComplete } from "../utils/storage";
import { syncPermissionsWithAuth } from "./permissionStore";
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

      // Sync permissions with auth state
      syncPermissionsWithAuth();
      console.log('🔒 Permissions synced');

      console.log('🎉 Login process complete');
      return true;
    } catch (error: any) {
      console.log('❌ Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    console.log('🔄 Starting logout process...');
    const { refreshToken } = get();
    
    try {
      if (refreshToken) {
        console.log('📡 Calling logout API with refresh token...');
        await authService.logout(refreshToken);
        console.log('✅ Logout API call successful');
      } else {
        console.log('⚠️ No refresh token found, skipping API call');
      }
    } catch (error) {
      console.log('❌ Logout API error:', error);
      // Silent error - continue with local cleanup
    } finally {
      console.log('🧹 Clearing auth state...');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      
      console.log('🗂️ Clearing React Query cache...');
      // Clear React Query cache on logout
      cacheUtils.clearOnLogout();
      
      console.log('🔐 Clearing permissions...');
      // Clear permissions on logout
      syncPermissionsWithAuth();
      
      console.log('✅ Logout process complete');
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

      if (accessToken && storedUser) {
        console.log('✅ User found, restoring session');
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
        syncPermissionsWithAuth();
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
    syncPermissionsWithAuth();
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
