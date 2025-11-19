import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Platform, StatusBar, Modal, Text, Pressable, ScrollView, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import AppTable, { TableColumn } from '@/components/ui/AppTable';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import StatusBadge from '@/components/ui/StatusBadge';

type TabType = 'staff' | 'reimbursement' | 'leave';

export default function HRScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const tableScrollRef = useRef<any>(null);

  // Check user role for permissions
  const canManage = ['admin', 'hr'].includes(user?.category || '');
  const canApprove = ['admin', 'hr', 'manager'].includes(user?.category || '');

  // Async search with debouncing
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => {
        clearTimeout(timer);
        setIsSearching(false);
      };
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Tabs configuration
  const tabs: Tab[] = [
    { key: 'staff', label: 'Staff', icon: 'people' },
    { key: 'reimbursement', label: 'Reimbursement', icon: 'cash' },
    { key: 'leave', label: 'Leave', icon: 'calendar' },
  ];

  // Mock data - replace with API calls
  const staffData = [
    { id: 1, name: 'John Doe', designation: 'Developer', department: 'IT', status: 'Active', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', designation: 'HR Manager', department: 'HR', status: 'Active', email: 'jane@example.com' },
    { id: 3, name: 'Mike Johnson', designation: 'Designer', department: 'Design', status: 'Active', email: 'mike@example.com' },
  ];

  const leaveData = [
    { id: 1, employee: 'John Doe', employeeId: 1, type: 'Casual Leave', from: '2025-11-25', to: '2025-11-27', days: 3, status: 'Pending', reason: 'Family function' },
    { id: 2, employee: 'Jane Smith', employeeId: 2, type: 'Sick Leave', from: '2025-11-20', to: '2025-11-21', days: 2, status: 'Approved', reason: 'Medical' },
    { id: 3, employee: 'Mike Johnson', employeeId: 3, type: 'Earned Leave', from: '2025-12-01', to: '2025-12-05', days: 5, status: 'Pending', reason: 'Vacation' },
  ];

  const reimbursementData = [
    { id: 1, employee: 'John Doe', employeeId: 1, type: 'Travel', amount: 5000, date: '2025-11-15', status: 'Pending', description: 'Client meeting travel' },
    { id: 2, employee: 'Jane Smith', employeeId: 2, type: 'Medical', amount: 2500, date: '2025-11-10', status: 'Approved', description: 'Health checkup' },
    { id: 3, employee: 'Mike Johnson', employeeId: 3, type: 'Food', amount: 800, date: '2025-11-18', status: 'Rejected', description: 'Team lunch' },
  ];

  // Column definitions
  const staffColumns: TableColumn[] = [
    { key: 'name', title: 'Name', sortable: true, width: 150 },
    { key: 'designation', title: 'Designation', sortable: true, width: 150 },
    { key: 'department', title: 'Department', sortable: true, width: 120 },
    { 
      key: 'status', 
      title: 'Status',
      width: 100,
      render: (value) => <StatusBadge status={value} type={value === 'Active' ? 'active' : 'inactive'} />
    },
  ];

  const leaveColumns: TableColumn[] = [
    { key: 'employee', title: 'Employee', sortable: true, width: 150 },
    { key: 'type', title: 'Leave Type', sortable: true, width: 120 },
    { key: 'from', title: 'From', sortable: true, width: 100 },
    { key: 'to', title: 'To', sortable: true, width: 100 },
    { key: 'days', title: 'Days', sortable: true, width: 60 },
    { 
      key: 'status', 
      title: 'Status',
      width: 100,
      render: (value) => <StatusBadge status={value} />
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
              handleApprove(row.id, 'leave');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Approve</Text>
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
              handleReject(row.id, 'leave');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Reject</Text>
          </Pressable>
        </View>
      ) : null
    } as TableColumn] : []),
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
      render: (value) => <StatusBadge status={value} />
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
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Approve</Text>
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
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Reject</Text>
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
      case 'leave':
        data = leaveData;
        break;
      case 'reimbursement':
        data = reimbursementData;
        break;
      default:
        data = [];
    }

    // Role-based filtering for leave and reimbursement
    if ((activeTab === 'leave' || activeTab === 'reimbursement') && user) {
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
      case 'leave': return leaveColumns;
      case 'reimbursement': return reimbursementColumns;
      default: return [];
    }
  };

  // Filter data with search and status
  const filteredData = useMemo(() => {
    let data: any[] = getCurrentData();

    // Apply search filter
    if (searchQuery.trim()) {
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
    } else if (activeTab === 'leave') {
      router.push('/(modules)/hr/apply-leave' as any);
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
            // TODO: Call API to approve
            console.log(`Approved ${type}:`, itemId);
            Alert.alert('Success', `${type} approved successfully`);
            // Refresh data after approval
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
            // TODO: Call API to reject
            console.log(`Rejected ${type}:`, itemId);
            Alert.alert('Success', `${type} rejected successfully`);
            // Refresh data after rejection
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
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
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
        <AppTable
          data={filteredData}
          columns={getCurrentColumns()}
          keyExtractor={(item: any) => item.id.toString()}
          onRowPress={handleRowPress}
          searchable={true}
          searchPlaceholder={`Search ${activeTab}...`}
          onSearch={handleSearchDebounced}
          onScroll={handleScroll}
        />
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
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: theme.colors.primary,
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
            <Ionicons name="arrow-up" size={24} color={theme.colors.primary} />
          </Pressable>
        )}

        {/* Add New Button */}
        {(canManage || activeTab !== 'staff') && (
          <FloatingActionButton onPress={handleAddNew} />
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
            style={{ backgroundColor: theme.colors.surface }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold"
                style={{ color: theme.colors.text }}
              >
                Filter by Status
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All */}
              <Pressable
                className="flex-row items-center p-4 rounded-xl mb-2"
                style={{
                  backgroundColor:
                    statusFilter === 'all'
                      ? `${theme.colors.primary}20`
                      : theme.colors.background,
                }}
                onPress={() => applyFilter('all')}
              >
                <Ionicons
                  name={statusFilter === 'all' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={
                    statusFilter === 'all'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  className="text-base font-semibold ml-3"
                  style={{
                    color:
                      statusFilter === 'all'
                        ? theme.colors.primary
                        : theme.colors.text,
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
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                    }}
                    onPress={() => applyFilter('active')}
                  >
                    <Ionicons
                      name={statusFilter === 'active' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'active'
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'active'
                            ? theme.colors.primary
                            : theme.colors.text,
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
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                    }}
                    onPress={() => applyFilter('inactive')}
                  >
                    <Ionicons
                      name={statusFilter === 'inactive' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'inactive'
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'inactive'
                            ? theme.colors.primary
                            : theme.colors.text,
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
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                    }}
                    onPress={() => applyFilter('pending')}
                  >
                    <Ionicons
                      name={statusFilter === 'pending' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'pending'
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'pending'
                            ? theme.colors.primary
                            : theme.colors.text,
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
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                    }}
                    onPress={() => applyFilter('approved')}
                  >
                    <Ionicons
                      name={statusFilter === 'approved' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'approved'
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'approved'
                            ? theme.colors.primary
                            : theme.colors.text,
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
                          ? `${theme.colors.primary}20`
                          : theme.colors.background,
                    }}
                    onPress={() => applyFilter('rejected')}
                  >
                    <Ionicons
                      name={statusFilter === 'rejected' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={
                        statusFilter === 'rejected'
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      className="text-base font-semibold ml-3"
                      style={{
                        color:
                          statusFilter === 'rejected'
                            ? theme.colors.primary
                            : theme.colors.text,
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
              style={{ backgroundColor: theme.colors.background }}
              onPress={clearFilters}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: theme.colors.textSecondary }}
              >
                Clear All Filters
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
