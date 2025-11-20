import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, iconSizes } from '../../constants/designTokens';
import { getTypographyStyle, getCenteredStyle } from '../../utils/styleHelpers';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
  style,
}) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    ...getCenteredStyle(),
    padding: spacing['3xl'],
  };

  const iconContainerStyle: ViewStyle = {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}10`,
    ...getCenteredStyle(),
    marginBottom: spacing.lg,
  };

  const titleStyle: TextStyle = {
    ...getTypographyStyle('xl', 'semibold'),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  };

  const descriptionStyle: TextStyle = {
    ...getTypographyStyle('base', 'regular'),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={iconContainerStyle}>
        <Ionicons name={icon} size={iconSizes.xl} color={theme.colors.primary} />
      </View>

      <Text style={titleStyle}>{title}</Text>

      {description && (
        <Text style={descriptionStyle}>{description}</Text>
      )}

      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    marginTop: spacing.md,
  },
});
