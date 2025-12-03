/**
 * ActivityTimeline - Beautiful activity timeline for profile
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { GlassCard } from './GlassCard';
import { formatDistanceToNow } from 'date-fns';

const { spacing, borderRadius, typography } = designSystem;

interface Activity {
  id: string;
  type: 'task' | 'project' | 'leave' | 'achievement' | 'meeting';
  title: string;
  description: string;
  timestamp: Date | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  maxItems = 10,
}) => {
  const { colors } = useThemeStore();
  const displayActivities = activities.slice(0, maxItems);

  const getTimeAgo = (timestamp: Date | string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <GlassCard variant="default" intensity="medium">
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Activity Timeline</Text>
        </View>

        <View style={styles.timeline}>
          {displayActivities.map((activity, index) => (
            <View key={activity.id} style={styles.timelineItem}>
              {/* Timeline Line */}
              {index < displayActivities.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              )}

              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${activity.color}20` }]}>
                <Ionicons name={activity.icon} size={20} color={activity.color} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                  {activity.description}
                </Text>
                <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
                  {getTimeAgo(activity.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {activities.length > maxItems && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              +{activities.length - maxItems} more activities
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  timeline: {
    gap: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -spacing.lg,
    width: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  activityDescription: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
