import React from 'react';
import { Pressable, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

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
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          iconSize: 16,
          borderRadius: 8,
        };
      case 'medium':
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
          borderRadius: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 18,
          iconSize: 20,
          borderRadius: 12,
        };
      default:
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
          borderRadius: 10,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          background: theme.colors.primary,
          backgroundPressed: theme.colors.primary + 'cc',
          borderColor: 'transparent',
          textColor: '#FFFFFF',
        };
      case 'outlined':
        return {
          background: 'transparent',
          backgroundPressed: theme.colors.primary + '10',
          borderColor: theme.colors.primary,
          textColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          background: 'transparent',
          backgroundPressed: theme.colors.primary + '10',
          borderColor: 'transparent',
          textColor: theme.colors.primary,
        };
      default:
        return {
          background: theme.colors.primary,
          backgroundPressed: theme.colors.primary + 'cc',
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
          shadowColor: variant === 'filled' ? theme.colors.primary : 'transparent',
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