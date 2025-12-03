/**
 * Analytics & Reporting Hub
 * Comprehensive analytics dashboard with module-specific insights
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
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AnimatedPressable, GlassCard, Button, PerformanceChart } from '@/components';
import { spacing, borderRadius, moduleColors } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { 
  useLeaderboard, 
  useActiveProjectsCount,
} from '@/hooks/useDashboardQueries';
import { 
  useAttendancePercentage,
  useUserProjects,
} from '@/hooks/useHRQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface AnalyticsModule {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
  metrics: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  }[];
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch analytics data
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendancePercentage();
  const { data: projectsCount, refetch: refetchProjects } = useActiveProjectsCount();
  const { data: leaderboardData = [], refetch: refetchLeaderboard } = useLeaderboard(10);
  const { data: userProjects = [], refetch: refetchUserProjects } = useUserProjects(user?.id!);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchAttendance(),
      refetchProjects(),
      refetchLeaderboard(),
      refetchUserProjects(),
    ]);
    setIsRefreshing(false);
  }, [refetchAttendance, refetchProjects, refetchLeaderboard, refetchUserProjects]);

  // Calculate metrics
  const attendancePercentage = attendanceData?.percentage || 0;
  const totalProjects = userProjects.length;
  const activeProjects = projectsCount || 0;
  const completedProjects = totalProjects - activeProjects;
  const myRank = leaderboardData.findIndex(l => l.id === user?.id) + 1;
  const myScore = leaderboardData.find(l => l.id === user?.id)?.score || 0;

  const dateRanges = [
    { value: 'week', label: 'Week', icon: 'calendar-outline' },
    { value: 'month', label: 'Month', icon: 'calendar' },
    { value: 'quarter', label: 'Quarter', icon: 'calendar-number' },
    { value: 'year', label: 'Year', icon: 'calendar-sharp' },
  ];

  const analyticsModules: AnalyticsModule[] = [
    {
      id: 'hr',
      title: 'HR Analytics',
      icon: 'people',
      color: moduleColors.hr.main,
      bgColor: moduleColors.hr.light,
      route: '/(dashboard)/analytics-hr',
      metrics: [
        { label: 'Attendance', value: `${Math.round(attendancePercentage)}%`, trend: 'up' },
        { label: 'Leave Balance', value: '12 days', trend: 'neutral' },
        { label: 'Team Size', value: '8', trend: 'up' },
      ],
    },
    {
      id: 'projects',
      title: 'Project Analytics',
      icon: 'briefcase',
      color: moduleColors.projects.main,
      bgColor: moduleColors.projects.light,
      route: '/(dashboard)/analytics-projects',
      metrics: [
        { label: 'Active', value: activeProjects.toString(), trend: 'up' },
        { label: 'Completed', value: completedProjects.toString(), trend: 'up' },
        { label: 'Tasks Done', value: '34', trend: 'up' },
      ],
    },
    {
      id: 'performance',
      title: 'Performance Analytics',
      icon: 'stats-chart',
      color: '#10B981',
      bgColor: '#10B98115',
      route: '/(dashboard)/performance-metrics',
      metrics: [
        { label: 'Score', value: myScore.toString(), trend: 'up' },
        { label: 'Rank', value: myRank > 0 ? `#${myRank}` : '--', trend: 'up' },
        { label: 'Rating', value: '4.6', trend: 'up' },
      ],
    },
    {
      id: 'events',
      title: 'Events Analytics',
      icon: 'calendar',
      color: moduleColors.events.main,
      bgColor: moduleColors.events.light,
      route: '/(dashboard)/analytics-events',
      metrics: [
        { label: 'Attended', value: '12', trend: 'up' },
        { label: 'Upcoming', value: '3', trend: 'neutral' },
        { label: 'Organized', value: '2', trend: 'up' },
      ],
    },
    {
      id: 'finance',
      title: 'Finance Analytics',
      icon: 'cash',
      color: moduleColors.finance.main,
      bgColor: moduleColors.finance.light,
      route: '/(dashboard)/analytics-finance',
      metrics: [
        { label: 'Reimbursements', value: '5', trend: 'neutral' },
        { label: 'Pending', value: '2', trend: 'down' },
        { label: 'Approved', value: '₹8.5K', trend: 'up' },
      ],
    },
  ];

  // Mock data for overview charts
  const overviewData = [
    { date: 'Mon', value: 85 },
    { date: 'Tue', value: 92 },
    { date: 'Wed', value: 78 },
    { date: 'Thu', value: 88 },
    { date: 'Fri', value: 95 },
    { date: 'Sat', value: 82 },
    { date: 'Sun', value: 90 },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return '#10B981';
    if (trend === 'down') return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [theme.primary + '15', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AnimatedPressable onPress={() => router.back()} hapticType="light">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              📊 Analytics & Reports
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Comprehensive insights and data visualization
            </Text>
          </View>
          <AnimatedPressable
            onPress={() => {
              // Export all data
              console.log('Export analytics data');
            }}
            style={[styles.exportButton, { backgroundColor: theme.primary + '15' }]}
            hapticType="medium"
          >
            <Ionicons name="download-outline" size={20} color={theme.primary} />
          </AnimatedPressable>
        </View>

        {/* Date Range Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRangeContainer}
        >
          {dateRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => setDateRange(range.value as DateRange)}
              style={[
                styles.dateRangeTab,
                {
                  backgroundColor: dateRange === range.value ? theme.primary : 'transparent',
                  borderColor: dateRange === range.value ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons 
                name={range.icon as any} 
                size={16} 
                color={dateRange === range.value ? '#FFFFFF' : theme.textSecondary} 
              />
              <Text
                style={[
                  styles.dateRangeText,
                  { color: dateRange === range.value ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Overview Chart */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Overall Performance Trend
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Last 7 days activity
            </Text>
            <View style={styles.chartContainer}>
              <PerformanceChart
                data={overviewData}
                color={theme.primary}
                title=""
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.metricCard}>
            <GlassCard variant="default" intensity="light" style={styles.metricCardContent}>
              <View style={[styles.metricIcon, { backgroundColor: '#3B82F620' }]}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {Math.round(attendancePercentage)}%
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Attendance
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.metricCard}>
            <GlassCard variant="default" intensity="light" style={styles.metricCardContent}>
              <View style={[styles.metricIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="briefcase" size={24} color="#10B981" />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {activeProjects}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Active Projects
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.metricCard}>
            <GlassCard variant="default" intensity="light" style={styles.metricCardContent}>
              <View style={[styles.metricIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="trophy" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {myRank > 0 ? `#${myRank}` : '--'}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Leaderboard
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.metricCard}>
            <GlassCard variant="default" intensity="light" style={styles.metricCardContent}>
              <View style={[styles.metricIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="star" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>4.6</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Avg Rating
              </Text>
            </GlassCard>
          </Animated.View>
        </View>

        {/* Module-Specific Analytics */}
        <View style={styles.modulesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Module Analytics
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            Detailed insights by module
          </Text>

          {analyticsModules.map((module, index) => (
            <Animated.View
              key={module.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <AnimatedPressable
                onPress={() => router.push(module.route as any)}
                hapticType="light"
              >
                <GlassCard variant="default" intensity="medium" style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={[styles.moduleIconContainer, { backgroundColor: module.bgColor }]}>
                      <Ionicons name={module.icon} size={24} color={module.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moduleTitle, { color: theme.text }]}>
                        {module.title}
                      </Text>
                      <Text style={[styles.moduleSubtitle, { color: theme.textSecondary }]}>
                        {dateRange === 'week' ? 'This week' : dateRange === 'month' ? 'This month' : dateRange === 'quarter' ? 'This quarter' : 'This year'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>

                  <View style={styles.moduleMetrics}>
                    {module.metrics.map((metric, idx) => (
                      <View key={idx} style={styles.moduleMetricItem}>
                        <Text style={[styles.moduleMetricLabel, { color: theme.textSecondary }]}>
                          {metric.label}
                        </Text>
                        <View style={styles.moduleMetricValue}>
                          <Text style={[styles.moduleMetricValueText, { color: theme.text }]}>
                            {metric.value}
                          </Text>
                          <Ionicons 
                            name={getTrendIcon(metric.trend) as any} 
                            size={14} 
                            color={getTrendColor(metric.trend)} 
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </AnimatedPressable>
            </Animated.View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <Button
              title="Export CSV"
              onPress={() => console.log('Export CSV')}
              variant="outline"
              size="md"
              style={{ flex: 1, marginRight: spacing.xs }}
              leftIcon="document-text-outline"
            />
            <Button
              title="Export PDF"
              onPress={() => console.log('Export PDF')}
              variant="outline"
              size="md"
              style={{ flex: 1, marginLeft: spacing.xs }}
              leftIcon="document-attach-outline"
            />
          </View>
          <Button
            title="Custom Report Builder"
            onPress={() => router.push('/(dashboard)/report-builder' as any)}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.sm }}
            leftIcon="construct-outline"
          />
        </View>
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
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  dateRangeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  dateRangeText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  scrollContent: {
    padding: spacing.lg,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
  },
  metricCardContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  metricValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: 2,
  },
  metricLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  modulesSection: {
    marginBottom: spacing.lg,
  },
  moduleCard: {
    marginBottom: spacing.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    ...getTypographyStyle('base', 'semibold'),
  },
  moduleSubtitle: {
    ...getTypographyStyle('xs', 'regular'),
  },
  moduleMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moduleMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  moduleMetricLabel: {
    ...getTypographyStyle('xs', 'regular'),
    marginBottom: 4,
  },
  moduleMetricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleMetricValueText: {
    ...getTypographyStyle('base', 'bold'),
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});
