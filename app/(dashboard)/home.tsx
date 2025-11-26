import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, StyleSheet, Image, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Skeleton, SkeletonText, AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes, typography, moduleColors, baseColors } from '@/constants/designSystem';
import { getShadowStyle, getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { useCurrentUser, useLeaveBalance, useRecentActivities, useRefreshDashboard, useActiveProjectsCount, useLeaderboard, useRealtimeActivities } from '@/hooks/useDashboardQueries';
import { formatDistanceToNow } from 'date-fns';

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

// Dummy Leadership Board Data - Project Based Rankings
const DUMMY_LEADERBOARD = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    photo: null,
    rank: 1,
    score: 2450,
    projectsCompleted: 12,
    tasksCompleted: 89,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    photo: null,
    rank: 2,
    score: 2280,
    projectsCompleted: 10,
    tasksCompleted: 76,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Amit Patel',
    photo: null,
    rank: 3,
    score: 2150,
    projectsCompleted: 9,
    tasksCompleted: 71,
    isOnline: false,
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    photo: null,
    rank: 4,
    score: 1980,
    projectsCompleted: 8,
    tasksCompleted: 64,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Vikram Singh',
    photo: null,
    rank: 5,
    score: 1875,
    projectsCompleted: 7,
    tasksCompleted: 58,
    isOnline: true,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  // Fetch real data from backend with real-time updates
  const user = useAuthStore((state) => state.user);
  const { data: leaveBalance, isLoading: leaveLoading, refetch: refetchLeave } = useLeaveBalance();
  const { data: realtimeActivities = [], isLoading: activitiesLoading } = useRealtimeActivities(5);
  const { data: activeProjectsCount, refetch: refetchProjects } = useActiveProjectsCount();
  const { data: leaderboardData = [], isLoading: leaderboardLoading } = useLeaderboard(5);
  const { mutate: refreshDashboard, isPending: isRefreshing } = useRefreshDashboard();

  const [notificationCount] = useState(0);
  
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
  
  // Attendance - will be real when backend provides it
  const attendancePercentage = 95;
  
  // Active projects from backend
  const activeProjects = activeProjectsCount ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Professional Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).springify()}
        style={[styles.header, { backgroundColor: theme.surface }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.appName, { color: theme.text }]}>Sarvagun</Text>

            <View style={styles.headerActions}>
            <AnimatedPressable
              onPress={() => router.push('/(dashboard)/search' as any)}
              style={[
                styles.iconButton,
                { 
                  backgroundColor: `${theme.primary}10`,
                  borderColor: theme.border,
                }
              ]}
              hapticType="light"
              springConfig="snappy"
            >
              <Ionicons name="search-outline" size={iconSizes.sm} color={theme.text} />
            </AnimatedPressable>

              <AnimatedPressable
                onPress={() => router.push('/(dashboard)/notifications')}
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: `${theme.primary}10`,
                    borderColor: theme.border,
                  }
                ]}
                hapticType="light"
                springConfig="snappy"
              >
                <Ionicons name="notifications-outline" size={iconSizes.sm} color={theme.text} />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </AnimatedPressable>
            </View>
          </View>
        </View>
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
        {/* Welcome Card - Clean & Minimal with Real Data */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(700).springify()}
          style={styles.section}
        >
          {isLoading ? (
            <View style={[styles.welcomeCard, getCardStyle(theme.surface, 'md', 'xl')]}>
              <View style={styles.welcomeContent}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <View style={styles.welcomeInfo}>
                  <Skeleton width={150} height={16} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={200} height={24} />
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Skeleton width={60} height={20} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={70} height={14} />
                </View>
                <View style={styles.statItem}>
                  <Skeleton width={60} height={20} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={70} height={14} />
                </View>
                <View style={styles.statItem}>
                  <Skeleton width={60} height={20} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={70} height={14} />
                </View>
              </View>
            </View>
          ) : (
            <AnimatedPressable
              onPress={() => router.push('/(dashboard)/my-profile')}
              style={[styles.welcomeCard, getCardStyle(theme.surface, 'md', 'xl')]}
              hapticType="light"
              springConfig="gentle"
            >
              <View style={styles.welcomeContent}>
                <Avatar
                  size={56}
                  source={displayUser?.photo ? { uri: displayUser.photo } : undefined}
                  name={fullName}
                  onlineStatus={true}
                />
                <View style={styles.welcomeInfo}>
                  <Text style={[styles.welcomeName, { color: theme.text }]}>
                    {fullName}
                  </Text>
                  {displayUser?.designation && (
                    <Text style={[styles.userDesignation, { color: theme.textSecondary }]}>
                      {displayUser.designation}
                    </Text>
                  )}
                  {displayUser?.category && (
                    <Text style={[styles.userDefinition, { color: theme.primary }]}>
                      {displayUser.category.charAt(0).toUpperCase() + displayUser.category.slice(1)}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>

              {/* Clean Stats Row with Real Data */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{attendancePercentage}%</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Attendance</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{leaveDays}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Leave Balance</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{activeProjects}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Projects</Text>
                </View>
              </View>
            </AnimatedPressable>
          )}
        </Animated.View>

        {/* Modules Section - Professional Cards */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(700).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
            <AnimatedPressable onPress={() => router.push('/(dashboard)/modules')} hapticType="selection">
              <Text style={[styles.seeAllText, { color: theme.primary }]}>View All</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.modulesGrid}>
            {MODULES.slice(0, 4).map((module, index) => (
              <Animated.View
                key={module.id}
                entering={FadeIn.delay(600 + index * 100).duration(600).springify()}
              >
                <AnimatedPressable
                  onPress={() => router.push(module.route as any)}
                  style={[
                    styles.moduleCard,
                    getCardStyle(theme.surface, 'sm', 'lg'),
                    { 
                      width: (SCREEN_WIDTH - spacing.lg * 4) / 4,
                      marginRight: index === 3 ? 0 : spacing.md +1,
                    },
                  ]}
                  hapticType="medium"
                  springConfig="bouncy"
                  animateOnMount={false}
                >
                  <View style={[styles.moduleIconContainer, { backgroundColor: module.color + '15' }]}>
                    <Ionicons name={module.icon} size={iconSizes.lg} color={module.color} />
                  </View>
                  <Text style={[styles.moduleTitle, { color: theme.text }]} numberOfLines={1}>
                    {module.title}
                  </Text>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity Section */}
        <Animated.View 
          entering={FadeInUp.delay(1000).duration(700).springify()}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          </View>

          <View style={[styles.activityContainer, getCardStyle(theme.surface, 'md', 'lg')]}>
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
            ) : realtimeActivities.length > 0 ? (
              realtimeActivities.slice(0, 5).map((activity, index, arr) => {
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
                    style={[
                      styles.activityItem,
                      {
                        borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    hapticType="light"
                    springConfig="gentle"
                  >
                    <View style={[styles.activityIcon, { backgroundColor: activityColor + '15' }]}>
                      <Ionicons name={activityIcon} size={iconSizes.md} color={activityColor} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: theme.text }]}>
                        {activity.title}
                      </Text>
                      <Text style={[styles.activityDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                        {activity.description}
                      </Text>
                      <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                        {timeAgo}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={iconSizes.sm} color={theme.textSecondary} />
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
        </Animated.View>

        {/* Leadership Board Preview */}
        <Animated.View 
          entering={FadeInUp.delay(1200).duration(700).springify()}
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

          <View style={[styles.leaderboardContainer, getCardStyle(theme.surface, 'md', 'lg')]}>
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
            ) : leaderboardData.length > 0 ? (
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
                  style={[
                    styles.leaderboardItem,
                    ...(isTopThree ? [styles.leaderboardItemTopThree] : []),
                    {
                      borderBottomWidth: index < 4 ? 1 : 0,
                      borderBottomColor: theme.border,
                    },
                  ]}
                  hapticType="light"
                  springConfig="gentle"
                  animateOnMount={true}
                >
                  <LinearGradient
                    colors={isTopThree ? [rankColor + '08', rankColor + '00'] : ['transparent', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  
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
                </AnimatedPressable>
              );
            })
            ) : (
              DUMMY_LEADERBOARD.slice(0, 5).map((leader, index) => {
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
                    style={[
                      styles.leaderboardItem,
                      ...(isTopThree ? [styles.leaderboardItemTopThree] : []),
                      {
                        borderBottomWidth: index < 4 ? 1 : 0,
                        borderBottomColor: theme.border,
                      },
                    ]}
                    hapticType="light"
                    springConfig="gentle"
                    animateOnMount={true}
                  >
                    <LinearGradient
                      colors={isTopThree ? [rankColor + '08', rankColor + '00'] : ['transparent', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    
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
                  </AnimatedPressable>
                );
              })
            )}
          </View>
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
      default:
        return 'notifications-outline';
    }
  }

  function getActivityColor(type: string): string {
    switch (type) {
      case 'leave':
        return moduleColors.leave.main;
      case 'task':
        return moduleColors.tasks.main;
      case 'attendance':
        return moduleColors.attendance.main;
      case 'event':
        return moduleColors.events.main;
      case 'project':
        return moduleColors.projects.main;
      default:
        return theme.primary;
    }
  }

  function handleActivityPress(activity: any) {
    // Navigate to appropriate screen based on activity type
    switch (activity.type) {
      case 'leave':
        router.push('/(modules)/hr');
        break;
      case 'task':
      case 'project':
        router.push('/(modules)/projects');
        break;
      case 'event':
        router.push('/(modules)/events');
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: baseColors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...getTypographyStyle('xs', 'bold'),
    color: baseColors.neutral[0],
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
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
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 0,
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
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.xs,
  },
  activityDescription: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.xs,
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
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
    minHeight: 72,
  },
  leaderboardItemTopThree: {
    minHeight: 80,
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
  },
  leaderRankText: {
    ...getTypographyStyle('base', 'bold'),
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
