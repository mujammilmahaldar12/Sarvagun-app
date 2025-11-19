import { create } from "zustand";
import { User } from "@features/auth/types/auth.types";
import { authService } from "@features/auth/services/auth.service";
import { getToken } from "@lib/storage";
import { showMessage } from "react-native-flash-message";

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
      console.log("🔐 Login attempt:", { username });
      set({ isLoading: true });
      
      const response = await authService.login({ username, password });
      console.log("✅ Login successful:", response.user.username);
      
      set({
        user: response.user,
        accessToken: response.access,
        refreshToken: response.refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      showMessage({
        message: "Welcome back!",
        description: `Logged in as ${response.user.first_name}`,
        type: "success",
      });

      return true;
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      set({ isLoading: false });
      
      showMessage({
        message: "Login Failed",
        description: error.response?.data?.non_field_errors?.[0] || "Invalid credentials",
        type: "danger",
      });

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
      console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });

      showMessage({
        message: "Logged out",
        description: "You have been logged out successfully",
        type: "info",
      });
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
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Load user error:", error);
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
