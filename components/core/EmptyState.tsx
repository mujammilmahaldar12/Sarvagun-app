/**
 * EmptyState Component
 * Display friendly empty states with optional actions
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography } = designSystem;

export interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon color */
  iconColor?: string;
  /** Main title */
  title: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Primary action button */
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  /** Custom illustration component */
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  iconColor,
  title,
  subtitle,
  action,
  secondaryAction,
  illustration,
}) => {
  const { colors } = useThemeStore();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        illustration
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Ionicons
            name={icon}
            size={64}
            color={iconColor || colors.textTertiary}
          />
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <View style={styles.actionsContainer}>
          {action && (
            <Button
              title={action.label}
              onPress={action.onPress}
              leftIcon={action.icon}
              size="md"
            />
          )}
          {secondaryAction && (
            <Button
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant="secondary"
              size="md"
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
