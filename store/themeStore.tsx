import { create } from "zustand";

type ThemeState = {
  mode: "light" | "dark";
  toggleMode: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",

  toggleMode: () => {
    const current = get().mode;
    set({ mode: current === "light" ? "dark" : "light" });
  },
}));
