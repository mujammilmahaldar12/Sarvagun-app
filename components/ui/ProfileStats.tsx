// ProfileStats.tsx - KPI Grid for Profile Performance Metrics
import React from 'react';
import { View, StyleSheet } from 'react-native';
import KPICard from './KPICard';
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

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.kpiWrapper}>
          <KPICard
            title="Tenure"
            value={formatTenure(tenureMonths)}
            icon="calendar-outline"
            gradientColors={[theme.primary, theme.primaryHover]}
          />
        </View>
        
        <View style={styles.kpiWrapper}>
          <KPICard
            title="Attendance"
            value={`${attendancePercentage.toFixed(1)}%`}
            icon="checkmark-circle-outline"
            gradientColors={[
              getAttendanceColor(attendancePercentage),
              getAttendanceColor(attendancePercentage) + 'dd',
            ]}
            trend={attendancePercentage >= 95 ? 'up' : attendancePercentage >= 90 ? 'neutral' : 'down'}
            trendValue={attendancePercentage >= 95 ? 'Excellent' : attendancePercentage >= 90 ? 'Good' : 'Needs Improvement'}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.kpiWrapper}>
          <KPICard
            title="Projects"
            value={projectsCompleted.toString()}
            subtitle={tasksCompleted > 0 ? `${tasksCompleted} tasks completed` : undefined}
            icon="briefcase-outline"
            gradientColors={['#3b82f6', '#2563eb']}
          />
        </View>
        
        <View style={styles.kpiWrapper}>
          <KPICard
            title="Avg Rating"
            value={averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
            subtitle={averageRating > 0 ? '★★★★★'.substring(0, Math.round(averageRating)) : undefined}
            icon="star-outline"
            gradientColors={[
              getRatingColor(averageRating),
              getRatingColor(averageRating) + 'dd',
            ]}
            trend={averageRating >= 4.5 ? 'up' : averageRating >= 4.0 ? 'neutral' : averageRating > 0 ? 'down' : undefined}
            trendValue={averageRating >= 4.5 ? 'Outstanding' : averageRating >= 4.0 ? 'Great' : averageRating > 0 ? 'Improving' : undefined}
          />
        </View>
      </View>

      {teamSize > 0 && (
        <View style={styles.row}>
          <View style={styles.kpiWrapper}>
            <KPICard
              title="Team Size"
              value={teamSize.toString()}
              subtitle="Direct Reports"
              icon="people-outline"
              gradientColors={['#8b5cf6', '#7c3aed']}
            />
          </View>
          
          <View style={styles.kpiWrapper}>
            <KPICard
              title="Leadership"
              value="Active"
              icon="ribbon-outline"
              gradientColors={['#ec4899', '#db2777']}
            />
          </View>
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
  kpiWrapper: {
    flex: 1,
  },
  kpi: {
    flex: 1,
  },
});
