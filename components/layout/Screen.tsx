import { View } from "react-native";
import { useTheme } from "react-native-paper";

export default function Screen({ children }: any) {
  const theme = useTheme();

  return (
    <View
      className="flex-1 px-4 py-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      {children}
    </View>
  );
}
