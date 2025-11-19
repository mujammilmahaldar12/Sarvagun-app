import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, Pressable, Modal, Alert, Platform, Animated } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import AppTable from '@/components/ui/AppTable';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

type TabType = 'expenses' | 'sales';

// Mock data
const mockExpenses = [
  { id: 1, expenseType: 'Event', title: 'Annual Conference Catering', amount: 150000, date: '2024-03-15', category: 'Food & Beverage', status: 'approved', submittedBy: 'Sarah Wilson', approvedBy: 'Admin', eventId: 1, employeeId: 1 },
  { id: 2, expenseType: 'Normal', title: 'Office Supplies', amount: 15000, date: '2024-03-14', category: 'Supplies', status: 'pending', submittedBy: 'Mike Johnson', approvedBy: null, employeeId: 2 },
  { id: 3, expenseType: 'Reimbursement', title: 'Travel Reimbursement', amount: 8500, date: '2024-03-13', category: 'Travel', status: 'approved', submittedBy: 'John Doe', approvedBy: 'HR Manager', employeeId: 3 },
  { id: 4, expenseType: 'Event', title: 'Product Launch Venue', amount: 200000, date: '2024-03-12', category: 'Venue', status: 'pending', submittedBy: 'Sarah Wilson', approvedBy: null, eventId: 2, employeeId: 1 },
  { id: 5, expenseType: 'Normal', title: 'Software License', amount: 50000, date: '2024-03-11', category: 'Technology', status: 'rejected', submittedBy: 'Mike Johnson', approvedBy: 'Admin', employeeId: 2 },
];

const mockSales = [
  { id: 1, invoiceNumber: 'INV-2024-001', customerName: 'Tech Corp', productService: 'Enterprise Software License', amount: 500000, date: '2024-03-15', dueDate: '2024-04-15', status: 'paid', paymentMethod: 'Bank Transfer', salesPerson: 'Sarah Wilson', employeeId: 1 },
  { id: 2, invoiceNumber: 'INV-2024-002', customerName: 'Business Solutions', productService: 'Consulting Services', amount: 300000, date: '2024-03-14', dueDate: '2024-04-14', status: 'pending', paymentMethod: null, salesPerson: 'Mike Johnson', employeeId: 2 },
  { id: 3, invoiceNumber: 'INV-2024-003', customerName: 'Global Enterprises', productService: 'Annual Maintenance', amount: 150000, date: '2024-03-13', dueDate: '2024-04-13', status: 'overdue', paymentMethod: null, salesPerson: 'Sarah Wilson', employeeId: 1 },
  { id: 4, invoiceNumber: 'INV-2024-004', customerName: 'StartUp Inc', productService: 'Web Development', amount: 250000, date: '2024-03-12', dueDate: '2024-04-12', status: 'partial', paymentMethod: 'UPI', salesPerson: 'John Doe', employeeId: 3 },
];

