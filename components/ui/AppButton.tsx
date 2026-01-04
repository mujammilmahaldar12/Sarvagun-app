import React from "react";
import { Text, Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { designSystem } from "@/constants/designSystem";

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
  const { theme } = useTheme();

  const isDisabled = disabled || loading;

  const getButtonStyle = (pressed: boolean): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: designSystem.spacing[2],
      borderRadius: designSystem.borderRadius.lg,
      ...getSizeStyle(),
      opacity: pressed ? 0.9 : 1,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (isDisabled) {
      return {
        ...baseStyle,
        backgroundColor: theme.border,
        borderWidth: 0,
        opacity: 0.5,
      };
    }

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: theme.primary,
          borderWidth: 0,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: `${theme.primary}15`,
          borderWidth: 1.5,
          borderColor: theme.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: theme.primary,
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
          paddingVertical: designSystem.spacing[3],
          paddingHorizontal: designSystem.spacing[5],
          minHeight: 44,
        };
      case "lg":
        return {
          paddingVertical: designSystem.spacing[6],
          paddingHorizontal: designSystem.spacing[8],
          minHeight: 56,
        };
      case "md":
      default:
        return {
          paddingVertical: designSystem.spacing[5],
          paddingHorizontal: designSystem.spacing[6],
          minHeight: 48,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === "primary") {
      // Always use white for primary buttons for proper contrast
      return "#FFFFFF";
    }
    return theme.primary;
  };

  const getTextStyle = (): TextStyle => {
    const fontSize = size === "sm" ? designSystem.typography.sizes.base :
      size === "lg" ? designSystem.typography.sizes.xl :
        designSystem.typography.sizes.lg;
    return {
      fontSize,
      fontWeight: '700',
      color: getTextColor(),
      letterSpacing: 0.3,
    };
  };

  const getIconSize = (): number => {
    switch (size) {
      case "sm":
        return 16;
      case "lg":
        return 24;
      default:
        return 20;
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
