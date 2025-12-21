/**
 * HR Management Screen
 * Updated with 3 tabs: Staff | My Requests | Pending Approvals
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAllUsers, useSearchEmployees, useReimbursements, useReimbursementStatistics, useUpdateReimbursementStatus } from '@/hooks/useHRQueries';
import { useModule } from '@/hooks/useModule';
import { Table, type TableColumn, Badge, KPICard, FilterBar, EmptyState, Skeleton, FAB } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import type { Reimbursement } from '@/types/hr';

type TabType = 'staff' | 'myrequests' | 'approvals';

export default function HRScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  // Permissions
  const { canManage: canManageStaff, can: canHR } = useModule('hr.employees');
  const { canApprove: canApproveLeaves } = useModule('hr.leaves');

  if (!canHR('view')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
        <Text style={{ marginTop: 16, fontSize: 18, color: theme.textSecondary }}>Access Denied</Text>
      </View>
    );
  }

  // Custom 'hire' permission check if needed, or imply from manage
  const canAccessHireActions = canManageStaff;
  const canApprove = canApproveLeaves || canHR('approve');

  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    confirmText: string;
    type: 'approve' | 'reject' | null;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', onConfirm: () => { }, confirmText: '', type: null });
  const [showHireMenu, setShowHireMenu] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('👤 HR Module User Debug:', {
      id: user?.id,
      username: user?.username,
      category: user?.category,
      role: user?.role,
      is_team_leader: user?.is_team_leader,
      computedRole: user?.role,
      canAccessHireActions,
      activeTab,
    });
  }, [user, activeTab]);

  const [refreshing, setRefreshing] = useState(false);

  // API Hooks - Pass filter to server for server-side filtering
  const { data: usersData, refetch: refetchUsers } = useAllUsers({ search: debouncedSearch || undefined });
  const { data: searchResults } = useSearchEmployees(debouncedSearch, {}, debouncedSearch.length > 1);

  // Server-side filtering: Pass status to API
  const reimbursementFilters = useMemo(() => {
    const f: any = {};
    if (activeTab === 'approvals' && !filters.status) {
      f.status = 'pending'; // Default to pending for approval tab
    } else if (filters.status) {
      f.status = filters.status;
    }
    return f;
  }, [activeTab, filters.status]);

  const { data: reimbursementsData, isLoading: reimbursementsLoading, refetch: refetchReimbursements } = useReimbursements(reimbursementFilters);
  const { data: reimbursementStats } = useReimbursementStatistics();
  const updateReimbursementStatus = useUpdateReimbursementStatus();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tab configuration - Pending Approvals only for Admin/HR/Team Lead
  const tabs = [
    { key: 'staff', label: 'Staff', icon: 'people-outline' },
    { key: 'myrequests', label: 'My Requests', icon: 'receipt-outline' },
    ...(canApprove ? [{ key: 'approvals', label: 'Approvals', icon: 'checkmark-circle-outline' }] : []),
    ...(canAccessHireActions ? [{ key: 'extensions', label: 'Extensions', icon: 'time-outline' }] : []),
  ];

  // Filter configuration
  const getFilterConfigs = () => {
    if (activeTab === 'myrequests' || activeTab === 'approvals') {
      return [{
        key: 'status', label: 'Status', icon: 'funnel' as const, type: 'select' as const,
        options: [
          { label: 'Pending', value: 'pending', color: '#f59e0b' },
          { label: 'Approved', value: 'approved', color: '#10b981' },
          { label: 'Rejected', value: 'rejected', color: '#ef4444' },
        ],
      }];
    } else {
      return [{
        key: 'status', label: 'Status', icon: 'funnel' as const, type: 'select' as const,
        options: [
          { label: 'Active', value: 'active', color: '#10b981' },
          { label: 'Inactive', value: 'inactive', color: '#ef4444' },
        ],
      }];
    }
  };

  // Data transformations
  const staffData = useMemo(() => {
    const users = debouncedSearch && searchResults?.results ? searchResults.results : usersData || [];
    return users.map((u: any) => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
      designation: u.designation || 'N/A',
      department: u.department || 'N/A', // Now supported by backend
      status: u.is_active ? 'Active' : 'Inactive',
    }));
  }, [usersData, searchResults, debouncedSearch]);

  const reimbursementData = useMemo(() => {
    return (reimbursementsData?.results || []).map((item: Reimbursement) => ({
      id: item.id,
      employee: item.requested_by_name || `User ${item.requested_by}`,
      employeeId: item.requested_by,
      type: (item as any).expense?.particulars || (item as any).expense_details?.particulars || 'Expense',
      amount: Number(item.reimbursement_amount) || 0,
      date: item.submitted_at ? new Date(item.submitted_at).toISOString().split('T')[0] : 'N/A',
      status: (item.latest_status?.status || item.status || 'pending').toLowerCase(),
      hasBill: item.bill_evidence === 'yes',
    }));
  }, [reimbursementsData]);

  // My Requests - filter by current user
  const myRequests = useMemo(() => {
    return reimbursementData.filter((r: any) => r.employeeId === user?.id);
  }, [reimbursementData, user?.id]);

  // Server already filtered - no client filtering needed for approvals
  const pendingApprovals = reimbursementData;

  // Apply status filter (only if set)
  const filteredStaffData = useMemo(() => {
    if (!filters.status) return staffData;
    return staffData.filter((s: any) => s.status.toLowerCase() === filters.status);
  }, [staffData, filters.status]);

  const filteredRequests = useMemo(() => {
    const data = activeTab === 'approvals' ? pendingApprovals : myRequests;
    if (!filters.status) return data;
    return data.filter((r: any) => r.status === filters.status);
  }, [activeTab, pendingApprovals, myRequests, filters.status]);

  // Staff columns - compact
  const staffColumns: TableColumn[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'designation', title: 'Role' },
    { key: 'department', title: 'Dept' },
    {
      key: 'actions',
      title: '',
      width: 40,
      render: (_: any, row: any) => (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/hr/staff-detail/[id]', params: { id: row.id.toString() } } as any)}
          style={{ padding: 4 }}
        >
          <Ionicons name="eye-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      )
    },
  ];

  // Handlers
  const handleTabChange = (key: string) => {
    if (key === 'extensions') {
      // Navigate to dedicated extensions page
      router.push('/(modules)/hr/extensions' as any);
      return;
    }
    setActiveTab(key as TabType);
    setFilters({});
    setShowFilters(false);
  };

  const handleRowPress = (row: any) => {
    const navType = activeTab === 'staff' ? 'staff' : 'reimbursement';
    router.push({ pathname: `/(modules)/hr/[id]`, params: { id: row.id, type: navType } } as any);
  };

  const handleAddNew = () => {
    if (activeTab === 'staff') {
      router.push('/(modules)/hr/add-employee' as any);
    } else {
      router.push('/(modules)/hr/add-reimbursement' as any);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUsers(), refetchReimbursements()]);
    setRefreshing(false);
  }, [refetchUsers, refetchReimbursements]);

  // Approve/Reject handlers with confirmation dialog
  const handleApprove = (id: number, employeeName: string) => {
    console.log('🟢 Approve clicked for:', { id, employeeName });
    setConfirmDialog({
      visible: true,
      title: 'Approve Reimbursement',
      message: `Approve ${employeeName}'s request?`,
      confirmText: 'Approve',
      type: 'approve',
      onConfirm: () => performApprove(id, employeeName),
    });
  };

  const handleReject = (id: number, employeeName: string) => {
    console.log('🔴 Reject clicked for:', { id, employeeName });
    setConfirmDialog({
      visible: true,
      title: 'Reject Reimbursement',
      message: `Reject ${employeeName}'s request?`,
      confirmText: 'Reject',
      type: 'reject',
      onConfirm: () => performReject(id, employeeName),
    });
  };

  const performApprove = async (id: number, employeeName: string) => {
    console.log('✅ Performing approve for:', { id, employeeName });
    setConfirmDialog({ ...confirmDialog, visible: false });
    setProcessingId(id);

    try {
      console.log('📡 Calling mutateAsync with:', { id, status: 'approved' });
      await updateReimbursementStatus.mutateAsync({ id, status: 'approved', reason: 'Approved' });
      console.log('✅ Approve successful');
      // Query will auto-refetch due to mutation, no manual refetch needed
    } catch (error) {
      console.error('❌ Approve failed:', error);
      Alert.alert('Error', 'Failed to approve reimbursement');
    } finally {
      setProcessingId(null);
    }
  };

  const performReject = async (id: number, employeeName: string) => {
    console.log('❌ Performing reject for:', { id, employeeName });
    setConfirmDialog({ ...confirmDialog, visible: false });
    setProcessingId(id);

    try {
      console.log('📡 Calling mutateAsync with:', { id, status: 'rejected' });
      await updateReimbursementStatus.mutateAsync({ id, status: 'rejected', reason: 'Rejected' });
      console.log('✅ Reject successful');
      // Query will auto-refetch due to mutation, no manual refetch needed
    } catch (error) {
      console.error('❌ Reject failed:', error);
      Alert.alert('Error', 'Failed to reject reimbursement');
    } finally {
      setProcessingId(null);
    }
  };

  // Render Reimbursement Card - Compact Design
  const renderReimbursementCard = (item: any, showActions: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: theme.surface }]}
    >
      {/* Compact Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{item.employee}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{item.type}</Text>
        </View>
        <Badge label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} status={item.status as any} size="sm" />
      </View>

      {/* Compact Info Row */}
      <View style={styles.cardRow}>
        <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '700' }}>₹{item.amount.toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{item.date}</Text>
          {item.hasBill && <Ionicons name="document-attach" size={12} color={theme.primary} style={{ marginLeft: 4 }} />}
        </View>
      </View>

      {/* Compact Action Buttons */}
      {showActions && item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: processingId === item.id ? '#6b7280' : '#ef4444' }]}
            onPress={(e) => { e.stopPropagation(); handleReject(item.id, item.employee); }}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: processingId === item.id ? '#6b7280' : '#10b981' }]}
            onPress={(e) => { e.stopPropagation(); handleApprove(item.id, item.employee); }}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'staff') {
      return (
        <View style={{ flex: 1 }}>
          {/* Search Row with Funnel Button */}
          <View style={{ flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' }}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.surface,
              borderRadius: 24,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}>
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                placeholder="Search staff..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, paddingVertical: 10, marginLeft: 8, color: theme.text, fontSize: 14 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowHireMenu(!showHireMenu)}
              style={{
                backgroundColor: showHireMenu ? theme.primary : theme.surface,
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: showHireMenu ? theme.primary : theme.border,
              }}
            >
              <Ionicons name="funnel" size={18} color={showHireMenu ? "#fff" : theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Inline Dropdown - Light, No Absolute */}
          {showHireMenu && (
            <View style={{ marginHorizontal: 12, marginBottom: 8, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
              <TouchableOpacity onPress={() => { setShowHireMenu(false); setShowFilters(!showFilters); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                <Ionicons name="options-outline" size={18} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 14 }}>Filters</Text>
              </TouchableOpacity>
              {canAccessHireActions && (
                <>
                  <View style={{ height: 1, backgroundColor: theme.border }} />
                  <TouchableOpacity onPress={() => { setShowHireMenu(false); router.push('/(modules)/hr/pending-hires' as any); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                    <Ionicons name="hourglass-outline" size={18} color="#8B5CF6" />
                    <Text style={{ color: theme.text, fontSize: 14 }}>Pending Hires</Text>
                  </TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: theme.border }} />
                  <TouchableOpacity onPress={() => { setShowHireMenu(false); router.push('/(modules)/hr/invite-hire' as any); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                    <Ionicons name="person-add" size={18} color="#10B981" />
                    <Text style={{ color: theme.text, fontSize: 14 }}>Invite Hire</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Staff Table */}
          <Table
            data={filteredStaffData}
            columns={staffColumns}
            keyExtractor={(item: any) => item.id.toString()}
            onRowPress={handleRowPress}
            searchable={false}
          />
        </View>
      );
    }

    // My Requests or Pending Approvals
    const isApprovalsTab = activeTab === 'approvals';
    const data = filteredRequests;

    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {/* KPI Cards - Compact */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <KPICard title="Pending" value={reimbursementStats?.pending || 0} icon="time" color="#f59e0b" compact={true} />
            <KPICard title="Approved" value={reimbursementStats?.approved || 0} icon="checkmark-circle" color="#10b981" compact={true} />
            <KPICard title="Total" value={`₹${(reimbursementStats?.total_amount || 0).toLocaleString()}`} icon="cash" color="#3b82f6" compact={true} />
          </View>
        </ScrollView>

        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          {isApprovalsTab ? 'Pending Approvals' : 'My Requests'} ({data.length})
        </Text>

        {reimbursementsLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={100} style={{ borderRadius: 12 }} />
            <Skeleton height={100} style={{ borderRadius: 12 }} />
          </View>
        ) : data.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title={isApprovalsTab ? "No Pending Approvals" : "No Requests"}
            subtitle={isApprovalsTab ? "All reimbursements have been processed" : "You haven't submitted any requests yet"}
            action={!isApprovalsTab ? { label: 'Add Request', onPress: handleAddNew } : undefined}
          />
        ) : (
          <View style={{ gap: 12 }}>{data.map((item: any) => renderReimbursementCard(item, isApprovalsTab))}</View>
        )}
      </ScrollView>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Add button for My Requests */}
      <ModuleHeader
        title="HR Management"
        showNotifications={false}
        rightActions={
          activeTab === 'myrequests' ? (
            <TouchableOpacity
              onPress={handleAddNew}
              style={{ backgroundColor: theme.primary + '15', borderRadius: 8, padding: 6 }}
            >
              <Ionicons name="add" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabChange(tab.key)}
                style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
              >
                <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? theme.primary : theme.textSecondary} />
                <Text style={{ color: activeTab === tab.key ? theme.primary : theme.text, fontSize: 14, fontWeight: '600' }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filters */}
      {showFilters && (
        <FilterBar configs={getFilterConfigs() as any} activeFilters={filters} onFiltersChange={setFilters} />
      )}

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Confirmation Dialog */}
      {confirmDialog.visible && (
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>{confirmDialog.title}</Text>
            <Text style={[styles.dialogMessage, { color: theme.textSecondary }]}>{confirmDialog.message}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel, { borderColor: theme.border }]}
                onPress={() => setConfirmDialog({ ...confirmDialog, visible: false })}
              >
                <Text style={[styles.dialogButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogButton,
                  styles.dialogButtonConfirm,
                  { backgroundColor: confirmDialog.type === 'reject' ? '#ef4444' : '#10b981' }
                ]}
                onPress={confirmDialog.onConfirm}
              >
                <Text style={[styles.dialogButtonText, { color: '#fff' }]}>{confirmDialog.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { padding: 4, borderRadius: 8 },
  tabsContainer: { borderBottomWidth: 1 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  card: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 1, // Ensures consistent spacing in list
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  iconBtn: { padding: 6, borderRadius: 8 },
  hireActionsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3E8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  hireActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  hireActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  inviteBtn: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    borderWidth: 1,
  },
  dialogButtonConfirm: {
    // backgroundColor set dynamically
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Modern Pill-style Segment Control
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentBackground: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  segmentTabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  segmentLabelActive: {
    fontWeight: '600',
  },
});