export default function FinanceManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const scrollY = useRef(0);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canApprove = canManage || user?.designation === 'manager';

  // Get current data based on active tab with role-based filtering
  const getCurrentData = () => {
    let data: any[] = [];
    
    if (activeTab === 'expenses') {
      data = mockExpenses;
    } else {
      data = mockSales;
    }

    // Role-based filtering
    if (user?.category === 'intern' || user?.category === 'employee') {
      data = data.filter(item => item.employeeId === user.id);
    }

    return data;
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = getCurrentData();

    // Apply search filter
    if (searchQuery) {
      data = data.filter((item: any) => {
        const searchLower = searchQuery.toLowerCase();
        if (activeTab === 'expenses') {
          return (
            item.title?.toLowerCase().includes(searchLower) ||
            item.category?.toLowerCase().includes(searchLower) ||
            item.submittedBy?.toLowerCase().includes(searchLower) ||
            item.expenseType?.toLowerCase().includes(searchLower)
          );
        } else {
          return (
            item.invoiceNumber?.toLowerCase().includes(searchLower) ||
            item.customerName?.toLowerCase().includes(searchLower) ||
            item.productService?.toLowerCase().includes(searchLower) ||
            item.salesPerson?.toLowerCase().includes(searchLower)
          );
        }
      });
    }

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      data = data.filter((item: any) => item.status === selectedStatus);
    }

    // Apply expense type filter
    if (activeTab === 'expenses' && selectedExpenseType && selectedExpenseType !== 'all') {
      data = data.filter((item: any) => item.expenseType === selectedExpenseType);
    }

    return data;
  }, [activeTab, searchQuery, selectedStatus, selectedExpenseType, user]);

  // Expense columns
  const expenseColumns = [
    {
      key: 'expenseType',
      title: 'Type',
      sortable: true,
      width: 120,
      render: (item: any) => (
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: 
            item.expenseType === 'Event' ? '#DBEAFE' :
            item.expenseType === 'Reimbursement' ? '#FEF3C7' : '#E5E7EB',
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: 
              item.expenseType === 'Event' ? '#1E40AF' :
              item.expenseType === 'Reimbursement' ? '#92400E' : '#374151',
          }}>
            {item.expenseType}
          </Text>
        </View>
      ),
    },
    {
      key: 'title',
      title: 'Title',
      sortable: true,
      width: 180,
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (item: any) => `₹${item.amount?.toLocaleString('en-IN')}`,
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 110,
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      width: 120,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (item: any) => (
        <StatusBadge
          status={item.status}
        />
      ),
    },
    ...(canApprove ? [{
      key: 'actions',
      title: 'Actions',
      sortable: false,
      width: 180,
      render: (item: any) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {item.status === 'pending' && (
            <>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleApprove(item);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: pressed ? '#10B981' + 'dd' : '#10B981',
                  borderRadius: 6,
                })}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleReject(item);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: pressed ? '#EF4444' + 'dd' : '#EF4444',
                  borderRadius: 6,
                })}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Reject</Text>
              </Pressable>
            </>
          )}
        </View>
      ),
    }] : []),
  ];

  // Sales columns
  const salesColumns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice #',
      sortable: true,
      width: 130,
    },
    {
      key: 'customerName',
      title: 'Customer',
      sortable: true,
      width: 150,
    },
    {
      key: 'productService',
      title: 'Product/Service',
      sortable: true,
      width: 170,
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (item: any) => `₹${item.amount?.toLocaleString('en-IN')}`,
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 110,
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      sortable: true,
      width: 110,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (item: any) => (
        <StatusBadge
          status={item.status}
        />
      ),
    },
  ];

  const getCurrentColumns = () => {
    return activeTab === 'expenses' ? expenseColumns : salesColumns;
  };

  // Handlers
  const handleRowPress = (row: any) => {
    router.push({
      pathname: '/(modules)/finance/[id]',
      params: { id: row.id, type: activeTab },
    });
  };

  const handleAddNew = () => {
    if (activeTab === 'expenses') {
      router.push('/(modules)/finance/add-expense' as any);
    } else {
      router.push('/(modules)/finance/add-sale' as any);
    }
  };

  const handleApprove = (expense: any) => {
    Alert.alert(
      'Approve Expense',
      `Approve expense "${expense.title}" of ₹${expense.amount?.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            console.log('Approving expense:', expense);
            // API call here
          },
        },
      ]
    );
  };

  const handleReject = (expense: any) => {
    Alert.alert(
      'Reject Expense',
      `Reject expense "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            console.log('Rejecting expense:', expense);
            // API call here
          },
        },
      ]
    );
  };

  const handleSearchDebounced = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const scrollToTop = () => {
    setShowScrollTop(false);
    // Scroll functionality will be implemented with ref
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;
    
    if (offsetY > 200 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 200 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  const tabs = [
    { key: 'expenses' as TabType, label: 'Expenses', icon: 'wallet' as const },
    { key: 'sales' as TabType, label: 'Sales', icon: 'trending-up' as const },
  ];

  const statusOptions = activeTab === 'expenses'
    ? [
        { label: 'All Status', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ]
    : [
        { label: 'All Status', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Partial', value: 'partial' },
        { label: 'Overdue', value: 'overdue' },
      ];

  const expenseTypeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Event', value: 'Event' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Reimbursement', value: 'Reimbursement' },
  ];

  // Calculate totals
  const totals = useMemo(() => {
    const data = filteredData;
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const pending = data.filter(item => item.status === 'pending').reduce((sum, item) => sum + (item.amount || 0), 0);
    const approved = data.filter(item => item.status === 'approved' || item.status === 'paid').reduce((sum, item) => sum + (item.amount || 0), 0);
    
    return { total, pending, approved };
  }, [filteredData]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ModuleHeader
        title="Finance Management"
        rightActions={
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 8,
              backgroundColor: pressed ? theme.colors.surface : 'transparent',
            })}
          >
            <Ionicons name="filter" size={24} color={theme.colors.text} />
          </Pressable>
        }
      />

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Summary Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <View style={{
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: 12,
          minWidth: 140,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        }}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
            Total
          </Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
            ₹{totals.total.toLocaleString('en-IN')}
          </Text>
        </View>
        
        <View style={{
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: 12,
          minWidth: 140,
          borderLeftWidth: 4,
          borderLeftColor: '#F59E0B',
        }}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
            Pending
          </Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
            ₹{totals.pending.toLocaleString('en-IN')}
          </Text>
        </View>
        
        <View style={{
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderRadius: 12,
          minWidth: 140,
          borderLeftWidth: 4,
          borderLeftColor: '#10B981',
        }}>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
            {activeTab === 'expenses' ? 'Approved' : 'Paid'}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
            ₹{totals.approved.toLocaleString('en-IN')}
          </Text>
        </View>
      </ScrollView>

      {/* Content */}
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
        <FloatingActionButton onPress={handleAddNew} />
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
                Filter {activeTab}
              </Text>

              {/* Status Filter */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 }}>
                Status
              </Text>
              <View style={{ gap: 10, marginBottom: 20 }}>
                {statusOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedStatus(option.value)}
                    style={({ pressed }) => ({
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: selectedStatus === option.value ? theme.colors.primary : theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.primary + '10'
                        : selectedStatus === option.value
                        ? theme.colors.primary + '20'
                        : 'transparent',
                    })}
                  >
                    <Text
                      style={{
                        color: selectedStatus === option.value ? theme.colors.primary : theme.colors.text,
                        fontWeight: selectedStatus === option.value ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Expense Type Filter (only for expenses tab) */}
              {activeTab === 'expenses' && (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 }}>
                    Expense Type
                  </Text>
                  <View style={{ gap: 10, marginBottom: 20 }}>
                    {expenseTypeOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedExpenseType(option.value)}
                        style={({ pressed }) => ({
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: selectedExpenseType === option.value ? theme.colors.primary : theme.colors.border,
                          backgroundColor: pressed
                            ? theme.colors.primary + '10'
                            : selectedExpenseType === option.value
                            ? theme.colors.primary + '20'
                            : 'transparent',
                        })}
                      >
                        <Text
                          style={{
                            color: selectedExpenseType === option.value ? theme.colors.primary : theme.colors.text,
                            fontWeight: selectedExpenseType === option.value ? '600' : 'normal',
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => {
                    setSelectedStatus('all');
                    setSelectedExpenseType('all');
                    setFilterModalVisible(false);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surface : 'transparent',
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Reset</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterModalVisible(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.colors.primary + 'dd' : theme.colors.primary,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Apply</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
