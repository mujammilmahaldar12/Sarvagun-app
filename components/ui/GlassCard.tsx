/**
 * GlassCard Component - Premium Glassmorphism UI
 * iPhone/Uber-inspired glass morphism with backdrop blur
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem, baseColors } from '@/constants/designSystem';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const { spacing, borderRadius, typography } = designSystem;

interface GlassCardProps {
  children?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'shimmer';
  intensity?: 'light' | 'medium' | 'strong';
  gradientColors?: [string, string];
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  intensity = 'medium',
  gradientColors,
  onPress,
  style,
  pressable = true,
}) => {
  const { colors, isDark } = useThemeStore();
  const haptics = useHapticFeedback();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const blurIntensity = {
    light: isDark ? 20 : 30,
    medium: isDark ? 40 : 60,
    strong: isDark ? 60 : 80,
  }[intensity];

  const handlePressIn = () => {
    if (pressable && onPress) {
      scale.value = withSpring(0.97, { damping: 15 });
      opacity.value = withTiming(0.8, { duration: 100 });
      haptics.triggerLight();
    }
  };

  const handlePressOut = () => {
    if (pressable && onPress) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glassBackground = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.7)';

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.5)';

  if (Platform.OS === 'ios') {
    return (
      <Animated.View
        style={[animatedStyle, style]}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
      >
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.glassContainer,
            {
              borderColor,
              overflow: 'hidden',
            },
          ]}
        >
          {variant === 'gradient' && gradientColors && (
            <LinearGradient
              colors={[
                `${gradientColors[0]}15`,
                `${gradientColors[1]}15`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          
          {variant === 'shimmer' && (
            <View style={styles.shimmerOverlay}>
              <LinearGradient
                colors={[
                  'transparent',
                  isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          <View style={styles.content}>{children}</View>
        </BlurView>
      </Animated.View>
    );
  }

  // Android fallback with gradient background
  return (
    <Animated.View
      style={[animatedStyle, style]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      <View
        style={[
          styles.glassContainer,
          {
            backgroundColor: glassBackground,
            borderColor,
          },
        ]}
      >
        {variant === 'gradient' && gradientColors && (
          <LinearGradient
            colors={[
              `${gradientColors[0]}20`,
              `${gradientColors[1]}20`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </Animated.View>
  );
};

interface GlassKPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const GlassKPICard: React.FC<GlassKPICardProps> = ({
  title,
  value,
  icon,
  gradientColors,
  trend,
  trendValue,
  subtitle,
  onPress,
  style,
}) => {
  const { colors, isDark } = useThemeStore();
  const haptics = useHapticFeedback();

  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  const getTrendColor = () => {
    if (trend === 'up') return baseColors.success[500];
    if (trend === 'down') return baseColors.error[500];
    return colors.textSecondary;
  };

  return (
    <GlassCard
      variant="gradient"
      gradientColors={gradientColors}
      onPress={onPress}
      style={style}
    >
      <View style={styles.kpiContent}>
        {/* Icon Section */}
        <View style={styles.kpiHeader}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${gradientColors[0]}20`,
              },
            ]}
          >
            <Ionicons name={icon} size={24} color={gradientColors[0]} />
          </View>
          
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon()}
                size={14}
                color={getTrendColor()}
              />
              <Text
                style={[
                  styles.trendText,
                  { color: getTrendColor() },
                ]}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>

        {/* Value Section */}
        <Text style={[styles.kpiValue, { color: colors.text }]}>
          {value}
        </Text>

        {/* Title Section */}
        <Text style={[styles.kpiTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>

        {/* Subtitle */}
        {subtitle && (
          <Text style={[styles.kpiSubtitle, { color: colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.md,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  kpiContent: {
    gap: spacing.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  kpiValue: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.tight * typography.sizes['3xl'],
  },
  kpiTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  kpiSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
});
