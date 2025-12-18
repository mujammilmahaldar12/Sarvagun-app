/**
 * KPICard Component
 * Minimalist clean design with colored accents
 * Display key performance indicators with subtle styling
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
  /** Gradient colors (not used in minimalist design, kept for compatibility) */
  gradient?: string[];
  /** Loading state */
  loading?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Use compact layout for horizontal scrolling */
  compact?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  subtitle,
  icon,
  color = '#6366f1',
  gradient,
  loading = false,
  onPress,
  disabled = false,
  compact = false,
}) => {
  const { colors, isDark } = useThemeStore();

  // Animation for press interaction
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && !disabled && !loading) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

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
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      style={[animatedStyle, compact ? styles.compactWrapper : styles.wrapper]}
    >
      <Container
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
          compact && styles.compactContainer,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {/* Colored left border accent */}
        <View style={[styles.borderAccent, { backgroundColor: color }]} />

        <View style={styles.cardContent}>
          {/* Icon Section */}
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
              <Ionicons name={icon} size={28} color={color} />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
              {title}
            </Text>

            {loading ? (
              <ActivityIndicator size="small" color={color} style={styles.loader} />
            ) : (
              <>
                <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Text>

                {trend && (
                  <View style={styles.trendContainer}>
                    <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '15' }]}>
                      <Ionicons
                        name={getTrendIcon()!}
                        size={12}
                        color={getTrendColor()}
                      />
                      <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                        {trend.value > 0 ? '+' : ''}
                        {trend.value}%
                      </Text>
                    </View>
                    {trend.label && (
                      <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>
                        {trend.label}
                      </Text>
                    )}
                  </View>
                )}

                {subtitle && (
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Arrow indicator for pressable cards */}
          {onPress && !loading && (
            <View style={[styles.arrowContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </Container>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 200,
  },
  compactWrapper: {
    width: 170, // Slightly smaller for cleaner look
  },
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
  },
  compactContainer: {
    minHeight: 120,
  },
  borderAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    // Color applied inline via props
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
    // Color applied inline via props
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: spacing.sm,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  trendValue: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    // Color applied inline via props
  },
  trendLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    // Color applied inline via props
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
    fontWeight: '500',
    // Color applied inline via props
  },
  arrowContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
