import React from "react";
import { Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { designSystem } from "@/constants/designSystem";
import { getTypographyStyle, getShadowStyle } from "@/utils/styleHelpers";
import { useHapticFeedback, HapticFeedbackType } from "@/hooks/useHapticFeedback";
import { SPRING_CONFIGS, SCALE_VALUES, OPACITY_VALUES, SpringConfigType } from "@/utils/animations";
import RippleEffect from './RippleEffect';

const { spacing, borderRadius, iconSizes } = designSystem;
const touchTarget = designSystem.layout;

const AnimatedPressable = Animated.createAnimatedComponent(Animated.View);

export interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
  
  // Animation props
  springConfig?: SpringConfigType;
  enableHaptic?: boolean;
  hapticType?: HapticFeedbackType;
  rippleEnabled?: boolean;
  animateOnMount?: boolean;
  
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: "button" | "link";
  testID?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  title, 
  onPress, 
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  springConfig = "gentle",
  enableHaptic = true,
  hapticType = "medium",
  rippleEnabled = false,
  animateOnMount = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  testID,
}) => {
  const { colors } = useThemeStore();
  const { triggerHaptic } = useHapticFeedback();

  const scale = useSharedValue(animateOnMount ? 0 : 1);
  const opacity = useSharedValue(animateOnMount ? 0 : 1);

  const isDisabled = disabled || loading;

  React.useEffect(() => {
    if (animateOnMount) {
      scale.value = withSpring(1, SPRING_CONFIGS[springConfig]);
      opacity.value = withSpring(1, SPRING_CONFIGS[springConfig]);
    }
  }, [animateOnMount, scale, opacity, springConfig]);

  const triggerHapticFeedback = () => {
    if (enableHaptic && !isDisabled) {
      triggerHaptic(hapticType);
    }
  };

  const handlePressIn = () => {
    if (isDisabled) return;
    
    scale.value = withSpring(SCALE_VALUES.press, SPRING_CONFIGS[springConfig]);
    opacity.value = withSpring(OPACITY_VALUES.pressed, SPRING_CONFIGS[springConfig]);
    
    runOnJS(triggerHapticFeedback)();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    
    scale.value = withSpring(1, SPRING_CONFIGS[springConfig]);
    opacity.value = withSpring(1, SPRING_CONFIGS[springConfig]);
  };

  const handlePress = () => {
    if (isDisabled) return;
    onPress();
  };

  const handleTouchEnd = () => {
    handlePressOut();
    handlePress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      ...getSizeStyle(),
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (isDisabled) {
      return {
        ...baseStyle,
        backgroundColor: colors.border,
        borderWidth: 0,
        opacity: 0.5,
      };
    }

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
          borderWidth: 0,
          ...getShadowStyle('md'),
          shadowColor: colors.primary,
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: `${colors.primary}15`,
          borderWidth: 1.5,
          borderColor: colors.primary,
          ...getShadowStyle('sm'),
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case "ghost":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      case "danger":
        return {
          ...baseStyle,
          backgroundColor: colors.error || '#EF4444',
          borderWidth: 0,
          ...getShadowStyle('md'),
          shadowColor: colors.error || '#EF4444',
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[5],
          minHeight: 44,
        };
      case "lg":
        return {
          paddingVertical: spacing[6],
          paddingHorizontal: spacing[8],
          minHeight: 56,
        };
      case "md":
      default:
        return {
          paddingVertical: spacing[5],
          paddingHorizontal: spacing[6],
          minHeight: 48,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === "primary" || variant === "danger") {
      return colors.textInverse || "#FFFFFF";
    }
    return colors.primary;
  };

  const getTextStyle = (): TextStyle => {
    const fontSize = size === "sm" ? "base" : size === "lg" ? "xl" : "lg";
    return {
      ...getTypographyStyle(fontSize, "bold"),
      color: getTextColor(),
      letterSpacing: 0.3,
    };
  };

  const getIconSize = (): number => {
    switch (size) {
      case "sm":
        return iconSizes.xs;
      case "lg":
        return iconSizes.md;
      default:
        return iconSizes.sm;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ButtonContent = () => (
    <AnimatedPressable
      style={[getButtonStyle(), animatedStyle, style]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && (
            <Ionicons name={leftIcon} size={getIconSize()} color={getTextColor()} />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && (
            <Ionicons name={rightIcon} size={getIconSize()} color={getTextColor()} />
          )}
        </>
      )}
    </AnimatedPressable>
  );

  if (rippleEnabled && !isDisabled) {
    return (
      <RippleEffect
        onPress={handlePress}
        disabled={isDisabled}
        rippleColor={getTextColor()}
        rippleOpacity={0.2}
        style={{ borderRadius: borderRadius.lg }}
      >
        <ButtonContent />
      </RippleEffect>
    );
  }

  return (
    <AnimatedPressable
      style={[getButtonStyle(), animatedStyle, style]}
      onTouchStart={handlePressIn}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handlePressOut}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && (
            <Ionicons name={leftIcon} size={getIconSize()} color={getTextColor()} />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && (
            <Ionicons name={rightIcon} size={getIconSize()} color={getTextColor()} />
          )}
        </>
      )}
    </AnimatedPressable>
  );
};

export default AnimatedButton;