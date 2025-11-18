import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { cssInterop } from "nativewind";
const AnimatedView = cssInterop(Animated.View, {
  className: "style",
});

type AppCardProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
};

export default function AppCard({ title, children, onPress }: AppCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function pressIn() {
    scale.value = withSpring(0.97, { damping: 10 });
  }

  function pressOut() {
    scale.value = withSpring(1, { damping: 10 });
    onPress && onPress();
  }

  return (
    <AnimatedView
      style={animatedStyle}
      className="w-[90%] self-center my-3"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View
          className="
            p-4 rounded-3xl
            bg-surface
            shadow-lg shadow-purple-900/10
            border border-border
          "
          style={{
            elevation: 4,
          }}
        >
          {title && (
            <Text
              variant="titleMedium"
              className="text-foreground font-semibold mb-2"
            >
              {title}
            </Text>
          )}

          <View>{children}</View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
}
