/**
 * GoalCard - Beautiful goal/OKR card with progress
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem, baseColors } from '@/constants/designSystem';

const { spacing, borderRadius, typography } = designSystem;

interface GoalCardProps {
  title: string;
  description: string;
  progress: number; // 0-100
  target: string;
  current: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  dueDate?: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  description,
  progress,
  target,
  current,
  color,
  icon,
  dueDate,
}) => {
  const { colors, isDark } = useThemeStore();
  const progressAnim = useSharedValue(0);

  React.useEffect(() => {
    progressAnim.value = withDelay(100, withSpring(progress / 100, { damping: 15 }));
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const getProgressColor = () => {
    if (progress >= 80) return baseColors.success[500];
    if (progress >= 50) return color;
    return baseColors.warning[500];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.dueDate, { color: colors.textSecondary }]}>Due {dueDate}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {current} / {target}
          </Text>
          <Text style={[styles.progressPercentage, { color: getProgressColor() }]}>
            {progress}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Animated.View style={[progressStyle, styles.progressFillWrapper]}>
            <LinearGradient
              colors={[getProgressColor(), `${getProgressColor()}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
        </View>
      </View>

      {/* Achievement Badge */}
      {progress >= 100 && (
        <View style={[styles.achievementBadge, { backgroundColor: `${baseColors.success[500]}15` }]}>
          <Ionicons name="trophy" size={16} color={baseColors.success[500]} />
          <Text style={[styles.achievementText, { color: baseColors.success[500] }]}>
            Goal Achieved!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  description: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  progressPercentage: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFillWrapper: {
    height: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  achievementText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
