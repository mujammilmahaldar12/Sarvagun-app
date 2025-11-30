import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Platform, StatusBar, Modal, Text, Pressable, ScrollView, Alert, Animated as RNAnimated, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useAllUsers, useSearchEmployees, useReimbursements, useReimbursementStatistics, useUpdateReimbursementStatus } from '@/hooks/useHRQueries';
import { usePermissions } from '@/store/permissionStore';
import { Input, Table, type TableColumn, Badge, FAB } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { Reimbursement } from '@/types/hr';

type TabType = 'staff' | 'reimbursement';

export default function HRScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const tableScrollRef = useRef<any>(null);

  // Fetch all users from API
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useAllUsers({
    search: debouncedSearch || undefined,
  });
  
  // Search users when query is debounced
  const { data: searchResults, isLoading: searchLoading } = useSearchEmployees(
    debouncedSearch,
    {},
    debouncedSearch.length > 1
  );

  // Reimbursement data from API
  const { data: reimbursementsData, isLoading: reimbursementsLoading, refetch: refetchReimbursements } = useReimbursements();
  const { data: reimbursementStats } = useReimbursementStatistics();
  const updateReimbursementStatus = useUpdateReimbursementStatus();

  // Check user role for permissions
  const canManage = permissions.hasPermission('hr:manage');
  const canApprove = permissions.hasPermission('leave:approve') || user?.category === 'hr' || user?.category === 'admin';

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Tabs configuration
  const tabs: Tab[] = [
    { key: 'staff', label: 'Staff', icon: 'people' },
    { key: 'reimbursement', label: 'Reimbursement', icon: 'cash' },
  ];

  // Transform API users to staff data format
  const staffData = useMemo(() => {
    // Use search results if searching, otherwise use all users
    const users = debouncedSearch && searchResults?.results 
      ? searchResults.results 
      : usersData || [];
    
    return users.map((user: any) => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      designation: user.designation || 'N/A',
      department: user.department || 'N/A',
      status: user.is_active ? 'Active' : 'Inactive',
      email: user.email || 'N/A',
      category: user.category || 'employee',
      phone: user.mobileno || 'N/A',
      photo: user.photo,
    }));
  }, [usersData, searchResults, debouncedSearch]);

  // Transform API reimbursements to table data format
  const reimbursementData = useMemo(() => {
    const reimbursements = reimbursementsData?.results || [];
    
    return reimbursements.map((item: Reimbursement) => ({
      id: item.id,
      employee: item.requested_by_name || `User ${item.requested_by}`,
      employeeId: item.requested_by,
      type: item.expense_details?.particulars || 'Expense',
      amount: Number(item.reimbursement_amount) || 0,
      date: item.submitted_at ? new Date(item.submitted_at).toISOString().split('T')[0] : 'N/A',
      status: (item.latest_status?.status || item.status || 'pending').charAt(0).toUpperCase() + 
              (item.latest_status?.status || item.status || 'pending').slice(1),
      description: item.details || 'No description',
      bill_evidence: item.bill_evidence,
    }));
  }, [reimbursementsData]);

  // Column definitions
  const staffColumns: TableColumn[] = [
    { key: 'name', title: 'Name', sortable: true, width: 150 },
    { key: 'designation', title: 'Designation', sortable: true, width: 150 },
    { key: 'department', title: 'Department', sortable: true, width: 120 },
    { key: 'category', title: 'Category', sortable: true, width: 100 },
    { 
      key: 'status', 
      title: 'Status',
      width: 100,
      render: (value) => <Badge label={value} status={value === 'Active' ? 'active' : 'inactive'} size="sm" />
    },
  ];

  const reimbursementColumns: TableColumn[] = [
    { key: 'employee', title: 'Employee', sortable: true, width: 150 },
    { key: 'type', title: 'Type', sortable: true, width: 100 },
    { 
      key: 'amount', 
      title: 'Amount', 
      sortable: true,
      width: 100,
      render: (value) => `₹${value.toLocaleString()}`
    },
    { key: 'date', title: 'Date', sortable: true, width: 100 },
    { 
      key: 'status', 
      title: 'Status',
      width: 100,
      render: (value) => <Badge label={value} status={value} size="sm" />
    },
    ...(canApprove ? [{
      key: 'actions',
      title: 'Actions',
      width: 160,
      render: (value: any, row: any) => row.status === 'Pending' ? (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
            onPress={(e) => {
              e.stopPropagation();
              handleApprove(row.id, 'reimbursement');
            }}
          >
            <Text style={{ color: theme.textInverse, ...getTypographyStyle('xs', 'semibold') }}>Approve</Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
            onPress={(e) => {
              e.stopPropagation();
              handleReject(row.id, 'reimbursement');
            }}
          >
            <Text style={{ color: theme.textInverse, ...getTypographyStyle('xs', 'semibold') }}>Reject</Text>
          </Pressable>
        </View>
      ) : null
    } as TableColumn] : []),
  ];

  const getCurrentData = () => {
    let data: any[];
    
    switch (activeTab) {
      case 'staff':
        data = staffData;
        break;
      case 'reimbursement':
        data = reimbursementData;
        break;
      default:
        data = [];
    }

    // Role-based filtering for reimbursement
    if (activeTab === 'reimbursement' && user) {
      // If user is intern/employee, show only their own items
      if (user.category === 'intern' || user.category === 'employee') {
        data = data.filter((item: any) => item.employeeId === user.id);
      }
      // If user is manager/team lead, show their team's items + their own
      // TODO: Implement team filtering when team data is available
      // For now, hr/admin see all, others see their own
      else if (user.category === 'manager') {
        // In production: filter by team
        // data = data.filter((item: any) => item.teamId === user.teamId || item.employeeId === user.id);
      }
      // hr/admin see all items (no filtering)
    }

    return data;
  };

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'staff': return staffColumns;
      case 'reimbursement': return reimbursementColumns;
      default: return [];
    }
  };

  // Filter data with search and status
  const filteredData = useMemo(() => {
    let data: any[] = getCurrentData();

    // For staff tab, search is handled by API, only filter locally for other tabs
    if (activeTab !== 'staff' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item: any) => {
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      data = data.filter((item: any) => 
        item.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return data;
  }, [activeTab, statusFilter, searchQuery]);

  const handleRowPress = (row: any) => {
    console.log('Row pressed:', row);
    // Navigate to detail screen with type
    router.push({
      pathname: `/(modules)/hr/[id]`,
      params: { id: row.id, type: activeTab }
    } as any);
  };

  const handleAddNew = () => {
    console.log('Add new:', activeTab);
    
    // Navigate to appropriate add screen based on active tab
    if (activeTab === 'staff') {
      router.push('/(modules)/hr/add-employee' as any);
    } else if (activeTab === 'reimbursement') {
      router.push('/(modules)/hr/add-reimbursement' as any);
    }
  };

  const handleSearchDebounced = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleApprove = (itemId: number, type: 'leave' | 'reimbursement') => {
    Alert.alert(
      'Approve',
      `Are you sure you want to approve this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            if (type === 'reimbursement') {
              try {
                await updateReimbursementStatus.mutateAsync({
                  id: itemId,
                  status: 'approved',
                  reason: 'Approved by admin/HR',
                });
                Alert.alert('Success', 'Reimbursement approved successfully');
                refetchReimbursements();
              } catch (error) {
                console.error('Error approving reimbursement:', error);
                Alert.alert('Error', 'Failed to approve reimbursement');
              }
            } else {
              // TODO: Call API to approve leave
              console.log(`Approved ${type}:`, itemId);
              Alert.alert('Success', `${type} approved successfully`);
            }
          },
        },
      ]
    );
  };

  const handleReject = (itemId: number, type: 'leave' | 'reimbursement') => {
    Alert.alert(
      'Reject',
      `Are you sure you want to reject this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            if (type === 'reimbursement') {
              try {
                await updateReimbursementStatus.mutateAsync({
                  id: itemId,
                  status: 'rejected',
                  reason: 'Rejected by admin/HR',
                });
                Alert.alert('Success', 'Reimbursement rejected');
                refetchReimbursements();
              } catch (error) {
                console.error('Error rejecting reimbursement:', error);
                Alert.alert('Error', 'Failed to reject reimbursement');
              }
            } else {
              // TODO: Call API to reject leave
              console.log(`Rejected ${type}:`, itemId);
              Alert.alert('Success', `${type} rejected successfully`);
            }
          },
        },
      ]
    );
  };

  const scrollToTop = () => {
    // Scroll AppTable to top via prop or direct ref
    setShowScrollTop(false);
    // Scroll will be handled by AppTable ref if needed
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Show scroll-to-top button when scrolled down more than 200px
    setShowScrollTop(offsetY > 200);
    // Track if at top to control refresh
    setIsAtTop(offsetY <= 0);
  };

  const handleFilter = () => {
    setFilterModalVisible(true);
  };

  const applyFilter = (status: string) => {
    setStatusFilter(status);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setFilterModalVisible(false);
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      className="flex-1" 
      style={{ backgroundColor: theme.background }}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      {/* Header */}
      <ModuleHeader
        title="HR Management"
        onFilter={handleFilter}
      />

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Content - Fixed flex container */}
      <View style={{ flex: 1 }}>
        {activeTab === 'reimbursement' ? (
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Reimbursement Statistics */}
            {reimbursementStats && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 12 }}>
                  Overview
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <StatCard
                    label="Total Requests"
                    value={reimbursementStats.total}
                    icon="documents"
                    color="#8B5CF6"
                    theme={theme}
                  />
                  <StatCard
                    label="Pending"
                    value={reimbursementStats.pending}
                    icon="time"
                    color="#F59E0B"
                    theme={theme}
                  />
                  <StatCard
                    label="Approved"
                    value={reimbursementStats.approved}
                    icon="checkmark-circle"
                    color="#10B981"
                    theme={theme}
                  />
                  <StatCard
                    label="Completed"
                    value={reimbursementStats.done}
                    icon="checkmark-done-circle"
                    color="#3B82F6"
                    theme={theme}
                  />
                </View>
                
                {/* Amount Summary */}
                <View style={{ 
                  flexDirection: 'row', 
                  gap: 12, 
                  marginTop: 12,
                }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: theme.surface,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}>
                    <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                      Total Amount
                    </Text>
                    <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.text }}>
                      ₹{reimbursementStats.total_amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: `${theme.warning}10`,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.warning,
                  }}>
                    <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                      Pending Amount
                    </Text>
                    <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.warning }}>
                      ₹{reimbursementStats.pending_amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Loading State */}
            {reimbursementsLoading && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Loading reimbursements...</Text>
              </View>
            )}

            {/* Reimbursement List */}
            {!reimbursementsLoading && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 12 }}>
                  Reimbursement Requests ({reimbursementData.length})
                </Text>
                
                {reimbursementData.length === 0 ? (
                  <View style={{
                    backgroundColor: theme.surface,
                    padding: 32,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}>
                    <Ionicons name="cash-outline" size={48} color={theme.textSecondary} />
                    <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginTop: 12 }}>
                      No Reimbursements Found
                    </Text>
                    <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
                      {canApprove ? 'No reimbursement requests have been submitted yet.' : 'You haven\'t submitted any reimbursement requests yet.'}
                    </Text>
                  </View>
                ) : (
                  reimbursementData.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleRowPress(item)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? `${theme.primary}10` : theme.surface,
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                      })}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
                            {item.employee}
                          </Text>
                          <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 2 }}>
                            {item.type}
                          </Text>
                        </View>
                        <Badge 
                          label={item.status} 
                          status={item.status.toLowerCase() as any} 
                          size="sm" 
                        />
                      </View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.primary }}>
                          ₹{item.amount.toLocaleString()}
                        </Text>
                        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                          {item.date}
                        </Text>
                      </View>
                      
                      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 8 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                      
                      {/* Action Buttons for HR/Admin */}
                      {canApprove && item.status.toLowerCase() === 'pending' && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <Pressable
                            style={{
                              flex: 1,
                              backgroundColor: '#10B981',
                              paddingVertical: 10,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleApprove(item.id, 'reimbursement');
                            }}
                          >
                            <Text style={{ color: '#fff', ...getTypographyStyle('sm', 'semibold') }}>Approve</Text>
                          </Pressable>
                          <Pressable
                            style={{
                              flex: 1,
                              backgroundColor: '#EF4444',
                              paddingVertical: 10,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleReject(item.id, 'reimbursement');
                            }}
                          >
                            <Text style={{ color: '#fff', ...getTypographyStyle('sm', 'semibold') }}>Reject</Text>
                          </Pressable>
                        </View>
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        ) : (
          <Table
            data={filteredData}
            columns={getCurrentColumns()}
            keyExtractor={(item: any) => item.id.toString()}
            onRowPress={handleRowPress}
            searchable={true}
            searchPlaceholder={`Search ${activeTab}...`}
            onSearch={handleSearchDebounced}
            onScroll={handleScroll}
          />
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={{ position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 80 }}>
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Pressable
            onPress={scrollToTop}
            style={({ pressed }) => ({
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.surface,
              borderWidth: 2,
              borderColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-up" size={24} color={theme.primary} />
          </Pressable>
        )}

        {/* Add New Button */}
        {(canManage || activeTab !== 'staff') && (
          <FAB
            icon="add"
            onPress={handleAddNew}
            position="bottom-right"
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: theme.surface }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.text }}
              >
                Filter by Status
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All */}
              <Pressable
                className="flex-row items-center p-4 rounded-xl mb-2"
                style={{
                  backgroundColor:
                    statusFilter === 'all'
                      ? `${theme.primary}20`
                      : theme.background,
                }}
                onPress={() => applyFilter('all')}
              >
                <Ionicons
                  name={statusFilter === 'all' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={
                    statusFilter === 'all'
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  className="text-base font-semibold ml-3"
                  style={{
                    color:
                      statusFilter === 'all'
                        ? theme.primary
                        : theme.text,
                  }}
                >
                  All {activeTab === 'staff' ? 'Staff' : activeTab}
                </Text>
              </Pressable>

              {/* Status filters based on active tab */}
              {activeTab === 'staff' ? (
                <>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl mb-2"
                    style={{
                      backgroundColor:
                        statusFilter === 'active'
                          ? `${theme.primary}20`
                          : theme.background,
                    }}
                    onPress={() => applyFilter('active')}
                  >
                    <Ionicons
                      name={statusFilter === 'active' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'active'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'active'
                            ? theme.primary
                            : theme.text,
                      }}
                    >
                      Active
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl mb-2"
                    style={{
                      backgroundColor:
                        statusFilter === 'inactive'
                          ? `${theme.primary}20`
                          : theme.background,
                    }}
                    onPress={() => applyFilter('inactive')}
                  >
                    <Ionicons
                      name={statusFilter === 'inactive' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'inactive'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'inactive'
                            ? theme.primary
                            : theme.text,
                      }}
                    >
                      Inactive
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl mb-2"
                    style={{
                      backgroundColor:
                        statusFilter === 'pending'
                          ? `${theme.primary}20`
                          : theme.background,
                    }}
                    onPress={() => applyFilter('pending')}
                  >
                    <Ionicons
                      name={statusFilter === 'pending' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'pending'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'pending'
                            ? theme.primary
                            : theme.text,
                      }}
                    >
                      Pending
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl mb-2"
                    style={{
                      backgroundColor:
                        statusFilter === 'approved'
                          ? `${theme.primary}20`
                          : theme.background,
                    }}
                    onPress={() => applyFilter('approved')}
                  >
                    <Ionicons
                      name={statusFilter === 'approved' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'approved'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'approved'
                            ? theme.primary
                            : theme.text,
                      }}
                    >
                      Approved
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-row items-center p-4 rounded-xl mb-2"
                    style={{
                      backgroundColor:
                        statusFilter === 'rejected'
                          ? `${theme.primary}20`
                          : theme.background,
                    }}
                    onPress={() => applyFilter('rejected')}
                  >
                    <Ionicons
                      name={statusFilter === 'rejected' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'rejected'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'rejected'
                            ? theme.primary
                            : theme.text,
                      }}
                    >
                      Rejected
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            {/* Clear Filters Button */}
            <Pressable
              className="mt-4 p-4 rounded-xl items-center"
              style={{ backgroundColor: theme.background }}
              onPress={clearFilters}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textSecondary }}
              >
                Clear All Filters
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

// Helper component for statistics cards
function StatCard({
  label,
  value,
  icon,
  color,
  theme,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  theme: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 150,
        backgroundColor: theme.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${color}20`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...getTypographyStyle('2xl', 'bold'), color: theme.text }}>
            {value}
          </Text>
        </View>
      </View>
      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}
