import { View } from "react-native";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { mode, theme } = useThemeStore();

  // Combine theme and mode: e.g., "default-light", "winter-dark"
  const themeKey = `${theme}-${mode}`;
  const bgClass = `bg-${themeKey}-background`;

  return (
    <View className={`${bgClass} flex-1`}>
      {children}
    </View>
  );
}
