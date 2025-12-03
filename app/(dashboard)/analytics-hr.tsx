/**
 * HR Analytics Screen
 * Detailed HR metrics including attendance, leave, and team insights
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AnimatedPressable, GlassCard, PerformanceChart } from '@/components';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { 
  useAttendancePercentage,
  useLeaveBalance,
  useTeamMembers,
} from '@/hooks/useHRQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HRAnalyticsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch HR data
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendancePercentage();
  const { data: leaveBalance, refetch: refetchLeave } = useLeaveBalance();
  const { data: teamMembers = [], refetch: refetchTeam } = useTeamMembers();

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchAttendance(),
      refetchLeave(),
      refetchTeam(),
    ]);
    setIsRefreshing(false);
  }, [refetchAttendance, refetchLeave, refetchTeam]);

  // Calculate metrics
  const attendancePercentage = attendanceData?.percentage || 0;
  const presentDays = attendanceData?.present_days || 0;
  const totalDays = attendanceData?.total_days || 0;
  const totalLeaves = (leaveBalance as any)?.annual_leave_available || 0;
  const teamSize = teamMembers.length;

  // Attendance trend data
  const attendanceTrendData = [
    { date: 'Mon', value: 100 },
    { date: 'Tue', value: 100 },
    { date: 'Wed', value: 100 },
    { date: 'Thu', value: 0 },
    { date: 'Fri', value: 100 },
    { date: 'Sat', value: 100 },
    { date: 'Sun', value: 100 },
  ];

  // Leave distribution
  const leaveDistribution = [
    { type: 'Sick Leave', used: 3, total: 10, color: '#EF4444' },
    { type: 'Casual Leave', used: 5, total: 12, color: '#3B82F6' },
    { type: 'Earned Leave', used: 2, total: 15, color: '#10B981' },
  ];

  // Team attendance
  const teamAttendance = [
    { name: 'Present', count: Math.floor(teamSize * 0.85), color: '#10B981' },
    { name: 'On Leave', count: Math.floor(teamSize * 0.10), color: '#F59E0B' },
    { name: 'Absent', count: Math.floor(teamSize * 0.05), color: '#EF4444' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={[moduleColors.hr.main + '30', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AnimatedPressable onPress={() => router.back()} hapticType="light">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              HR Analytics
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Attendance, leave, and team insights
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={moduleColors.hr.main} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {Math.round(attendancePercentage)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Attendance
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="time" size={32} color="#F59E0B" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {totalLeaves}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Leave Balance
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="people" size={32} color="#8B5CF6" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {teamSize}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Team Size
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="checkmark-done" size={32} color="#10B981" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {presentDays}/{totalDays}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Days Present
            </Text>
          </GlassCard>
        </View>

        {/* Attendance Trend */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Attendance Trend
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Last 7 days
          </Text>
          <View style={styles.chartContainer}>
            <PerformanceChart
              data={attendanceTrendData}
              color={moduleColors.hr.main}
              title=""
            />
          </View>
        </GlassCard>

        {/* Leave Distribution */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Leave Distribution
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            Used vs Available
          </Text>
          
          {leaveDistribution.map((leave, index) => (
            <Animated.View
              key={leave.type}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={styles.leaveItem}
            >
              <View style={styles.leaveHeader}>
                <View style={[styles.leaveDot, { backgroundColor: leave.color }]} />
                <Text style={[styles.leaveType, { color: theme.text }]}>
                  {leave.type}
                </Text>
                <Text style={[styles.leaveValue, { color: theme.text }]}>
                  {leave.used}/{leave.total}
                </Text>
              </View>
              <View style={[styles.leaveBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.leaveBarFill, 
                    { 
                      width: `${(leave.used / leave.total) * 100}%`,
                      backgroundColor: leave.color 
                    }
                  ]} 
                />
              </View>
            </Animated.View>
          ))}
        </GlassCard>

        {/* Team Attendance Today */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Team Attendance Today
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            Current status of team members
          </Text>
          
          {teamAttendance.map((item, index) => (
            <Animated.View
              key={item.name}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={styles.teamItem}
            >
              <View style={styles.teamHeader}>
                <View style={[styles.teamDot, { backgroundColor: item.color }]} />
                <Text style={[styles.teamLabel, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.teamValue, { color: theme.text }]}>
                  {item.count}
                </Text>
              </View>
              <View style={[styles.teamBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.teamBarFill, 
                    { 
                      width: `${(item.count / teamSize) * 100}%`,
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
            </Animated.View>
          ))}
        </GlassCard>

        {/* Attendance Summary */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Attendance Summary
          </Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {presentDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Present
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                {totalDays - presentDays}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Absent
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {Math.round(attendancePercentage)}%
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Rate
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing['2xl'],
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
    textAlign: 'center',
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.md,
  },
  chartContainer: {
    marginTop: spacing.md,
    height: 200,
  },
  leaveItem: {
    marginBottom: spacing.md,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  leaveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  leaveType: {
    ...getTypographyStyle('sm', 'medium'),
    flex: 1,
  },
  leaveValue: {
    ...getTypographyStyle('sm', 'bold'),
  },
  leaveBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  leaveBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  teamItem: {
    marginBottom: spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  teamLabel: {
    ...getTypographyStyle('sm', 'medium'),
    flex: 1,
  },
  teamValue: {
    ...getTypographyStyle('sm', 'bold'),
  },
  teamBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  teamBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: spacing.sm,
  },
  summaryValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: 4,
  },
  summaryLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
});
