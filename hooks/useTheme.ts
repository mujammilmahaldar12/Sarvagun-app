import { useThemeStore, THEME } from '@/store/themeStore';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    text: string; // maps to foreground
    textSecondary: string; // maps to border
    primary: string;
    border: string; // maps to border
  };
}

export function useTheme() {
  const { mode, colors, toggleMode, setMode } = useThemeStore();

  const theme: Theme = {
    colors: {
      background: colors.background,
      surface: colors.surface,
      text: colors.foreground,
      textSecondary: colors.border,
      primary: colors.primary,
      border: colors.border,
    },
  };

  return {
    theme,
    isDark: mode === 'dark',
    mode,
    toggleTheme: toggleMode,
    setTheme: setMode,
  };
}
