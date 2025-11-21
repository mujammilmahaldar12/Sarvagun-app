import { create } from "zustand";
import { authService } from "../services/auth.service";
import { getToken } from "../utils/storage";
import { syncPermissionsWithAuth } from "./permissionStore";
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
    const { refreshToken } = get();
    
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      // Silent error
    } finally {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      // Clear permissions on logout
      syncPermissionsWithAuth();
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });

      const accessToken = await getToken("access");
      const refreshToken = await getToken("refresh");
      const storedUser = await authService.getStoredUser();

      if (accessToken && storedUser) {
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
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user });
    // Sync permissions when user is updated
    syncPermissionsWithAuth();
  },
}));
