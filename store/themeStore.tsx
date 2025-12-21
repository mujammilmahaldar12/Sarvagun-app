/**
 * Enhanced Theme Store for Sarvagun App
 * Professional theme management with design system integration and backend sync
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { designSystem, type ThemeName, type Theme } from "../constants/designSystem";
import { authService } from "../services/auth.service";

type ThemeState = {
  mode: ThemeName;
  colors: Theme;
  isDark: boolean;

  // Actions
  toggleMode: () => Promise<void>;
  setMode: (mode: ThemeName, syncBackend?: boolean) => Promise<void>;
  initializeTheme: (userTheme?: 'light' | 'dark') => void;

  // Status color helpers
  getStatusColor: (status: string, type?: 'bg' | 'text') => string;

  // Component style helpers
  getCardStyle: () => object;
  getInputStyle: () => object;
  getButtonStyle: (variant?: 'primary' | 'secondary' | 'ghost') => object;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      colors: designSystem.themes.light,
      isDark: false,

      toggleMode: async () => {
        const current = get().mode;
        const next = current === "light" ? "dark" : "light";

        // Update local state immediately for smooth UX
        set({
          mode: next,
          colors: designSystem.themes[next] as any,
          isDark: next === "dark"
        });

        // Sync with backend
        try {
          await authService.updateThemePreference(next);
        } catch (error) {
          console.error('Failed to sync theme with backend:', error);
          // Theme already updated locally, so user experience isn't affected
        }
      },

      setMode: async (mode, syncBackend = true) => {
        set({
          mode,
          colors: designSystem.themes[mode] as any,
          isDark: mode === "dark"
        });

        // Optionally sync with backend
        if (syncBackend) {
          try {
            await authService.updateThemePreference(mode);
          } catch (error) {
            console.error('Failed to sync theme with backend:', error);
          }
        }
      },

      initializeTheme: (userTheme) => {
        if (userTheme) {
          // Load theme from user preferences (from login response)
          set({
            mode: userTheme,
            colors: designSystem.themes[userTheme] as any,
            isDark: userTheme === "dark"
          });
        }
        // If no userTheme provided, keep the persisted value from storage
      },

      getStatusColor: (status, type = 'bg') => {
        const { statusColors } = designSystem;
        const { mode } = get();

        // Map common status values
        const statusMap: Record<string, keyof typeof statusColors> = {
          'pending': 'pending',
          'converted': 'converted',
          'rejected': 'rejected',
          'planned': 'planned',
          'in_progress': 'inProgress',
          'inProgress': 'inProgress',
          'completed': 'completed',
          'cancelled': 'cancelled',
        };

        const statusKey = statusMap[status] || 'pending';
        const colorConfig = statusColors[statusKey]?.[mode];

        return colorConfig?.[type] || get().colors.text;
      },

      getCardStyle: () => {
        const { colors } = get();
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: designSystem.borderRadius.lg,
          ...designSystem.shadows.sm,
        };
      },

      getInputStyle: () => {
        const { colors } = get();
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: designSystem.borderRadius.md,
          paddingHorizontal: designSystem.spacing[4],
          paddingVertical: designSystem.spacing[3],
          fontSize: designSystem.typography.sizes.base,
          color: colors.text,
        };
      },

      getButtonStyle: (variant = 'primary') => {
        const { colors } = get();

        const variants = {
          primary: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            color: colors.textInverse,
          },
          secondary: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
          ghost: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            color: colors.primary,
          },
        };

        return {
          ...variants[variant],
          borderWidth: 1,
          borderRadius: designSystem.borderRadius.md,
          paddingHorizontal: designSystem.spacing[6],
          paddingVertical: designSystem.spacing[3],
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.medium,
          minHeight: designSystem.layout.touchTarget,
          alignItems: 'center',
          justifyContent: 'center',
        };
      },
    }),
    {
      name: "sarvagun-theme-store",
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync derived state with persisted mode
          state.colors = designSystem.themes[state.mode] as any;
          state.isDark = state.mode === 'dark';
        }
      },
    }
  )
);

// Export the design system for direct access
export { designSystem };

// Export theme hook for easier usage
export const useTheme = () => {
  const themeStore = useThemeStore();
  return {
    ...themeStore,
    theme: themeStore.colors,
    spacing: designSystem.spacing,
    typography: designSystem.typography,
    borderRadius: designSystem.borderRadius,
    shadows: designSystem.shadows,
    layout: designSystem.layout,
    iconSizes: designSystem.iconSizes,
  };
};

// Backwards compatibility (deprecated - use useTheme instead)
export const THEME = designSystem.themes;
