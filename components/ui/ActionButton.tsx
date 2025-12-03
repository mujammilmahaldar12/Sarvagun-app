import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

interface ActionButtonProps {
  onPress?: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export default function ActionButton({
  onPress,
  title,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: ActionButtonProps) {
  const { theme } = useTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: theme.primary,
          backgroundPressed: theme.primaryPressed,
          text: theme.textInverse,
        };
      case 'secondary':
        return {
          background: theme.surfaceElevated,
          backgroundPressed: `${theme.surfaceElevated}80`,
          text: theme.text,
        };
      case 'danger':
        return {
          background: theme.error,
          backgroundPressed: `${theme.error}dd`,
          text: theme.textInverse,
        };
      case 'success':
        return {
          background: theme.success,
          backgroundPressed: `${theme.success}dd`,
          text: theme.textInverse,
        };
      case 'warning':
        return {
          background: theme.warning,
          backgroundPressed: `${theme.warning}dd`,
          text: theme.textInverse,
        };
      default:
        return {
          background: theme.primary,
          backgroundPressed: theme.primaryPressed,
          text: theme.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: designSystem.spacing[2],
          paddingVertical: designSystem.spacing[1],
          borderRadius: designSystem.borderRadius.sm,
          fontSize: designSystem.typography.sizes.xs,
          iconSize: designSystem.iconSizes.xs,
        };
      case 'medium':
        return {
          paddingHorizontal: designSystem.spacing[3],
          paddingVertical: designSystem.spacing[1],
          borderRadius: designSystem.borderRadius.sm,
          fontSize: designSystem.typography.sizes.xs,
          iconSize: designSystem.iconSizes.xs,
        };
      case 'large':
        return {
          paddingHorizontal: designSystem.spacing[4],
          paddingVertical: designSystem.spacing[2],
          borderRadius: designSystem.borderRadius.md,
          fontSize: designSystem.typography.sizes.sm,
          iconSize: designSystem.iconSizes.sm,
        };
      default:
        return {
          paddingHorizontal: designSystem.spacing[3],
          paddingVertical: designSystem.spacing[1],
          borderRadius: designSystem.borderRadius.sm,
          fontSize: designSystem.typography.sizes.xs,
          iconSize: designSystem.iconSizes.xs,
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={disabled || !onPress ? undefined : onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => ([
        {
          backgroundColor: pressed ? colors.backgroundPressed : colors.background,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          opacity: disabled ? 0.5 : 1,
          ...style,
        }
      ])}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={sizeStyles.iconSize} 
          color={colors.text} 
        />
      )}
      <Text
        style={[
          {
            color: colors.text,
            fontSize: sizeStyles.fontSize,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}