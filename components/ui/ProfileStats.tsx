// ProfileStats.tsx - Professional Stats Grid
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface ProfileStatsProps {
  projectsCompleted?: number;
  attendancePercentage?: number;
  teamSize?: number;
  tenureMonths?: number;
  averageRating?: number;
  tasksCompleted?: number;
}

export function ProfileStats({
  projectsCompleted = 0,
  attendancePercentage = 0,
  teamSize = 0,
  tenureMonths = 0,
  averageRating = 0,
  tasksCompleted = 0,
}: ProfileStatsProps) {
  const { theme } = useTheme();

  // Format tenure display
  const formatTenure = (months: number): string => {
    if (months === 0) return 'New';
    if (months < 12) return `${months}mo`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}yr`;
    return `${years}y ${remainingMonths}m`;
  };

  // Get attendance trend color
  const getAttendanceColor = (percentage: number): string => {
    if (percentage >= 95) return '#10b981'; // green
    if (percentage >= 90) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#10b981'; // green
    if (rating >= 4.0) return '#3b82f6'; // blue
    if (rating >= 3.5) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const StatCard = ({ icon, title, value, subtitle, color }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    subtitle?: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          icon="calendar-outline"
          title="Tenure"
          value={formatTenure(tenureMonths)}
          color={theme.primary}
        />
        <StatCard
          icon="checkmark-circle-outline"
          title="Attendance"
          value={`${attendancePercentage.toFixed(1)}%`}
          subtitle={attendancePercentage >= 95 ? 'Excellent' : attendancePercentage >= 90 ? 'Good' : 'Improve'}
          color={getAttendanceColor(attendancePercentage)}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          icon="briefcase-outline"
          title="Projects"
          value={projectsCompleted.toString()}
          subtitle={tasksCompleted > 0 ? `${tasksCompleted} tasks` : undefined}
          color="#3b82f6"
        />
        <StatCard
          icon="star"
          title="Rating"
          value={averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
          subtitle={averageRating > 0 ? '★'.repeat(Math.round(averageRating)) : undefined}
          color={getRatingColor(averageRating)}
        />
      </View>

      {teamSize > 0 && (
        <View style={styles.row}>
          <StatCard
            icon="people-outline"
            title="Team Size"
            value={teamSize.toString()}
            subtitle="Direct Reports"
            color="#8b5cf6"
          />
          <StatCard
            icon="ribbon"
            title="Leadership"
            value="Active"
            color="#ec4899"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.6,
  },
  statSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
