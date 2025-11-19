import { useThemeStore, THEME } from '@/store/themeStore';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
}

export function useTheme() {
  const { mode, colors, toggleMode, setMode } = useThemeStore();

  const theme: Theme = {
    colors: {
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      textSecondary: colors.textSecondary,
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
