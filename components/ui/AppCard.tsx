import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import { spacing, borderRadius, borderWidth } from "@/constants/designTokens";
import { getShadowStyle, getTypographyStyle } from "@/utils/styleHelpers";
import type { ShadowKey } from "@/constants/designTokens";

type AppCardProps = {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: "elevated" | "outlined" | "filled";
  padding?: keyof typeof spacing;
  shadow?: ShadowKey;
  style?: ViewStyle;
};

export default function AppCard({ 
  title, 
  children, 
  onPress,
  variant = "elevated",
  padding = "base",
  shadow = "md",
  style,
}: AppCardProps) {
  const { colors } = useThemeStore();

  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing[padding],
    };

    switch (variant) {
      case "elevated":
        return {
          ...baseStyle,
          ...getShadowStyle(shadow),
        };
      case "outlined":
        return {
          ...baseStyle,
          borderWidth: borderWidth.thin,
          borderColor: colors.border,
        };
      case "filled":
        return {
          ...baseStyle,
          backgroundColor: `${colors.primary}08`,
        };
      default:
        return baseStyle;
    }
  };

  const titleStyle: TextStyle = {
    ...getTypographyStyle('lg', 'semibold'),
    color: colors.text,
    marginBottom: spacing.md,
  };

  const CardContent = (
    <View style={[getVariantStyle(), style]}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}
