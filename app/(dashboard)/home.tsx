import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar, StyleSheet, Image, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, Skeleton, SkeletonText, AnimatedPressable } from '@/components';
import { spacing, borderRadius, iconSizes, typography } from '@/constants/designSystem';
import { getShadowStyle, getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';

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
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'events',
    title: 'Events',
    icon: 'calendar',
    route: '/(modules)/events',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'cash',
    route: '/(modules)/finance',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'briefcase',
    route: '/(modules)/projects',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'leave',
    title: 'Leave',
    icon: 'time',
    route: '/(modules)/leave',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();
  const [notificationCount] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Clean Professional Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
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
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Welcome Card - Clean & Minimal */}
        <View style={styles.section}>
          <View style={[styles.welcomeCard, getCardStyle(theme.surface, 'md', 'xl')]}>
            <View style={styles.welcomeContent}>
              <Avatar
                size={56}
                source={user?.photo ? { uri: user.photo } : undefined}
                name={user?.full_name}
                onlineStatus={true}
              />
              <View style={styles.welcomeInfo}>
                <Text style={[styles.welcomeGreeting, { color: theme.textSecondary }]}>
                  {getGreeting()}, 👋
                </Text>
                <Text style={[styles.welcomeName, { color: theme.text }]}>
                  {user?.full_name || 'User'}
                </Text>
              </View>
            </View>

            {/* Clean Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>95%</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Attendance</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Leave Days</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>3</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Projects</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Modules Section - Professional Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
            <AnimatedPressable onPress={() => router.push('/(dashboard)/modules')} hapticType="selection">
              <Text style={[styles.seeAllText, { color: theme.primary }]}>View All</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.modulesGrid}>
            {MODULES.slice(0, 4).map((module) => (
              <AnimatedPressable
                key={module.id}
                onPress={() => router.push(module.route as any)}
                style={[
                  styles.moduleCard,
                  getCardStyle(theme.surface, 'sm', 'lg'),
                  { 
                    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
                  },
                ]}
                hapticType="medium"
                springConfig="bouncy"
                animateOnMount={true}
              >
                <View style={[styles.moduleIconContainer, { backgroundColor: module.color + '15' }]}>
                  <Ionicons name={module.icon} size={iconSizes.lg} color={module.color} />
                </View>
                <Text style={[styles.moduleTitle, { color: theme.text }]} numberOfLines={1}>
                  {module.title}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          </View>

          <View style={[styles.activityContainer, getCardStyle(theme.surface, 'md', 'lg')]}>
            {[
              {
                title: 'Leave Request Approved',
                description: 'Your leave request for Dec 25-27 has been approved',
                time: '2 hours ago',
                icon: 'checkmark-circle' as const,
                color: '#10B981',
              },
              {
                title: 'New Task Assigned',
                description: 'Design System Update - Priority: High',
                time: '5 hours ago',
                icon: 'briefcase' as const,
                color: '#3B82F6',
              },
              {
                title: 'Attendance Marked',
                description: 'Check-in at 9:00 AM',
                time: '1 day ago',
                icon: 'finger-print' as const,
                color: '#8B5CF6',
              },
            ].map((activity, index, arr) => (
              <AnimatedPressable
                key={index}
                onPress={() => console.log('Activity:', activity.title)}
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
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                  <Ionicons name={activity.icon} size={iconSizes.md} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.text }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {activity.description}
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                    {activity.time}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={iconSizes.sm} color={theme.textSecondary} />
              </AnimatedPressable>
            ))}
          </View>
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
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...getTypographyStyle('xs', 'bold'),
    color: '#FFFFFF', // Will be overridden inline with theme.textInverse
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#00000008',
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
    gap: spacing.md,
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
});
