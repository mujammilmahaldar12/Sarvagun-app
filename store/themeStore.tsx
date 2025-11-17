import { create } from "zustand";

type ThemeMode = "light" | "dark";
type ThemeName = "default" | "winter" | "ganpati";

type ThemeState = {
  mode: ThemeMode;
  theme: ThemeName;

  toggleMode: () => void;
  setTheme: (name: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  theme: "default",

  toggleMode: () => {
    const next = get().mode === "light" ? "dark" : "light";
    set({ mode: next });
  },

  setTheme: (name) => set({ theme: name }),
}));
