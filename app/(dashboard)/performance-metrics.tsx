/**
 * Performance Metrics Dashboard
 * Comprehensive view of user performance across all dimensions
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { 
  AnimatedPressable, 
  GlassCard, 
  PerformanceChart, 
  GlassKPICard,
  Skeleton 
} from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useUserPerformance, useAttendancePercentage } from '@/hooks/useHRQueries';
import { useLeaderboard } from '@/hooks/useDashboardQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export default function PerformanceMetricsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch performance data
  const { data: performanceData, isLoading: performanceLoading, refetch: refetchPerformance } = useUserPerformance(user?.id!);
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendancePercentage();
  const { data: leaderboardData = [] } = useLeaderboard(5);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refetchPerformance();
    setIsRefreshing(false);
  }, [refetchPerformance]);

  // Mock performance history data (replace with real API)
  const getPerformanceHistory = () => {
    const ranges: Record<TimeRange, { label: string; data: { label: string; value: number }[] }> = {
      week: {
        label: 'Last 7 Days',
        data: [
          { label: 'Mon', value: 85 },
          { label: 'Tue', value: 88 },
          { label: 'Wed', value: 82 },
          { label: 'Thu', value: 90 },
          { label: 'Fri', value: 87 },
          { label: 'Sat', value: 85 },
          { label: 'Sun', value: 92 },
        ],
      },
      month: {
        label: 'Last 30 Days',
        data: [
          { label: 'Week 1', value: 78 },
          { label: 'Week 2', value: 82 },
          { label: 'Week 3', value: 85 },
          { label: 'Week 4', value: 88 },
        ],
      },
      quarter: {
        label: 'Last 3 Months',
        data: [
          { label: 'Oct', value: 75 },
          { label: 'Nov', value: 82 },
          { label: 'Dec', value: 88 },
        ],
      },
      year: {
        label: 'Last 12 Months',
        data: [
          { label: 'Jan', value: 70 },
          { label: 'Feb', value: 73 },
          { label: 'Mar', value: 75 },
          { label: 'Apr', value: 78 },
          { label: 'May', value: 80 },
          { label: 'Jun', value: 82 },
          { label: 'Jul', value: 84 },
          { label: 'Aug', value: 85 },
          { label: 'Sep', value: 86 },
          { label: 'Oct', value: 87 },
          { label: 'Nov', value: 88 },
          { label: 'Dec', value: 90 },
        ],
      },
    };
    return ranges[timeRange];
  };

  const performanceHistory = getPerformanceHistory();
  
  // Calculate metrics
  const productivityScore = performanceData?.productivity_score || 
    leaderboardData.find((l: any) => l.id === user?.id)?.score || 85;
  const attendanceScore = attendanceData?.percentage || 95;
  const projectsCompleted = performanceData?.projects_completed || 8;
  const tasksCompleted = performanceData?.tasks_completed || 34;
  const avgRating = performanceData?.average_rating || 4.6;

  const isLoading = performanceLoading || attendanceLoading;

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
              📊 Performance Metrics
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Track your progress and achievements
            </Text>
          </View>
        </View>

        {/* Time Range Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRangeContainer}
        >
          {[
            { value: 'week', label: 'Week', icon: 'calendar' },
            { value: 'month', label: 'Month', icon: 'calendar-outline' },
            { value: 'quarter', label: 'Quarter', icon: 'calendar-sharp' },
            { value: 'year', label: 'Year', icon: 'calendar-number' },
          ].map((range) => (
            <AnimatedPressable
              key={range.value}
              onPress={() => setTimeRange(range.value as TimeRange)}
              style={[
                styles.timeRangeTab,
                {
                  backgroundColor: timeRange === range.value ? theme.primary : 'transparent',
                  borderColor: timeRange === range.value ? theme.primary : theme.border,
                },
              ]}
              hapticType="light"
            >
              <Ionicons 
                name={range.icon as any} 
                size={16} 
                color={timeRange === range.value ? '#FFFFFF' : theme.textSecondary} 
              />
              <Text
                style={[
                  styles.timeRangeText,
                  { color: timeRange === range.value ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {range.label}
              </Text>
            </AnimatedPressable>
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
        {/* Overall Score Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard variant="gradient" gradientColors={[theme.primary, theme.primary]} intensity="medium" style={{ marginBottom: spacing.lg }}>
            <View style={styles.overallScoreCard}>
              <Text style={[styles.overallLabel, { color: '#FFFFFF' }]}>Overall Performance</Text>
              <Text style={[styles.overallScore, { color: '#FFFFFF' }]}>
                {productivityScore}
              </Text>
              <View style={styles.overallTrend}>
                <Ionicons name="trending-up" size={20} color="#FFFFFF" />
                <Text style={[styles.overallTrendText, { color: '#FFFFFF' }]}>
                  +12% from last period
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ flex: 1 }}>
            <GlassKPICard
              title="Attendance"
              value={`${attendanceScore}%`}
              icon="calendar-check"
              color="#10B981"
              trend={{ value: 2, direction: 'up' as const }}
              loading={isLoading}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ flex: 1 }}>
            <GlassKPICard
              title="Projects"
              value={projectsCompleted}
              icon="briefcase"
              color="#6366F1"
              trend={{ value: 3, direction: 'up' as const }}
              loading={isLoading}
            />
          </Animated.View>
        </View>

        <View style={styles.metricsGrid}>
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ flex: 1 }}>
            <GlassKPICard
              title="Tasks Done"
              value={tasksCompleted}
              icon="checkmark-circle"
              color="#8B5CF6"
              trend={{ value: 8, direction: 'up' as const }}
              loading={isLoading}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ flex: 1 }}>
            <GlassKPICard
              title="Avg Rating"
              value={avgRating.toFixed(1)}
              icon="star"
              color="#F59E0B"
              trend={{ value: 0.3, direction: 'up' as const }}
              loading={isLoading}
            />
          </Animated.View>
        </View>

        {/* Performance Trend Chart */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ marginBottom: spacing.lg }}>
          <PerformanceChart
            title="Performance Trend"
            subtitle={performanceHistory.label}
            data={performanceHistory.data}
            color={theme.primary}
          />
        </Animated.View>

        {/* Performance Breakdown */}
        <Animated.View entering={FadeInUp.delay(450).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Performance Breakdown
          </Text>
        </Animated.View>

        {/* Categories */}
        {[
          { 
            title: 'Code Quality', 
            score: 92, 
            color: '#10B981', 
            icon: 'code-slash',
            description: 'Clean, maintainable code with best practices'
          },
          { 
            title: 'Collaboration', 
            score: 88, 
            color: '#6366F1', 
            icon: 'people',
            description: 'Teamwork and communication effectiveness'
          },
          { 
            title: 'Problem Solving', 
            score: 85, 
            color: '#8B5CF6', 
            icon: 'bulb',
            description: 'Creative solutions and critical thinking'
          },
          { 
            title: 'Time Management', 
            score: 90, 
            color: '#F59E0B', 
            icon: 'time',
            description: 'Meeting deadlines and efficient workflow'
          },
          { 
            title: 'Innovation', 
            score: 87, 
            color: '#EC4899', 
            icon: 'rocket',
            description: 'New ideas and process improvements'
          },
        ].map((category, index) => (
          <Animated.View 
            key={category.title}
            entering={FadeInUp.delay(500 + index * 50).duration(400)}
          >
            <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.md }}>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>
                    {category.title}
                  </Text>
                  <Text style={[styles.categoryDescription, { color: theme.textSecondary }]}>
                    {category.description}
                  </Text>
                </View>
                <View style={styles.categoryScore}>
                  <Text style={[styles.scoreValue, { color: category.color }]}>
                    {category.score}
                  </Text>
                  <View style={[styles.scoreBar, { backgroundColor: theme.border }]}>
                    <View 
                      style={[
                        styles.scoreBarFill, 
                        { width: `${category.score}%`, backgroundColor: category.color }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}

        {/* Achievements Section */}
        <Animated.View entering={FadeInUp.delay(800).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Achievements
          </Text>
        </Animated.View>

        {[
          { 
            title: 'Fast Learner', 
            description: 'Completed 5 training modules in a week',
            icon: 'school',
            color: '#10B981',
            date: '2 days ago'
          },
          { 
            title: 'Team Player', 
            description: 'Helped 3 colleagues solve critical issues',
            icon: 'people-circle',
            color: '#6366F1',
            date: '5 days ago'
          },
          { 
            title: 'Bug Hunter', 
            description: 'Found and fixed 10 critical bugs',
            icon: 'bug',
            color: '#EF4444',
            date: '1 week ago'
          },
        ].map((achievement, index) => (
          <Animated.View 
            key={achievement.title}
            entering={FadeInUp.delay(850 + index * 50).duration(400)}
          >
            <GlassCard variant="default" intensity="light" style={{ marginBottom: spacing.md }}>
              <View style={styles.achievementItem}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '15' }]}>
                  <Ionicons name={achievement.icon as any} size={28} color={achievement.color} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: theme.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                    {achievement.description}
                  </Text>
                  <Text style={[styles.achievementDate, { color: theme.textSecondary }]}>
                    {achievement.date}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
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
  timeRangeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  timeRangeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  timeRangeText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  scrollContent: {
    padding: spacing.lg,
  },
  overallScoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  overallLabel: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  overallScore: {
    ...getTypographyStyle('4xl', 'bold'),
    marginBottom: spacing.xs,
  },
  overallTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallTrendText: {
    ...getTypographyStyle('sm', 'medium'),
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: 2,
  },
  categoryDescription: {
    ...getTypographyStyle('xs', 'regular'),
    lineHeight: 16,
  },
  categoryScore: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  scoreValue: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: 4,
  },
  scoreBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...getTypographyStyle('base', 'bold'),
    marginBottom: 4,
  },
  achievementDescription: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: 4,
    lineHeight: 18,
  },
  achievementDate: {
    ...getTypographyStyle('xs', 'regular'),
  },
});
