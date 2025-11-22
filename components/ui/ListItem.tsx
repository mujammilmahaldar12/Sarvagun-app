import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { designSystem } from '../../constants/designSystem';
import { getTypographyStyle } from '../../utils/styleHelpers';

const { spacing, borderRadius, iconSizes } = designSystem;
const touchTarget = { comfortable: 48 };

interface ListItemProps {
  title: string;
  description?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  leftIconBackground?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  leftIcon,
  leftIconColor,
  leftIconBackground,
  rightIcon = 'chevron-forward',
  rightContent,
  onPress,
  disabled = false,
  showDivider = true,
  style,
}) => {
  const { theme } = useTheme();

  const iconBackgroundColor = leftIconBackground || `${theme.primary}15`;
  const iconColor = leftIconColor || theme.primary;

  const containerStyle: ViewStyle = {
    backgroundColor: theme.surface,
    opacity: disabled ? 0.5 : 1,
  };

  const dividerStyle: ViewStyle = {
    backgroundColor: theme.border,
  };

  return (
    <View style={[containerStyle, style]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {leftIcon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconBackgroundColor,
                },
              ]}
            >
              <Ionicons name={leftIcon} size={iconSizes.sm} color={iconColor} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text
              style={[
                getTypographyStyle('base', 'medium'),
                { color: theme.text },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {description && (
              <Text
                style={[
                  getTypographyStyle('sm', 'regular'),
                  { color: theme.textSecondary, marginTop: spacing.xs },
                ]}
                numberOfLines={2}
              >
                {description}
              </Text>
            )}
          </View>

          {rightContent || (
            onPress && (
              <Ionicons
                name={rightIcon}
                size={iconSizes.sm}
                color={theme.textSecondary}
                style={styles.rightIcon}
              />
            )
          )}
        </View>
      </TouchableOpacity>

      {showDivider && <View style={[styles.divider, dividerStyle]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    minHeight: touchTarget.comfortable,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: spacing.base + 40 + spacing.md,
  },
});
