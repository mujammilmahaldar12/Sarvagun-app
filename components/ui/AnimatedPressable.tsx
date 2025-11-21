import React from 'react';
import { Pressable, ViewStyle, AccessibilityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useHapticFeedback, HapticFeedbackType } from '@/hooks/useHapticFeedback';
import { SPRING_CONFIGS, SCALE_VALUES, OPACITY_VALUES, SpringConfigType } from '@/utils/animations';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends AccessibilityProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  
  // Animation configuration
  springConfig?: SpringConfigType;
  pressScale?: number;
  pressOpacity?: number;
  enableHaptic?: boolean;
  hapticType?: HapticFeedbackType;
  
  // Animation timing
  animateOnMount?: boolean;
  exitAnimation?: boolean;
  
  // Pressable props
  testID?: string;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  springConfig = 'gentle',
  pressScale = SCALE_VALUES.press,
  pressOpacity = OPACITY_VALUES.pressed,
  enableHaptic = true,
  hapticType = 'light',
  animateOnMount = false,
  exitAnimation = false,
  testID,
  hitSlop,
  ...accessibilityProps
}) => {
  const { triggerHaptic } = useHapticFeedback();
  
  // Animated values
  const scale = useSharedValue(animateOnMount ? 0 : 1);
  const opacity = useSharedValue(animateOnMount ? 0 : 1);
  
  // Mount animation
  React.useEffect(() => {
    if (animateOnMount) {
      scale.value = withSpring(1, SPRING_CONFIGS[springConfig]);
      opacity.value = withSpring(1, SPRING_CONFIGS[springConfig]);
    }
  }, [animateOnMount, scale, opacity, springConfig]);

  const triggerHapticFeedback = () => {
    if (enableHaptic && !disabled) {
      triggerHaptic(hapticType);
    }
  };

  const handlePressIn = () => {
    if (disabled) return;
    
    scale.value = withSpring(pressScale, SPRING_CONFIGS[springConfig]);
    opacity.value = withSpring(pressOpacity, SPRING_CONFIGS[springConfig]);
    
    // Trigger haptic feedback
    runOnJS(triggerHapticFeedback)();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    scale.value = withSpring(1, SPRING_CONFIGS[springConfig]);
    opacity.value = withSpring(1, SPRING_CONFIGS[springConfig]);
  };

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    onLongPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const combinedStyle = [
    animatedStyle,
    disabled && { opacity: 0.5 },
    style,
  ].filter(Boolean);

  return (
    <ReanimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      style={combinedStyle}
      testID={testID}
      hitSlop={hitSlop}
      {...accessibilityProps}
    >
      {children}
    </ReanimatedPressable>
  );
};

export default AnimatedPressable;