/**
 * Project Analytics Screen
 * Detailed project performance and insights
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
import { useActiveProjectsCount } from '@/hooks/useDashboardQueries';
import { useUserProjects } from '@/hooks/useHRQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  completionRate: number;
  avgProjectDuration: number;
  tasksCompleted: number;
  tasksInProgress: number;
  taskCompletionRate: number;
}

export default function ProjectAnalyticsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch project data
  const { data: userProjects = [], isLoading, refetch } = useUserProjects(user?.id!);
  const { data: activeCount, refetch: refetchActive } = useActiveProjectsCount();

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchActive()]);
    setIsRefreshing(false);
  }, [refetch, refetchActive]);

  // Calculate metrics
  const metrics: ProjectMetrics = {
    totalProjects: userProjects.length,
    activeProjects: activeCount || 0,
    completedProjects: userProjects.filter(p => p.status === 'completed').length,
    completionRate: userProjects.length > 0
      ? Math.round((userProjects.filter(p => p.status === 'completed').length / userProjects.length) * 100)
      : 0,
    avgProjectDuration: 45, // Mock data
    tasksCompleted: 34,
    tasksInProgress: 12,
    taskCompletionRate: 74,
  };

  // Project status distribution
  const statusDistribution = [
    { status: 'Active', count: metrics.activeProjects, color: '#3B82F6' },
    { status: 'Completed', count: metrics.completedProjects, color: '#10B981' },
    { status: 'On Hold', count: 1, color: '#F59E0B' },
  ];

  // Project timeline data
  const timelineData = [
    { month: 'Jan', completed: 2, active: 3 },
    { month: 'Feb', completed: 3, active: 4 },
    { month: 'Mar', completed: 4, active: 5 },
    { month: 'Apr', completed: 3, active: 4 },
    { month: 'May', completed: 5, active: 6 },
    { month: 'Jun', completed: 4, active: 5 },
  ];

  // Task completion trend
  const taskTrendData = [
    { label: 'Mon', value: 5 },
    { label: 'Tue', value: 8 },
    { label: 'Wed', value: 6 },
    { label: 'Thu', value: 9 },
    { label: 'Fri', value: 7 },
    { label: 'Sat', value: 4 },
    { label: 'Sun', value: 6 },
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
        colors={[moduleColors.projects.main + '30', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AnimatedPressable onPress={() => router.back()} hapticType="light">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Project Analytics
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Comprehensive project insights
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
            <Ionicons name="briefcase" size={32} color={moduleColors.projects.main} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {metrics.totalProjects}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Projects
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {metrics.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Completion Rate
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="time" size={32} color="#F59E0B" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {metrics.avgProjectDuration}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Avg Days
            </Text>
          </GlassCard>

          <GlassCard variant="default" intensity="light" style={styles.statCard}>
            <Ionicons name="checkmark-done" size={32} color="#8B5CF6" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {metrics.tasksCompleted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Tasks Done
            </Text>
          </GlassCard>
        </View>

        {/* Project Status Distribution */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Project Status Distribution
          </Text>
          <View style={styles.distributionContainer}>
            {statusDistribution.map((item, index) => (
              <Animated.View
                key={item.status}
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={styles.distributionItem}
              >
                <View style={styles.distributionHeader}>
                  <View style={[styles.distributionDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.distributionLabel, { color: theme.text }]}>
                    {item.status}
                  </Text>
                  <Text style={[styles.distributionValue, { color: theme.text }]}>
                    {item.count}
                  </Text>
                </View>
                <View style={[styles.distributionBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      {
                        width: `${(item.count / metrics.totalProjects) * 100}%`,
                        backgroundColor: item.color
                      }
                    ]}
                  />
                </View>
              </Animated.View>
            ))}
          </View>
        </GlassCard>

        {/* Task Completion Trend */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Task Completion Trend
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Last 7 days
          </Text>
          <View style={styles.chartContainer}>
            <PerformanceChart
              data={taskTrendData}
              color={moduleColors.projects.main}
              title=""
            />
          </View>
        </GlassCard>

        {/* Top Projects */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Projects
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            Your active projects
          </Text>

          {userProjects.slice(0, 5).map((project, index) => (
            <Animated.View
              key={project.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={[
                styles.projectItem,
                { borderBottomColor: theme.border }
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.projectName, { color: theme.text }]}>
                  {project.name}
                </Text>
                <Text style={[styles.projectDescription, { color: theme.textSecondary }]}>
                  {project.description || 'No description'}
                </Text>
                <View style={styles.projectMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: moduleColors.projects.light }]}>
                    <Text style={[styles.statusText, { color: moduleColors.projects.main }]}>
                      {project.status || 'Active'}
                    </Text>
                  </View>
                  <Text style={[styles.projectDate, { color: theme.textSecondary }]}>
                    Started: {new Date(project.start_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </GlassCard>

        {/* Task Statistics */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Task Statistics
          </Text>
          <View style={styles.taskStatsContainer}>
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: '#10B981' }]}>
                {metrics.tasksCompleted}
              </Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={[styles.taskStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: '#3B82F6' }]}>
                {metrics.tasksInProgress}
              </Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>
                In Progress
              </Text>
            </View>
            <View style={[styles.taskStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: theme.primary }]}>
                {metrics.taskCompletionRate}%
              </Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>
                Success Rate
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
  distributionContainer: {
    marginTop: spacing.md,
  },
  distributionItem: {
    marginBottom: spacing.md,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  distributionLabel: {
    ...getTypographyStyle('sm', 'medium'),
    flex: 1,
  },
  distributionValue: {
    ...getTypographyStyle('sm', 'bold'),
  },
  distributionBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartContainer: {
    marginTop: spacing.md,
    height: 200,
  },
  projectItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  projectName: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: 4,
  },
  projectDescription: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.xs,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...getTypographyStyle('xs', 'semibold'),
    textTransform: 'capitalize',
  },
  projectDate: {
    ...getTypographyStyle('xs', 'regular'),
  },
  taskStatsContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  taskStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  taskStatDivider: {
    width: 1,
    marginHorizontal: spacing.sm,
  },
  taskStatValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: 4,
  },
  taskStatLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
});
