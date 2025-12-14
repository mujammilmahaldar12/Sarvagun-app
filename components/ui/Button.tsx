/**
 * Standardized Button Component
 * Professional button with multiple variants and proper accessibility
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, borderRadius } from '../../constants/designSystem';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rectangle' | 'rounded' | 'pill';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...touchableProps
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[3],
          fontSize: typography.sizes.sm,
          iconSize: 16,
        };
      case 'lg':
        return {
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[6],
          fontSize: typography.sizes.lg,
          iconSize: 24,
        };
      default:
        return {
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[5],
          fontSize: typography.sizes.base,
          iconSize: 20,
        };
    }
  };

  const getVariantStyles = () => {
    const isDisabled = disabled || isLoading;

    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDisabled ? theme.surfaceElevated : theme.surfaceElevated,
          borderWidth: 1,
          borderColor: isDisabled ? theme.border : theme.border,
          textColor: isDisabled ? theme.textDisabled : theme.text,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDisabled ? theme.border : theme.primary,
          textColor: isDisabled ? theme.textDisabled : theme.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          textColor: isDisabled ? theme.textDisabled : theme.primary,
        };
      case 'danger':
        return {
          backgroundColor: isDisabled ? theme.surfaceElevated : theme.error,
          borderWidth: 0,
          textColor: isDisabled ? theme.textDisabled : theme.textInverse,
        };
      default: // primary
        return {
          backgroundColor: isDisabled ? theme.surfaceElevated : theme.primary,
          borderWidth: 0,
          textColor: isDisabled ? theme.textDisabled : theme.textInverse,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const renderIcon = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={{ marginRight: iconPosition === 'left' ? spacing[1] : 0, marginLeft: iconPosition === 'right' ? spacing[1] : 0 }}
        />
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={variantStyles.textColor}
          style={{ marginRight: iconPosition === 'left' ? spacing[1] : 0, marginLeft: iconPosition === 'right' ? spacing[1] : 0 }}
        />
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          backgroundColor: variantStyles.backgroundColor,
          borderRadius: shape === 'pill' ? borderRadius.full : (shape === 'rectangle' ? borderRadius.sm : borderRadius.md),
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      disabled={disabled || isLoading}
      {...touchableProps}
    >
      {iconPosition === 'left' && renderIcon()}
      <Text
        style={[
          {
            fontSize: sizeStyles.fontSize,
            fontWeight: typography.weights.semibold,
            color: variantStyles.textColor,
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {iconPosition === 'right' && renderIcon()}
    </TouchableOpacity>
  );
};