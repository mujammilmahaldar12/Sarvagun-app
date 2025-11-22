import React from 'react';
import { Pressable, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'filled' | 'outlined' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PrimaryButton({
  onPress,
  title,
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  variant = 'filled',
  size = 'medium',
  style,
  textStyle,
}: PrimaryButtonProps) {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: designSystem.spacing[4],
          paddingVertical: designSystem.spacing[2],
          fontSize: designSystem.typography.sizes.sm,
          iconSize: designSystem.iconSizes.xs,
          borderRadius: designSystem.borderRadius.md,
        };
      case 'medium':
        return {
          paddingHorizontal: designSystem.spacing[5],
          paddingVertical: designSystem.spacing[3],
          fontSize: designSystem.typography.sizes.base,
          iconSize: designSystem.iconSizes.sm,
          borderRadius: designSystem.borderRadius.lg,
        };
      case 'large':
        return {
          paddingHorizontal: designSystem.spacing[6],
          paddingVertical: designSystem.spacing[4],
          fontSize: designSystem.typography.sizes.lg,
          iconSize: designSystem.iconSizes.sm,
          borderRadius: designSystem.borderRadius.xl,
        };
      default:
        return {
          paddingHorizontal: designSystem.spacing[5],
          paddingVertical: designSystem.spacing[3],
          fontSize: designSystem.typography.sizes.base,
          iconSize: designSystem.iconSizes.sm,
          borderRadius: designSystem.borderRadius.lg,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          background: theme.primary,
          backgroundPressed: theme.primary + 'cc',
          borderColor: 'transparent',
          textColor: theme.textInverse,
        };
      case 'outlined':
        return {
          background: 'transparent',
          backgroundPressed: theme.primary + '10',
          borderColor: theme.primary,
          textColor: theme.primary,
        };
      case 'ghost':
        return {
          background: 'transparent',
          backgroundPressed: theme.primary + '10',
          borderColor: 'transparent',
          textColor: theme.primary,
        };
      default:
        return {
          background: theme.primary,
          backgroundPressed: theme.primary + 'cc',
          borderColor: 'transparent',
          textColor: '#FFFFFF',
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ([
        {
          backgroundColor: pressed ? variantStyles.backgroundPressed : variantStyles.background,
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: isDisabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
          minHeight: sizeStyles.paddingVertical * 2 + sizeStyles.fontSize + 4,
          shadowColor: variant === 'filled' ? theme.primary : 'transparent',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
          elevation: variant === 'filled' ? 3 : 0,
        },
        style,
      ])}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.textColor} 
        />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={sizeStyles.iconSize} 
              color={variantStyles.textColor} 
            />
          )}
          <Text
            style={[
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                fontWeight: '600',
                textAlign: 'center',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}