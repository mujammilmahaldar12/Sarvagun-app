// store/themeStore.ts
import { create } from "zustand";

export const THEME = {
  light: {
    background: "#F5F3F7",
    surface: "#FFFFFF",
    foreground: "#1A1A1A",
    primary: "#6D376D",
    border: "#E3DCE9",
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
  },
  dark: {
    background: "#0F0E10",
    surface: "#1A171D",
    foreground: "#F5F5F5",
    primary: "#9D5B9D",
    border: "#2A242E",
    text: "#F9FAFB",
    textSecondary: "#D1D5DB",
    textTertiary: "#9CA3AF",
  },
} as const;

type ThemeName = keyof typeof THEME;

type ThemeState = {
  mode: ThemeName;
  colors: (typeof THEME)[ThemeName];
  toggleMode: () => void;
  setMode: (mode: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  colors: THEME.light,

  toggleMode: () => {
    const current = get().mode;
    const next = current === "light" ? "dark" : "light";
    set({ mode: next, colors: THEME[next] });
  },

  setMode: (mode) => set({ mode, colors: THEME[mode] }),
}));
