import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface ActionButtonProps {
  onPress: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
          background: theme.colors.primary,
          backgroundPressed: theme.colors.primary + 'dd',
          text: '#FFFFFF',
        };
      case 'secondary':
        return {
          background: theme.colors.surface + '20',
          backgroundPressed: theme.colors.surface + '40',
          text: theme.colors.text,
        };
      case 'danger':
        return {
          background: '#DC2626',
          backgroundPressed: '#DC2626dd',
          text: '#FFFFFF',
        };
      case 'success':
        return {
          background: '#059669',
          backgroundPressed: '#059669dd',
          text: '#FFFFFF',
        };
      case 'warning':
        return {
          background: '#F59E0B',
          backgroundPressed: '#F59E0Bdd',
          text: '#FFFFFF',
        };
      default:
        return {
          background: theme.colors.primary,
          backgroundPressed: theme.colors.primary + 'dd',
          text: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          fontSize: 11,
          iconSize: 12,
        };
      case 'medium':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          fontSize: 12,
          iconSize: 14,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          fontSize: 14,
          iconSize: 16,
        };
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          fontSize: 12,
          iconSize: 14,
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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