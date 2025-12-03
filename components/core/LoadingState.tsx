/**
 * LoadingState Component
 * Display loading states with spinner, skeleton, or shimmer effects
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, borderRadius } = designSystem;

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Variant of loading indicator */
  variant?: 'spinner' | 'skeleton' | 'shimmer';
  /** Size of loading indicator */
  size?: 'small' | 'medium' | 'large';
  /** Custom color */
  color?: string;
  /** Number of skeleton items (for skeleton variant) */
  skeletonCount?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  variant = 'spinner',
  size = 'medium',
  color,
  skeletonCount = 3,
}) => {
  const { colors } = useThemeStore();

  if (variant === 'spinner') {
    return <SpinnerLoader message={message} size={size} color={color || colors.primary} />;
  }

  if (variant === 'skeleton') {
    return <SkeletonLoader count={skeletonCount} />;
  }

  if (variant === 'shimmer') {
    return <ShimmerLoader count={skeletonCount} />;
  }

  return null;
};

// Spinner Loader
const SpinnerLoader: React.FC<{
  message: string;
  size: 'small' | 'medium' | 'large';
  color: string;
}> = ({ message, size, color }) => {
  const { colors } = useThemeStore();

  const spinnerSize = size === 'small' ? 20 : size === 'medium' ? 32 : 48;

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={spinnerSize} color={color} />
      {message && (
        <Text style={[styles.message, { color: colors.text.secondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

// Skeleton Loader
const SkeletonLoader: React.FC<{ count: number }> = ({ count }) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View
            style={[
              styles.skeletonCircle,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.skeletonContent}>
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineTitle,
                { backgroundColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineSubtitle,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

// Shimmer Loader
const ShimmerLoader: React.FC<{ count: number }> = ({ count }) => {
  const { colors } = useThemeStore();
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[styles.skeletonCard, animatedStyle]}>
          <View
            style={[
              styles.skeletonCircle,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.skeletonContent}>
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineTitle,
                { backgroundColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineSubtitle,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.md,
  },
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skeletonContent: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  skeletonLineTitle: {
    width: '70%',
  },
  skeletonLineSubtitle: {
    width: '50%',
  },
});
