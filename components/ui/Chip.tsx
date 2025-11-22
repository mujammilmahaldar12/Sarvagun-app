import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { designSystem } from '../../constants/designSystem';
import { getTypographyStyle } from '../../utils/styleHelpers';

const { spacing, borderRadius } = designSystem;

interface ChipProps {
  label: string;
  variant?: 'filled' | 'outlined' | 'subtle';
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'subtle',
  color,
  size = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const chipColor = color || theme.primary;

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: chipColor,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: chipColor,
        };
      case 'subtle':
      default:
        return {
          backgroundColor: `${chipColor}15`,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'filled') {
      return '#FFFFFF';
    }
    return chipColor;
  };

  const containerStyle: ViewStyle = {
    ...getVariantStyle(),
    paddingHorizontal: size === 'sm' ? spacing.sm : spacing.md,
    paddingVertical: size === 'sm' ? spacing.xs : spacing.sm,
    borderRadius: borderRadius.full,
  };

  const textStyle: TextStyle = {
    ...getTypographyStyle(size === 'sm' ? 'xs' : 'sm', 'semibold'),
    color: getTextColor(),
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};
