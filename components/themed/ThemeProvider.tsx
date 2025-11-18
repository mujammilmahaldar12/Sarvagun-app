import { useThemeStore } from "@/store/themeStore";
import { PaperProvider } from "react-native-paper";
import { LightTheme, DarkTheme } from "@/constants/theme";

export function ThemeProvider({ children }: any) {
  const { mode } = useThemeStore();

  const theme = mode === "dark" ? DarkTheme : LightTheme;

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
