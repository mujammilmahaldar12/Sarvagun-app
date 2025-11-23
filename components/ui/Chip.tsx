import React from 'react';
import { View, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
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
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'subtle',
  color,
  size = 'md',
  style,
  selected = false,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const chipColor = color || theme.primary;
  const isInteractive = !!onPress;

  const getVariantStyle = (pressed: boolean): ViewStyle => {
    // If selected, always show filled style
    if (selected) {
      return {
        backgroundColor: chipColor,
        borderWidth: 2,
        borderColor: chipColor,
      };
    }

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: pressed ? `${chipColor}dd` : chipColor,
        };
      case 'outlined':
        return {
          backgroundColor: pressed ? `${chipColor}10` : 'transparent',
          borderWidth: 1.5,
          borderColor: chipColor,
        };
      case 'subtle':
      default:
        return {
          backgroundColor: pressed ? `${chipColor}25` : `${chipColor}15`,
        };
    }
  };

  const getTextColor = (): string => {
    if (selected || variant === 'filled') {
      return '#FFFFFF';
    }
    return chipColor;
  };

  const baseStyle: ViewStyle = {
    paddingHorizontal: size === 'sm' ? spacing.sm : spacing.md,
    paddingVertical: size === 'sm' ? spacing.xs : spacing.sm,
    borderRadius: borderRadius.full,
  };

  const textStyle: TextStyle = {
    ...getTypographyStyle(size === 'sm' ? 'xs' : 'sm', 'semibold'),
    color: getTextColor(),
  };

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          baseStyle,
          getVariantStyle(pressed),
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, getVariantStyle(false), style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};
