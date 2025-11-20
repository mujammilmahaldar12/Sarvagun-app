import React from "react";
import { Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import { spacing, borderRadius, iconSizes, touchTarget, opacity as opacityTokens } from "@/constants/designTokens";
import { getTypographyStyle, getShadowStyle } from "@/utils/styleHelpers";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export default function AppButton({ 
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
}: AppButtonProps) {
  const { colors } = useThemeStore();

  const isDisabled = disabled || loading;

  const getButtonStyle = (pressed: boolean): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      ...getSizeStyle(),
      opacity: pressed ? 0.9 : 1,
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
          // Add subtle depth
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
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          minHeight: touchTarget.min,
        };
      case "lg":
        return {
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing['2xl'],
          minHeight: touchTarget.large,
        };
      case "md":
      default:
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          minHeight: touchTarget.comfortable,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === "primary") {
      return "#FFFFFF";
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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [getButtonStyle(pressed), style]}
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
    </Pressable>
  );
}
