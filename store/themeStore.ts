import React, { createContext, useContext, useState, ReactNode } from "react";

// 1: Define context type
type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

// 2: Create context with default null
const ThemeContext = createContext<ThemeContextType | null>(null);

// 3: Provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 4: Hook
export function useThemeStore() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useThemeStore must be used inside ThemeProvider");
  }

  return ctx;
}
