import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, StyleSheet, Image, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Skeleton, SkeletonText, AnimatedPressable, GlassKPICard, QuickActionButton, MiniChart, GlassCard } from '@/components';
import NotificationBell from '@/components/layout/NotificationBell';
import { BlurView } from 'expo-blur';
import { spacing, borderRadius, iconSizes, typography, moduleColors, baseColors } from '@/constants/designSystem';
import { getShadowStyle, getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { useCurrentUser, useLeaveBalance, useRecentActivities, useRefreshDashboard, useActiveProjectsCount, useLeaderboard } from '@/hooks/useDashboardQueries';
import { formatDistanceToNow } from 'date-fns';
import { activityStorage, LocalActivity } from '@/services/activityStorage.service';

// Medal colors for leaderboard
const MEDAL_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
} as const;

interface Module {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  bgColor: string;
}

const MODULES: Module[] = [
  {
    id: 'hr',
    title: 'HR',
    icon: 'people',
    route: '/(modules)/hr',
    color: moduleColors.hr.main,
    bgColor: moduleColors.hr.light,
  },
  {
    id: 'events',
    title: 'Events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: moduleColors.events.main,
    bgColor: moduleColors.events.light,
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'cash',
    route: '/(modules)/finance',
    color: moduleColors.finance.main,
    bgColor: moduleColors.finance.light,
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: moduleColors.projects.main,
    bgColor: moduleColors.projects.light,
  },
  {
    id: 'leave',
    title: 'Leave',
    icon: 'time',
    route: '/(modules)/leave',
    color: moduleColors.leave.main,
    bgColor: moduleColors.leave.light,
  },
];



