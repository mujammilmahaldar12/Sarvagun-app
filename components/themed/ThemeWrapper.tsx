import { useThemeStore } from "@/store/themeStore";
import { View } from "react-native";

export default function ThemeWrapper({ children }: any) {
  const { theme } = useThemeStore();

  return (
    <View style={{ flex: 1, backgroundColor: theme === "dark" ? "#000" : "#fff" }}>
      {children}
    </View>
  );
}
