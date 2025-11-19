import { View, ScrollView } from "react-native";
import { useThemeStore } from "@/store/themeStore";

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
};

export default function Screen({ children, scrollable = true }: ScreenProps) {
  const { colors } = useThemeStore();

  const Container = scrollable ? ScrollView : View;

  return (
    <Container
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
      contentContainerStyle={scrollable ? { paddingBottom: 32 } : undefined}
    >
      {children}
    </Container>
  );
}
