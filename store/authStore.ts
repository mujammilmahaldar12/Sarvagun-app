import { create } from "zustand";
import { authService } from "../services/auth.service";
import { getToken } from "../utils/storage";
import { syncPermissionsWithAuth } from "./permissionStore";
import { cacheUtils } from "../lib/queryClient";
import type { User } from "@/types/user";

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      set({ isLoading: true });
      
      const response = await authService.login({ username, password });
      
      set({
        user: response.user,
        accessToken: response.access,
        refreshToken: response.refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      // Sync permissions with auth state
      syncPermissionsWithAuth();

      return true;
    } catch (error: any) {
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
      });

      if (accessToken && storedUser) {
        console.log('✅ User found, restoring session');
        set({
          user: storedUser,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Sync permissions after loading user
        syncPermissionsWithAuth();
      } else {
        console.log('❌ No valid session found');
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
}));
