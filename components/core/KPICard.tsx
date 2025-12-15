/**
 * KPICard Component
 * Display key performance indicators with trend indicators and optional actions
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

export interface KPICardProps {
  /** The title/label of the KPI */
  title: string;
  /** The main value to display */
  value: number | string;
  /** Trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  /** Subtitle or additional context */
  subtitle?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Primary color for the card accent */
  color?: string;
  /** Loading state */
  loading?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  subtitle,
  icon,
  color = '#6366f1',
  loading = false,
  onPress,
  disabled = false,
}) => {
  const { colors } = useThemeStore();

  const Container = onPress ? Pressable : View;

  const getTrendColor = () => {
    if (!trend) return colors.textSecondary;
    return trend.direction === 'up' ? '#10b981' : '#ef4444';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend.direction === 'up' ? 'trending-up' : 'trending-down';
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Container
        style={[
          styles.container,
          { backgroundColor: colors.surface },
          onPress && styles.pressable,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {/* Icon Section */}
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>
            {title}
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={color} style={styles.loader} />
          ) : (
            <>
              <Text style={[styles.value, { color: colors.text }]}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Text>

              {trend && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon()!}
                    size={16}
                    color={getTrendColor()}
                  />
                  <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </Text>
                  {trend.label && (
                    <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                      {trend.label}
                    </Text>
                  )}
                </View>
              )}

              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Arrow indicator for pressable cards */}
        {onPress && !loading && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </Container>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressable: {
    shadowOpacity: 0.15,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  value: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: spacing.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: typography.sizes.xs,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
