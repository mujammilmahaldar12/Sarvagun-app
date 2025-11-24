import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useMyLeaves, useLeaveBalance, useLeaveStatistics } from '@/hooks/useHRQueries';
import { LeaveBalanceCard } from '@/components/hr';
import { AnimatedPressable, Card, Badge } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle, getShadowStyle } from '@/utils/styleHelpers';
import { formatDistanceToNow, format } from 'date-fns';
import type { LeaveRequest } from '@/types/hr';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

const StatCard = ({ label, value, icon, color, onPress }: StatCardProps) => {
  const { theme } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.statCard,
        getCardStyle(theme.surface, 'md', 'lg'),
        { flex: 1, minWidth: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 }
      ]}
      hapticType="light"
      springConfig="bouncy"
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </AnimatedPressable>
  );
};

// Leave Item Component
interface LeaveItemProps {
  leave: LeaveRequest;
  onPress: () => void;
}

const LeaveItem = ({ leave, onPress }: LeaveItemProps) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#6B7280';
      default: return theme.primary;
    }
  };

  const getLeaveTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type.includes('Sick')) return 'medical';
    if (type.includes('Casual')) return 'cafe';
    if (type.includes('Annual')) return 'calendar';
    if (type.includes('Study')) return 'school';
    return 'time';
  };

  const statusColor = getStatusColor(leave.status);

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(leave.applied_date || leave.created_at || Date.now()), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <Card
      onPress={onPress}
      variant="elevated"
      shadow="sm"
      padding="base"
      animated={true}
      style={{ marginBottom: spacing.sm }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={[styles.leaveIconContainer, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={getLeaveTypeIcon(leave.leave_type)} size={24} color={statusColor} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
            <Text style={[styles.leaveType, { color: theme.text }]} numberOfLines={1}>
              {leave.leave_type}
            </Text>
            <Badge
              label={leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
              variant="filled"
              size="sm"
              color={statusColor}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.leaveDates, { color: theme.textSecondary }]}>
              {format(new Date(leave.from_date), 'MMM dd')} - {format(new Date(leave.to_date), 'MMM dd, yyyy')}
            </Text>
            <Text style={[styles.leaveDays, { color: theme.primary }]}>
              • {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {leave.reason && (
            <Text style={[styles.leaveReason, { color: theme.textSecondary }]} numberOfLines={2}>
              {leave.reason}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs }}>
            <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              Applied {timeAgo}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
    </Card>
  );
};

export default function LeaveScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');

  // API hooks
  const { data: leaveBalance, isLoading: balanceLoading, refetch: refetchBalance } = useLeaveBalance();
  const { data: leaveStats, refetch: refetchStats } = useLeaveStatistics();
  const { 
    data: myLeavesData, 
    isLoading: leavesLoading, 
    refetch: refetchLeaves 
  } = useMyLeaves({ 
    status: filterStatus === 'all' ? undefined : filterStatus,
    ordering: '-applied_date'
  });

  const myLeaves: LeaveRequest[] = Array.isArray(myLeavesData)
    ? myLeavesData
    : (myLeavesData as any)?.results || [];

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchBalance(),
      refetchStats(),
      refetchLeaves(),
    ]);
    setIsRefreshing(false);
  }, [refetchBalance, refetchStats, refetchLeaves]);

  // Quick actions
  const quickActions = [
    {
      id: 'apply',
      title: 'Apply Leave',
      icon: 'add-circle' as const,
      color: '#8B5CF6',
      route: '/(modules)/leave/apply',
    },
    {
      id: 'calendar',
      title: 'Team Calendar',
      icon: 'calendar' as const,
      color: '#3B82F6',
      route: '/(modules)/leave/calendar',
    },
    {
      id: 'history',
      title: 'Leave History',
      icon: 'time' as const,
      color: '#10B981',
      route: '/(modules)/leave/history',
    },
    {
      id: 'balance',
      title: 'My Balance',
      icon: 'analytics' as const,
      color: '#F59E0B',
      onPress: () => {
        // Scroll to balance card or show modal
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ModuleHeader
        title="Leave Management"
        subtitle="Manage your time off"
        showBack={true}
        backgroundColor={theme.surface}
      />

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
        {/* Statistics Cards */}
        {leaveStats && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Requests"
                value={leaveStats.total_requests || 0}
                icon="documents"
                color="#8B5CF6"
              />
              <StatCard
                label="Pending"
                value={leaveStats.pending_requests || 0}
                icon="time"
                color="#F59E0B"
                onPress={() => setFilterStatus('pending')}
              />
              <StatCard
                label="Approved"
                value={leaveStats.approved_requests || 0}
                icon="checkmark-circle"
                color="#10B981"
                onPress={() => setFilterStatus('approved')}
              />
              <StatCard
                label="Rejected"
                value={leaveStats.rejected_requests || 0}
                icon="close-circle"
                color="#EF4444"
              />
            </View>
          </View>
        )}

        {/* Leave Balance */}
        {!balanceLoading && leaveBalance && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Leave Balance</Text>
            <LeaveBalanceCard compact />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <AnimatedPressable
                key={action.id}
                onPress={() => {
                  if (action.route) {
                    router.push(action.route as any);
                  } else if (action.onPress) {
                    action.onPress();
                  }
                }}
                style={[
                  styles.quickActionCard,
                  getCardStyle(theme.surface, 'md', 'lg'),
                  { backgroundColor: action.color + '15' }
                ]}
                hapticType="medium"
                springConfig="bouncy"
              >
                <Ionicons name={action.icon} size={28} color={action.color} />
                <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                  {action.title}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.section}>
          <View style={styles.filterContainer}>
            {['all', 'pending', 'approved'].map((status) => (
              <Pressable
                key={status}
                onPress={() => setFilterStatus(status as any)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: filterStatus === status ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  }
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: filterStatus === status ? '#FFFFFF' : theme.text,
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Leaves */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Leaves</Text>
            <AnimatedPressable
              onPress={() => router.push('/(modules)/leave/history')}
              hapticType="light"
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
                View All
              </Text>
            </AnimatedPressable>
          </View>

          {leavesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.textSecondary }}>Loading leaves...</Text>
            </View>
          ) : myLeaves.length > 0 ? (
            <View>
              {myLeaves.slice(0, 5).map((leave) => (
                <LeaveItem
                  key={leave.id}
                  leave={leave}
                  onPress={() => router.push(`/(modules)/leave/${leave.id}` as any)}
                />
              ))}
            </View>
          ) : (
            <Card variant="elevated" shadow="sm" padding="lg">
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No Leave Requests
                </Text>
                <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  You haven't applied for any leaves yet
                </Text>
                <AnimatedPressable
                  onPress={() => router.push('/(modules)/leave/apply')}
                  style={[
                    styles.emptyButton,
                    { backgroundColor: theme.primary }
                  ]}
                  hapticType="medium"
                  springConfig="bouncy"
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Apply Leave</Text>
                </AnimatedPressable>
              </View>
            </Card>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.base,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  leaveIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveType: {
    ...getTypographyStyle('base', 'semibold'),
    flex: 1,
  },
  leaveDates: {
    ...getTypographyStyle('xs', 'regular'),
  },
  leaveDays: {
    ...getTypographyStyle('xs', 'semibold'),
  },
  leaveReason: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 18,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    ...getTypographyStyle('base', 'semibold'),
    color: '#FFFFFF',
  },
});
