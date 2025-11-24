import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useMyLeaves, useLeaveBalance, useLeaveStatistics } from '@/hooks/useHRQueries';
import { LeaveBalanceCard } from '@/components/hr';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { EmptyState, Skeleton } from '@/components';
import { spacing, borderRadius, shadows, getStatusColor, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { format, formatDistanceToNow } from 'date-fns';
import type { LeaveRequest } from '@/types/hr';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const LEAVE_TYPE_ICONS = {
  'Annual Leave': 'sunny-outline',
  'Sick Leave': 'medical-outline',
  'Casual Leave': 'cafe-outline',
  'Study Leave': 'school-outline',
  'Optional Leave': 'calendar-outline',
};

export default function LeaveManagementScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');

  // API Hooks
  const { data: leavesData, isLoading: leavesLoading, refetch } = useMyLeaves();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();
  const { data: stats } = useLeaveStatistics();

  // Mock data for demo until backend endpoints are ready
  const leaves = leavesData?.results || [];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter leaves
  const filteredLeaves = leaves.filter(leave => {
    if (filter === 'all') return true;
    return leave.status === filter;
  });

  // Calculate stats
  const totalRequests = leaves.length;
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  const renderQuickActions = () => (
    <View style={{ marginBottom: spacing.xl }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg - spacing.sm }}
      >
        <Pressable
          onPress={() => router.push('/(modules)/leave/apply')}
          accessibilityLabel="Apply Leave"
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minWidth: '23%',
              width: 80,
              backgroundColor: theme.primary,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.93 : 1 }],
              ...shadows.md,
            }
          ]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: getOpacityColor('#FFFFFF', 0.25), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={[getTypographyStyle('xs', 'bold'), { color: '#FFFFFF', textAlign: 'center' }]}>Apply</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(modules)/leave/calendar')}
          accessibilityLabel="View Calendar"
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minWidth: '23%',
              width: 80,
              backgroundColor: theme.surface,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.info,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.93 : 1 }],
              ...shadows.sm,
            }
          ]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: getOpacityColor(theme.info, 0.12), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="calendar" size={20} color={theme.info} />
          </View>
          <Text style={[getTypographyStyle('xs', 'bold'), { color: theme.text, textAlign: 'center' }]}>Calendar</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(modules)/leave/history')}
          accessibilityLabel="View History"
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minWidth: '23%',
              width: 80,
              backgroundColor: theme.surface,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: '#A855F7',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.93 : 1 }],
              ...shadows.sm,
            }
          ]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: getOpacityColor('#A855F7', 0.12), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="time" size={20} color="#A855F7" />
          </View>
          <Text style={[getTypographyStyle('xs', 'bold'), { color: theme.text, textAlign: 'center' }]}>History</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(modules)/leave/balance')}
          accessibilityLabel="View Balance"
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minWidth: '23%',
              width: 80,
              backgroundColor: theme.surface,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: theme.warning,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.93 : 1 }],
              ...shadows.sm,
            }
          ]}
        >
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: getOpacityColor(theme.warning, 0.12), alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="wallet" size={20} color={theme.warning} />
          </View>
          <Text style={[getTypographyStyle('xs', 'bold'), { color: theme.text, textAlign: 'center' }]}>Balance</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  const renderStatsCards = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {[
        { key: 'all', count: totalRequests, label: 'Total Requests', icon: 'calendar', color: theme.primary },
        { key: 'pending', count: pendingCount, label: 'Pending', icon: 'time', color: theme.warning },
        { key: 'approved', count: approvedCount, label: 'Approved', icon: 'checkmark-circle', color: theme.success },
        { key: 'rejected', count: rejectedCount, label: 'Rejected', icon: 'close-circle', color: theme.error },
      ].map(stat => {
        const isActive = filter === stat.key;
        const statusColor = getStatusColor(stat.key, isDark);
        
        return (
          <Pressable
            key={stat.key}
            onPress={() => setFilter(stat.key as FilterType)}
            accessibilityLabel={`${stat.label} - ${stat.count} requests`}
            accessibilityRole="button"
            style={[
              { flex: 1, minWidth: '48%' },
              {
                backgroundColor: isActive ? stat.color : theme.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: isActive ? stat.color : theme.border,
                ...shadows.sm,
              }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60 }}>
              <View style={{ width: 50, height: 50, borderRadius: borderRadius.md, backgroundColor: isActive ? getOpacityColor('#FFFFFF', 0.2) : getOpacityColor(stat.color, 0.2), alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={stat.icon as any} size={24} color={isActive ? '#FFFFFF' : stat.color} />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[getTypographyStyle('2xl', 'bold'), { color: isActive ? '#FFFFFF' : stat.color }]}>{stat.count}</Text>
                <Text style={[getTypographyStyle('xs', 'semibold'), { color: isActive ? 'rgba(255,255,255,0.85)' : theme.textSecondary, marginTop: spacing.xs }]}>{stat.label}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderLeaveCard = (leave: LeaveRequest) => {
    const statusColorObj = getStatusColor(leave.status, isDark);
    const leaveIcon = LEAVE_TYPE_ICONS[leave.leave_type] || 'calendar-outline';

    return (
      <Pressable
        key={leave.id}
        onPress={() => router.push(`/(modules)/leave/${leave.id}` as any)}
        accessibilityLabel={`${leave.leave_type} - ${leave.status}`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.leaveCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            ...shadows.sm,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.leaveCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md }}>
            <View style={[styles.leaveTypeIconContainer, { backgroundColor: getOpacityColor(statusColorObj.bg, 0.4), borderWidth: 2, borderColor: statusColorObj.border }]}>
              <Ionicons name={leaveIcon as any} size={iconSizes.sm} color={statusColorObj.icon} accessibilityLabel={leave.leave_type} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leaveType, { color: theme.text }]}>
                {leave.leave_type}
              </Text>
              <Text style={[styles.leaveShiftType, { color: theme.textSecondary }]}>
                {leave.shift_type === 'full_shift' ? 'Full Day' : 
                 leave.shift_type === 'first_half' ? 'First Half' : 'Second Half'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getOpacityColor(statusColorObj.bg, 0.5), borderWidth: 1.5, borderColor: statusColorObj.border }]}>
            <Text style={[styles.statusText, { color: statusColorObj.text, fontWeight: '700' }]}>
              {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.leaveDatesContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={iconSizes.xs} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {format(new Date(leave.from_date), 'MMM dd, yyyy')}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={iconSizes.xs} color={theme.textSecondary} />
          <View style={styles.dateItem}>
            <Ionicons name="calendar" size={iconSizes.xs} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {format(new Date(leave.to_date), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        {/* Reason */}
        {leave.reason && (
          <View style={styles.reasonContainer}>
            <Ionicons name="document-text-outline" size={iconSizes.xs} color={theme.textSecondary} />
            <Text style={[styles.reasonText, { color: theme.textSecondary }]} numberOfLines={2}>
              {leave.reason}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.leaveCardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="time-outline" size={iconSizes.xs} color={theme.textSecondary} />
            <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
              {formatDistanceToNow(new Date(leave.created_at), { addSuffix: true })}
            </Text>
          </View>
          {leave.approved_by && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="person-circle-outline" size={iconSizes.xs} color={theme.textSecondary} />
              <Text style={[styles.approver, { color: theme.textSecondary }]}>
                {leave.approved_by_name}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (leavesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ModuleHeader title="Leave Management" />
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton height={120} style={{ marginBottom: 16 }} />
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} height={100} style={{ borderRadius: 12 }} />
            ))}
          </View>
          <Skeleton height={200} style={{ marginTop: 16 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ModuleHeader title="Leave Management" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        {/* Leave Balance Card */}
        {!balanceLoading && balance && (
          <View style={{ marginBottom: spacing.lg }}>
            <LeaveBalanceCard />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          {renderQuickActions()}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Leave Requests</Text>
          {renderStatsCards()}
        </View>

        {/* Recent Leaves */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {filter === 'all' ? 'Recent Requests' : 
               `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
            </Text>
            {filteredLeaves.length > 0 && (
              <Pressable onPress={() => setFilter('all')}>
                <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '600' }}>
                  View All
                </Text>
              </Pressable>
            )}
          </View>

          {filteredLeaves.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Leaves Found"
              message={
                filter === 'all' 
                  ? "You haven't applied for any leave yet. Click 'Apply Leave' to get started."
                  : `No ${filter} leave requests found.`
              }
              actionText="Apply Leave"
              onAction={() => router.push('/(modules)/leave/apply')}
            />
          ) : (
            <View style={{ gap: 12 }}>
              {filteredLeaves.slice(0, 5).map(renderLeaveCard)}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...getTypographyStyle('xl', 'bold'),
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  leaveCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveType: {
    ...getTypographyStyle('base', 'bold'),
  },
  leaveShiftType: {
    ...getTypographyStyle('xs', 'regular'),
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...getTypographyStyle('xs', 'bold'),
  },
  leaveDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  reasonContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reasonText: {
    ...getTypographyStyle('sm', 'regular'),
    flex: 1,
  },
  leaveCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeAgo: {
    ...getTypographyStyle('xs', 'regular'),
  },
  approver: {
    ...getTypographyStyle('xs', 'regular'),
  },
});
