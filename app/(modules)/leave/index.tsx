/**
 * Leave Management Screen
 * Redesigned following approved implementation plan
 * Matches Events module pattern exactly
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { FilterBar, EmptyState, Badge } from '@/components';
import { CompactLeaveBalance } from '@/components/hr';
import { useTheme } from '@/hooks/useTheme';
import { useMyLeaves, useLeaveBalance, useLeaveStatistics, useTeamLeaves } from '@/hooks/useHRQueries';
import { useAuthStore } from '@/store/authStore';
import NotificationBell from '@/components/layout/NotificationBell';
import { format } from 'date-fns';
import { getStatusColor, getOpacityColor } from '@/constants/designSystem';
import type { LeaveRequest, TeamMemberLeave } from '@/types/hr';

type TabType = 'dashboard' | 'myleaves' | 'team' | 'calendar';

const LEAVE_TYPE_ICONS: Record<string, string> = {
  'Annual Leave': 'sunny-outline',
  'Sick Leave': 'medical-outline',
  'Casual Leave': 'cafe-outline',
  'Study Leave': 'school-outline',
  'Optional Leave': 'calendar-outline',
};

export default function LeaveManagementScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [filters, setFilters] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Permission checks - using category as per Events module
  // Check for various role strings: hr, admin, manager, team_lead
  const userCategory = (user?.category || '').toLowerCase();
  const canApprove = ['hr', 'admin', 'manager', 'team_lead', 'team lead', 'management'].includes(userCategory);

  // API Hooks
  const { data: leavesData, isLoading: leavesLoading, refetch: refetchLeaves } = useMyLeaves();
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useLeaveBalance();
  const { data: stats, refetch: refetchStats } = useLeaveStatistics();
  const { data: teamLeavesData, isLoading: teamLeavesLoading, refetch: refetchTeamLeaves } = useTeamLeaves();

  // Safely handle paginated vs array response
  const leaves = (leavesData as any)?.results || (Array.isArray(leavesData) ? leavesData : []) || [];
  const teamLeaves = (teamLeavesData as any)?.results || (Array.isArray(teamLeavesData) ? teamLeavesData : []) || [];

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          router.back();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router, navigation])
  );

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchLeaves(),
        refetchBalance(),
        refetchStats(),
        canApprove && refetchTeamLeaves(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [canApprove, refetchLeaves, refetchBalance, refetchStats, refetchTeamLeaves]);

  // Tab configuration
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { key: 'myleaves', label: 'My Leaves', icon: 'document-text-outline' },
    ...(canApprove ? [{ key: 'team', label: 'Team', icon: 'people-outline' }] : []),
    { key: 'calendar', label: 'Calendar', icon: 'calendar-outline' },
  ];

  // Handle tab change - stays inline, no navigation
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabType);
    setFilters({});
    setShowFilters(false);
  }, []);

  // Filter configs
  const getFilterConfigs = () => {
    if (activeTab === 'myleaves' || activeTab === 'team') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel' as const,
          type: 'select' as const,
          options: [
            { label: 'Pending', value: 'pending', color: '#f59e0b' },
            { label: 'Approved', value: 'approved', color: '#10b981' },
            { label: 'Rejected', value: 'rejected', color: '#ef4444' },
          ],
        },
      ];
    }
    return [];
  };

  // Filter leaves
  const getFilteredLeaves = (leaveList: any[]) => {
    let filtered = [...leaveList];
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(l => l.status === filters.status);
    }
    return filtered;
  };

  const filteredLeaves = getFilteredLeaves(leaves);
  const filteredTeamLeaves = getFilteredLeaves(teamLeaves);

  // Stats
  const totalRequests = leaves.length;
  const pendingCount = leaves.filter((l: any) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l: any) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l: any) => l.status === 'rejected').length;

  // Render compact leave card (single row)
  const renderLeaveCard = (leave: LeaveRequest) => {
    const statusColorObj = getStatusColor(leave.status, isDark);
    const leaveIcon = LEAVE_TYPE_ICONS[leave.leave_type] || 'calendar-outline';

    // Safe date formatting
    const fromDate = leave.from_date ? format(new Date(leave.from_date), 'MMM dd') : '';
    const toDate = leave.to_date ? format(new Date(leave.to_date), 'MMM dd') : '';

    return (
      <TouchableOpacity
        key={leave.id}
        onPress={() => router.push(`/(modules)/leave/${leave.id}` as any)}
        activeOpacity={0.7}
        style={[styles.leaveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.cardRow}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getOpacityColor(statusColorObj.bg, 0.2) }]}>
            <Ionicons name={leaveIcon as any} size={18} color={statusColorObj.icon} />
          </View>

          {/* Type + Dates */}
          <View style={styles.cardContent}>
            <Text style={[styles.leaveType, { color: theme.text }]}>{leave.leave_type}</Text>
            <Text style={[styles.dateRange, { color: theme.textSecondary }]}>
              {fromDate}{toDate ? ` - ${toDate}` : ''}
            </Text>
          </View>

          {/* Status Badge */}
          <Badge label={leave.status} status={leave.status as any} size="sm" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render team leave card
  const renderTeamLeaveCard = (leave: TeamMemberLeave, index: number) => {
    const statusColorObj = getStatusColor(leave.status, isDark);
    const leaveIcon = LEAVE_TYPE_ICONS[leave.leave_type] || 'calendar-outline';

    const fromDate = leave.from_date ? format(new Date(leave.from_date), 'MMM dd') : '';
    const toDate = leave.to_date ? format(new Date(leave.to_date), 'MMM dd') : '';

    return (
      <TouchableOpacity
        key={`team-${index}`}
        activeOpacity={0.7}
        style={[styles.leaveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconContainer, { backgroundColor: getOpacityColor(statusColorObj.bg, 0.2) }]}>
            <Ionicons name={leaveIcon as any} size={18} color={statusColorObj.icon} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.employeeName, { color: theme.primary }]}>{leave.employee_name}</Text>
            <Text style={[styles.leaveType, { color: theme.text }]}>{leave.leave_type}</Text>
            <Text style={[styles.dateRange, { color: theme.textSecondary }]}>
              {fromDate}{toDate ? ` - ${toDate}` : ''}
            </Text>
          </View>
          <Badge label={leave.status} status={leave.status as any} size="sm" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* Compact Leave Balance */}
      <View style={styles.balanceSection}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 8 }]}>Your Leave Balance</Text>
        <CompactLeaveBalance onViewAll={() => router.push('/(modules)/leave/balance' as any)} />
      </View>

      {/* Stats Grid - 4 cards */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Request Statistics</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total', count: totalRequests, color: theme.primary, icon: 'document-text' },
          { label: 'Pending', count: pendingCount, color: '#f59e0b', icon: 'time' },
          { label: 'Approved', count: approvedCount, color: '#10b981', icon: 'checkmark-circle' },
          { label: 'Rejected', count: rejectedCount, color: '#ef4444', icon: 'close-circle' },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            <Text style={[styles.statCount, { color: theme.text }]}>{stat.count}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Requests */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Requests</Text>

      {leaves.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No Leave Requests" subtitle="Apply for leave to get started" />
      ) : (
        <View style={styles.cardList}>
          {leaves.slice(0, 5).map(renderLeaveCard)}
        </View>
      )}
    </View>
  );

  // Render My Leaves Tab
  const renderMyLeaves = () => (
    <View style={styles.tabContent}>
      {filteredLeaves.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No Leaves Found" subtitle="No leave requests match your filter" />
      ) : (
        <View style={styles.cardList}>
          {filteredLeaves.map(renderLeaveCard)}
        </View>
      )}
    </View>
  );

  // Render Team Leaves Tab
  const renderTeamLeaves = () => (
    <View style={styles.tabContent}>
      {filteredTeamLeaves.length === 0 ? (
        <EmptyState icon="people-outline" title="No Team Leaves" subtitle="No pending leave requests from team" />
      ) : (
        <View style={styles.cardList}>
          {filteredTeamLeaves.map(renderTeamLeaveCard)}
        </View>
      )}
    </View>
  );

  // Render Calendar Tab (inline placeholder)
  const renderCalendar = () => (
    <View style={styles.calendarPlaceholder}>
      <Ionicons name="calendar" size={64} color={theme.textTertiary} />
      <Text style={[styles.calendarTitle, { color: theme.text }]}>Calendar View</Text>
      <Text style={[styles.calendarSubtitle, { color: theme.textSecondary }]}>
        View your leave schedule in calendar format
      </Text>
    </View>
  );

  // Get active tab content
  const getTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'myleaves': return renderMyLeaves();
      case 'team': return renderTeamLeaves();
      case 'calendar': return renderCalendar();
      default: return null;
    }
  };

  const filterConfigs = getFilterConfigs();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header - NO insets.top here, ModuleHeader handles it */}
      <ModuleHeader
        title="Leave Management"
        rightActions={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name={showFilters ? "filter" : "filter-outline"} size={22} color={theme.text} />
            </TouchableOpacity>
            <NotificationBell size={22} color={theme.text} />
            {/* Approvals Button for Admin/HR */}
            {canApprove && (
              <TouchableOpacity
                onPress={() => router.push('/(modules)/leave/approve')}
                style={[styles.approvalButton, { backgroundColor: getOpacityColor(theme.primary, 0.15) }]}
              >
                <Ionicons name="checkmark-done-circle" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
            {/* Apply Leave Button with Text */}
            <TouchableOpacity
              onPress={() => router.push('/(modules)/leave/apply')}
              style={[styles.applyButton, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Tabs - inside content area */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key)}
                  style={[
                    styles.tab,
                    activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.primary }],
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === tab.key ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? theme.primary : theme.text }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filters */}
        {showFilters && filterConfigs.length > 0 && (
          <FilterBar
            configs={filterConfigs as any}
            activeFilters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Scrollable Content */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {getTabContent()}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  tabContent: {
    padding: 16,
  },
  balanceSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardList: {
    gap: 8,
  },
  leaveCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  employeeName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 12,
    marginTop: 2,
  },
  calendarPlaceholder: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  calendarSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  approvalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

});
