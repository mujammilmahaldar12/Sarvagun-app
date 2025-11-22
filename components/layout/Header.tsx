import { View, Text, Platform, StatusBar } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { designSystem } from "@/constants/designSystem";

type HeaderProps = {
  title: string;
  showBack?: boolean;
};

export default function Header({ title, showBack = false }: HeaderProps) {
  const { colors } = useThemeStore();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }}
    >
      <Text
        style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.bold,
          color: colors.foreground,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
