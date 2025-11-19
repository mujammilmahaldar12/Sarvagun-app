import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useThemeStore } from "@/store/themeStore";

type AppCardProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
};

export default function AppCard({ title, children, onPress }: AppCardProps) {
  const { colors } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      style={[
        animatedStyle,
        { width: "92%", alignSelf: "center", marginVertical: 16 }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => {
          scale.value = withSpring(1);
          onPress?.();
        }}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 18,
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
          }}
        >
          {title && (
            <Text
              style={{
                color: colors.foreground,
                fontSize: 18,
                marginBottom: 8,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
          )}

          <View>{children}</View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
