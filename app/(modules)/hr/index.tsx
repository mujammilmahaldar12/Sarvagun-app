/**
 * HR Management Screen
 * Updated with 3 tabs: Staff | My Requests | Pending Approvals
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAllUsers, useSearchEmployees, useReimbursements, useReimbursementStatistics, useUpdateReimbursementStatus } from '@/hooks/useHRQueries';
import { usePermissions } from '@/store/permissionStore';
import { Table, type TableColumn, Badge, KPICard, FilterBar, EmptyState, Skeleton, FAB } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import NotificationBell from '@/components/layout/NotificationBell';
import type { Reimbursement } from '@/types/hr';

type TabType = 'staff' | 'myrequests' | 'approvals';

export default function HRScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const permissions = usePermissions();

  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    type: 'approve' | 'reject' | null;
  }>({ visible: false, title: '', message: '', onConfirm: () => { }, confirmText: '', type: null });
  // Helper for button visibility
  const userRole = (user?.category || user?.role || '').toLowerCase();
  const canAccessHireActions = ['admin', 'hr', 'manager'].includes(userRole) || user?.is_team_leader;

  // Debug logs
  useEffect(() => {
    console.log('👤 HR Module User Debug:', {
      id: user?.id,
      username: user?.username,
      category: user?.category,
      role: user?.role,
      is_team_leader: user?.is_team_leader,
      computedRole: userRole,
      canAccessHireActions,
      activeTab,
    });
  }, [user, activeTab]);

  const [refreshing, setRefreshing] = useState(false);

  // API Hooks
  const { data: usersData, refetch: refetchUsers } = useAllUsers({ search: debouncedSearch || undefined });
  const { data: searchResults } = useSearchEmployees(debouncedSearch, {}, debouncedSearch.length > 1);
  const { data: reimbursementsData, isLoading: reimbursementsLoading, refetch: refetchReimbursements } = useReimbursements();
  const { data: reimbursementStats } = useReimbursementStatistics();
  const updateReimbursementStatus = useUpdateReimbursementStatus();

  // Permissions
  const canManage = permissions.hasPermission('hr:manage');
  // TODO: Add proper permission check for approval workflow
  const canApprove = permissions.hasPermission('leave:approve') || user?.category === 'hr' || user?.category === 'admin' || user?.category === 'manager';

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
      type: item.expense_details?.particulars || 'Expense',
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

  // Pending Approvals - show all pending (for approvers)
  const pendingApprovals = useMemo(() => {
    if (activeTab === 'approvals') {
      // Show only pending by default, unless filter is set
      if (!filters.status) {
        return reimbursementData.filter((r: any) => r.status === 'pending');
      }
    }
    return reimbursementData;
  }, [reimbursementData, activeTab, filters.status]);

  // Apply filters
  const filteredStaffData = useMemo(() => {
    if (!filters.status) return staffData;
    return staffData.filter((s: any) => s.status.toLowerCase() === filters.status);
  }, [staffData, filters.status]);

  const filteredRequests = useMemo(() => {
    const data = activeTab === 'approvals' ? pendingApprovals : myRequests;
    if (!filters.status) return data;
    return data.filter((r: any) => r.status === filters.status);
  }, [activeTab, pendingApprovals, myRequests, filters.status]);

  // Staff columns
  const staffColumns: TableColumn[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'designation', title: 'Role' },
    { key: 'department', title: 'Dept' },
    { key: 'status', title: 'Status', render: (v: string) => <Badge label={v} status={v.toLowerCase() as any} size="sm" /> },
    {
      key: 'actions',
      title: '',
      render: (_: any, row: any) => (
        <TouchableOpacity
          onPress={() => {
            console.log('View staff:', row.id);
            router.push({ pathname: '/hr/staff-detail/[id]', params: { id: row.id.toString() } } as any);
          }}
          style={{ padding: 8 }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.primary} />
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
      Alert.alert('Success', 'Reimbursement approved');
      refetchReimbursements();
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
      Alert.alert('Success', 'Reimbursement rejected');
      refetchReimbursements();
    } catch (error) {
      console.error('❌ Reject failed:', error);
      Alert.alert('Error', 'Failed to reject reimbursement');
    } finally {
      setProcessingId(null);
    }
  };

  // Render Reimbursement Card
  const renderReimbursementCard = (item: any, showActions: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleRowPress(item)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{item.employee}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>{item.type}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Badge label={item.status.charAt(0).toUpperCase() + item.status.slice(1)} status={item.status as any} size="sm" />
          {item.hasBill && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="document-attach" size={12} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: 10, marginLeft: 2 }}>Bill</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '700' }}>₹{item.amount.toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.date}</Text>
        </View>
      </View>
      {showActions && item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: processingId === item.id ? '#6b7280' : '#10b981' }]}
            onPress={(e) => { e.stopPropagation(); handleApprove(item.id, item.employee); }}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: processingId === item.id ? '#6b7280' : '#ef4444' }]}
            onPress={(e) => { e.stopPropagation(); handleReject(item.id, item.employee); }}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
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
          {/* Hire Actions Bar - visible for HR/Admin/Manager/Team Lead */}
          {canAccessHireActions && (
            <View style={styles.hireActionsBar}>
              <TouchableOpacity
                style={styles.hireActionBtn}
                onPress={() => router.push('/(modules)/hr/pending-hires' as any)}
              >
                <Ionicons name="hourglass-outline" size={18} color="#8B5CF6" />
                <Text style={styles.hireActionText}>Pending Hires</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hireActionBtn, styles.inviteBtn]}
                onPress={() => router.push('/(modules)/hr/invite-hire' as any)}
              >
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={[styles.hireActionText, { color: '#fff' }]}>Invite Hire</Text>
              </TouchableOpacity>
            </View>
          )}
          <Table
            data={filteredStaffData}
            columns={staffColumns}
            keyExtractor={(item: any) => item.id.toString()}
            onRowPress={handleRowPress}
            searchable={true}
            searchPlaceholder="Search staff..."
            onSearch={setSearchQuery}
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
        {/* KPI Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <KPICard title="Pending" value={reimbursementStats?.pending || 0} icon="time" color="#f59e0b" />
            <KPICard title="Approved" value={reimbursementStats?.approved || 0} icon="checkmark-circle" color="#10b981" />
            <KPICard title="Total" value={`₹${(reimbursementStats?.total_amount || 0).toLocaleString()}`} icon="cash" color="#3b82f6" />
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
      {/* Header */}
      <ModuleHeader
        title="HR Management"
        rightActions={
          <View style={styles.headerActions}>

            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name={showFilters ? "filter" : "filter-outline"} size={22} color={theme.text} />
            </TouchableOpacity>
            <NotificationBell size={22} color={theme.text} />
            {(activeTab === 'myrequests' || (activeTab === 'staff' && canManage)) && (
              <TouchableOpacity onPress={handleAddNew} style={[styles.addBtn, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="add" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
            {/* Hire Actions - only for HR/Admin/Manager */}
            {canAccessHireActions && activeTab === 'staff' && (
              <>
                <TouchableOpacity
                  onPress={() => router.push('/(modules)/hr/pending-hires' as any)}
                  style={[styles.iconBtn, { backgroundColor: theme.primary + '15' }]}
                >
                  <Ionicons name="hourglass-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(modules)/hr/invite-hire' as any)}
                  style={[styles.addBtn, { backgroundColor: '#10B981' }]}
                >
                  <Ionicons name="person-add" size={22} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
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
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
});
