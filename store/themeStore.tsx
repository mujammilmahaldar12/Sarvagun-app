import React, { createContext, useContext, useState } from "react";

// Type of theme context
type ThemeContextType = {
  theme: string;
  setTheme: (value: string) => void;
};

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useThemeStore() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeStore must be used inside ThemeProvider");
  }

  return context;
}