const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  // Dashboard data fetching
  
  // Fetch real data from backend with real-time updates
  const user = useAuthStore((state) => state.user);
  const { data: leaveBalance, isLoading: leaveLoading, refetch: refetchLeave } = useLeaveBalance();
  const [localActivities, setLocalActivities] = useState<LocalActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const { data: activeProjectsCount, refetch: refetchProjects } = useActiveProjectsCount();
  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useLeaderboard(5);
  const { mutate: refreshDashboard, isPending: isRefreshing } = useRefreshDashboard();

  const [notificationCount] = useState(0);
  
  // Load activities from local storage
  useEffect(() => {
    loadLocalActivities();
  }, []);
  
  const loadLocalActivities = async () => {
    setActivitiesLoading(true);
    try {
      const activities = await activityStorage.getRecentActivities(5);
      setLocalActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };
  
  // Use auth store user as fallback
  const currentUser = user;
  const userLoading = false;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const onRefresh = React.useCallback(() => {
    refreshDashboard();
    // refetchUser();
    refetchLeave();
    refetchProjects();
    loadLocalActivities();
  }, [refreshDashboard, refetchLeave, refetchProjects]);

  // Loading state
  const isLoading = userLoading;

  // Get REAL user data - priority: API response > Auth store
  const displayUser = currentUser || authUser;
  
  // Helper to capitalize first letter of each word
  const capitalizeName = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const rawName = displayUser?.full_name || 
                  (displayUser?.first_name && displayUser?.last_name 
                    ? `${displayUser.first_name} ${displayUser.last_name}` 
                    : (displayUser as any)?.username || 'User');
  const fullName = capitalizeName(rawName);
  
  // Real leave balance calculation - handle different response types
  const totalLeaves = (leaveBalance as any)?.annual_leave_available || 
                     (leaveBalance as any)?.total || 
                     0;
  const leaveDays = totalLeaves;
  
  // Active projects from backend
  const activeProjects = activeProjectsCount ?? 0;
  
  // Calculate real productivity score from leaderboard data
  const myProductivityScore = React.useMemo(() => {
    if (leaderboardData.length > 0 && displayUser) {
      const myData = leaderboardData.find(l => l.id === displayUser.id);
      return myData?.score || 0;
    }
    return 0;
  }, [leaderboardData, displayUser]);
  
  // Calculate real attendance percentage - would come from backend eventually
  const attendancePercentage = 95; // TODO: Replace with real attendance API when available

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Glass Morphism Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).springify()}
        style={styles.header}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.headerBlur}
        >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={[styles.appTitle, { color: theme.text }]}>Sarvagun</Text>
            </View>
            <View style={styles.headerActions}>
              <AnimatedPressable
                onPress={() => router.push('/(dashboard)/search' as any)}
                style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                hapticType="light"
              >
                <Ionicons name="search-outline" size={20} color={theme.text} />
              </AnimatedPressable>
              <View style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                <NotificationBell size={20} color={theme.text} />
              </View>
            </View>
          </View>
        </View>
        </BlurView>
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Welcome Header - Clean & Simple */}
        <Animated.View 
          entering={FadeInUp.delay(100).duration(600).springify()}
          style={styles.section}
        >
          <AnimatedPressable
            onPress={() => router.push('/(dashboard)/my-profile')}
            hapticType="light"
            springConfig="gentle"
          >
            <View style={styles.welcomeHeader}>
              <Avatar
                size={52}
                source={displayUser?.photo ? { uri: displayUser.photo } : undefined}
                name={fullName}
                onlineStatus={true}
              />
              <View style={styles.welcomeText}>
                <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                  {getGreeting()}
                </Text>
                <Text style={[styles.userName, { color: theme.text }]}>
                  {fullName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Your Stats Title */}
        <Animated.View 
          entering={FadeInUp.delay(150).duration(600).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Stats</Text>
        </Animated.View>

        {/* KPI Cards - Horizontal Scroll */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600).springify()}
          style={styles.sectionNoPadding}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiScrollContainer}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH * 0.70 + spacing.md}
            snapToAlignment="start"
          >
            <GlassKPICard
              title="Attendance"
              value={`${attendancePercentage}%`}
              icon="calendar-outline"
              gradientColors={['#3B82F6', '#1D4ED8']}
              trend="up"
              trendValue="+2%"
              subtitle="Last 7 days"
              onPress={() => router.push('/(modules)/hr' as any)}
              style={styles.kpiCardHorizontal}
            />
            
            <GlassKPICard
              title="Productivity Score"
              value={myProductivityScore > 0 ? myProductivityScore.toString() : '0'}
              icon="trending-up-outline"
              gradientColors={['#10B981', '#059669']}
              trend={myProductivityScore > 0 ? "up" : "neutral"}
              trendValue={myProductivityScore > 0 ? `${Math.floor(myProductivityScore / 10)} pts` : undefined}
              subtitle="Project score"
              onPress={() => router.push('/(dashboard)/leaderboard' as any)}
              style={styles.kpiCardHorizontal}
            />

            <GlassKPICard
              title="Leave Balance"
              value={leaveDays}
              icon="time-outline"
              gradientColors={['#F59E0B', '#D97706']}
              trend="neutral"
              subtitle="Days remaining"
              onPress={() => router.push('/(modules)/leave' as any)}
              style={styles.kpiCardHorizontal}
            />
            
            <GlassKPICard
              title="Active Projects"
              value={activeProjects}
              icon="briefcase-outline"
              gradientColors={['#8B5CF6', '#7C3AED']}
              trend="up"
              trendValue="+1"
              subtitle="In progress"
              onPress={() => router.push('/(modules)/projects' as any)}
              style={styles.kpiCardHorizontal}
            />
          </ScrollView>
        </Animated.View>

        {/* Modules Section - Single Row Horizontal Scroll */}
        <Animated.View 
          entering={FadeInUp.delay(300).duration(600).springify()}
          style={styles.sectionNoPadding}
        >
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Modules</Text>
            <AnimatedPressable onPress={() => router.push('/(dashboard)/modules')} hapticType="selection">
              <Text style={[styles.seeAllText, { color: theme.primary }]}>View All</Text>
            </AnimatedPressable>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesHorizontalContainer}
          >
            {MODULES.slice(0, 4).map((module, index) => (
              <Animated.View
                key={module.id}
                entering={FadeIn.delay(400 + index * 50).duration(600).springify()}
              >
                <AnimatedPressable
                  onPress={() => router.push(module.route as any)}
                  hapticType="light"
                  springConfig="snappy"
                >
                  <GlassCard
                    variant="default"
                    intensity="light"
                    pressable={false}
                    style={styles.moduleCardHorizontal}
                  >
                    <View style={styles.modernModuleContent}>
                      <View style={[styles.modernModuleIcon, { backgroundColor: `${module.color}15`, borderWidth: 1.5, borderColor: `${module.color}40` }]}>
                        <Ionicons name={module.icon} size={28} color={module.color} />
                      </View>
                      <Text style={[styles.modernModuleTitle, { color: theme.text }]} numberOfLines={1}>
                        {module.title}
                      </Text>
                    </View>
                  </GlassCard>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Activity Section - Glass Effect - Hide if no activities */}
        {(!activitiesLoading && localActivities.length > 0) && (
        <Animated.View 
          entering={FadeInUp.delay(500).duration(600).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          </View>

          <GlassCard variant="default" intensity="medium">
            <View style={styles.activityContainer}>
              {activitiesLoading ? (
              <>
                {[1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.activityItem,
                      {
                        borderBottomWidth: index < 3 ? 1 : 0,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Skeleton width={48} height={48} borderRadius={24} />
                    <View style={styles.activityContent}>
                      <Skeleton width={180} height={16} style={{ marginBottom: spacing.xs }} />
                      <Skeleton width={240} height={14} style={{ marginBottom: spacing.xs }} />
                      <Skeleton width={80} height={12} />
                    </View>
                  </View>
                ))}
              </>
            ) : localActivities.length > 0 ? (
              localActivities.slice(0, 5).map((activity, index, arr) => {
                const activityIcon = getActivityIcon(activity.type);
                const activityColor = getActivityColor(activity.type);
                
                // Safe date parsing with fallback
                let timeAgo = 'Recently';
                try {
                  const date = new Date(activity.timestamp);
                  if (!isNaN(date.getTime())) {
                    timeAgo = formatDistanceToNow(date, { addSuffix: true });
                  }
                } catch (e) {
                  console.log('Invalid date for activity:', activity.timestamp);
                }

                return (
                  <AnimatedPressable
                    key={activity.id}
                    onPress={() => handleActivityPress(activity)}
                    hapticType="light"
                    springConfig="gentle"
                  >
                    <View style={[
                      styles.activityItemCard,
                      { 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        marginBottom: index < arr.length - 1 ? spacing.sm : 0,
                      }
                    ]}>
                      <View style={[styles.activityIcon, { backgroundColor: activityColor + '20' }]}>
                        <Ionicons name={activityIcon} size={22} color={activityColor} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityTitle, { color: theme.text }]}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                          {activity.description}
                        </Text>
                        <View style={styles.activityMeta}>
                          <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                          <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                            {timeAgo}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </View>
                  </AnimatedPressable>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="flash-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No recent activities
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                  Your activities will appear here
                </Text>
              </View>
            )}
            </View>
          </GlassCard>
        </Animated.View>
        )}

        {/* Leadership Board Preview - Glass Effect */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Leadership Board</Text>
            <AnimatedPressable 
              onPress={() => router.push('/(dashboard)/leaderboard')} 
              hapticType="selection"
            >
              <Text style={[styles.seeAllText, { color: theme.primary }]}>View All</Text>
            </AnimatedPressable>
          </View>

          <GlassCard variant="default" intensity="medium">
            <View style={styles.leaderboardContainer}>
              {leaderboardLoading ? (
              <>
                {[1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.leaderboardItem,
                      {
                        borderBottomWidth: index < 3 ? 1 : 0,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: spacing.sm }} />
                    <Skeleton width={48} height={48} borderRadius={24} />
                    <View style={styles.leaderInfo}>
                      <Skeleton width={150} height={16} style={{ marginBottom: spacing.xs }} />
                      <Skeleton width={200} height={14} />
                    </View>
                  </View>
                ))}
              </>
            ) : leaderboardData && leaderboardData.length > 0 ? (
              leaderboardData.map((leader, index) => {
              const getRankColor = (rank: number) => {
                if (rank === 1) return MEDAL_COLORS.gold;
                if (rank === 2) return MEDAL_COLORS.silver;
                if (rank === 3) return MEDAL_COLORS.bronze;
                return theme.primary;
              };

              const getRankIcon = (rank: number): keyof typeof Ionicons.glyphMap => {
                if (rank === 1) return 'trophy';
                if (rank === 2) return 'medal';
                if (rank === 3) return 'ribbon';
                return 'star';
              };

              const rankColor = getRankColor(leader.rank);
              const isTopThree = leader.rank <= 3;

              return (
                <AnimatedPressable
                  key={leader.id}
                  onPress={() => router.push('/(dashboard)/leaderboard')}
                  hapticType="light"
                  springConfig="gentle"
                  animateOnMount={true}
                >
                  <View style={[
                    styles.leaderboardItemCard,
                    {
                      backgroundColor: isTopThree 
                        ? (isDark ? 'rgba(255,215,0,0.08)' : 'rgba(255,215,0,0.05)')
                        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                      marginBottom: index < leaderboardData.length - 1 ? spacing.sm : 0,
                    }
                  ]}>
                  
                  <View style={styles.leaderRankContainer}>
                    <View style={[
                      styles.leaderRankBadge,
                      { backgroundColor: rankColor + (isTopThree ? '20' : '10') }
                    ]}>
                      {isTopThree ? (
                        <Ionicons name={getRankIcon(leader.rank)} size={iconSizes.md} color={rankColor} />
                      ) : (
                        <Text style={[styles.leaderRankText, { color: rankColor }]}>
                          {leader.rank}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Avatar
                    size={48}
                    source={leader.photo ? { uri: leader.photo } : undefined}
                    name={leader.name}
                    onlineStatus={leader.isOnline}
                  />

                  <View style={styles.leaderInfo}>
                    <Text style={[styles.leaderName, { color: theme.text }]} numberOfLines={1}>
                      {leader.name}
                    </Text>
                    <View style={styles.leaderStats}>
                      <View style={styles.leaderStatItem}>
                        <Ionicons name="briefcase-outline" size={iconSizes.xs} color={theme.textSecondary} />
                        <Text style={[styles.leaderStatText, { color: theme.textSecondary }]}>
                          {leader.projectsCompleted} projects
                        </Text>
                      </View>
                      <View style={styles.leaderStatDot} />
                      <View style={styles.leaderStatItem}>
                        <Ionicons name="checkmark-circle-outline" size={iconSizes.xs} color={theme.success} />
                        <Text style={[styles.leaderStatText, { color: theme.textSecondary }]}>
                          {leader.tasksCompleted} tasks
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.leaderScore}>
                    <Text style={[styles.leaderScoreValue, { color: theme.primary }]}>
                      {leader.score}
                    </Text>
                    <Text style={[styles.leaderScoreLabel, { color: theme.textSecondary }]}>
                      pts
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={iconSizes.sm} color={theme.textSecondary} />
                  </View>
                </AnimatedPressable>
              );
            })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No leaderboard data yet
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                  Complete projects to appear on the leaderboard
                </Text>
              </View>
            )}
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );

  function getActivityIcon(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
      case 'leave':
        return 'time-outline';
      case 'task':
        return 'briefcase-outline';
      case 'attendance':
        return 'finger-print-outline';
      case 'event':
        return 'calendar-outline';
      case 'project':
        return 'folder-outline';
      case 'hr':
        return 'people-outline';
      case 'finance':
        return 'cash-outline';
      default:
        return 'notifications-outline';
    }
  }

  function getActivityColor(type: string): string {
    switch (type) {
      case 'leave':
        return moduleColors.leave.main;
      case 'task':
        return moduleColors.tasks?.main || moduleColors.projects.main;
      case 'attendance':
        return moduleColors.attendance?.main || moduleColors.hr.main;
      case 'event':
        return moduleColors.events.main;
      case 'project':
        return moduleColors.projects.main;
      case 'hr':
        return moduleColors.hr.main;
      case 'finance':
        return moduleColors.finance.main;
      default:
        return theme.primary;
    }
  }

  function handleActivityPress(activity: LocalActivity) {
    // Navigate to appropriate screen based on activity type
    switch (activity.type) {
      case 'leave':
      case 'hr':
        router.push('/(modules)/hr');
        break;
      case 'task':
      case 'project':
        router.push('/(modules)/projects');
        break;
      case 'event':
        router.push('/(modules)/events');
        break;
      case 'finance':
        router.push('/(modules)/finance');
        break;
      default:
        console.log('Activity:', activity);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerContent: {
    paddingVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    ...getTypographyStyle('xl', 'bold'),
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: baseColors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    ...getTypographyStyle("xs", 'bold'),
    color: '#FFFFFF',
    fontSize: 10,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 110 : 130,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  sectionNoPadding: {
    marginBottom: spacing['2xl'],
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: 2,
  },
  userName: {
    ...getTypographyStyle('xl', 'bold'),
  },
  kpiScrollContainer: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  kpiCardHorizontal: {
    width: SCREEN_WIDTH * 0.70,
    height: 165,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moduleCardWrapper: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
  },
  moduleCardFixed: {
    height: 105,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  welcomeCard: {
    padding: spacing.xl,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  welcomeGreeting: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: spacing.xs,
  },
  welcomeName: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  userDesignation: {
    ...getTypographyStyle('xs', 'medium'),
    marginTop: spacing.xs,
  },
  userDefinition: {
    ...getTypographyStyle('xs', 'regular'),
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statValue: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  seeAllText: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  modernModulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  modernModuleCardWrapper: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
  },
  modernModuleCard: {
    height: 100,
  },
  modernModuleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: '100%',
    paddingVertical: spacing.xs,
  },
  modernModuleIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernModuleTitle: {
    ...getTypographyStyle('xs', 'semibold'),
    textAlign: 'center',
  },
  modulesHorizontalContainer: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  moduleCardHorizontal: {
    width: SCREEN_WIDTH * 0.235,
    height: 100,
  },
  moduleCard: {
    padding: spacing.base,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moduleTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    textAlign: 'center',
  },
  activityContainer: {
    // Container for activity items inside GlassCard
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.lg,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    marginBottom: 4,
  },
  activityDescription: {
    ...getTypographyStyle('xs', 'regular'),
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    ...getTypographyStyle('xs', 'regular'),
  },
  emptyState: {
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...getTypographyStyle('base', 'semibold'),
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: spacing.xs,
  },
  // Leadership Board Styles
  leaderboardContainer: {
    // Container for leaderboard items inside GlassCard
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  leaderboardItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  leaderRankContainer: {
    width: 40,
    alignItems: 'center',
  },
  leaderRankBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leaderRankText: {
    ...getTypographyStyle('sm', 'bold'),
  },
  leaderInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  leaderName: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.xs,
  },
  leaderStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  leaderStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderStatText: {
    ...getTypographyStyle('xs', 'regular'),
  },
  leaderStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: baseColors.neutral[300],
  },
  leaderScore: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  leaderScoreValue: {
    ...getTypographyStyle('xl', 'bold'),
  },
  leaderScoreLabel: {
    ...getTypographyStyle('xs', 'regular'),
  },
});
