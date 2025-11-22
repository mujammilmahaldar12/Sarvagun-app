/**
 * Finance Management Screen
 * Professional implementation with real API integration
 * Follows Event Management patterns for consistency
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, Pressable, Modal, Alert, Platform, RefreshControl } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import SearchBar from '@/components/ui/SearchBar';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';

// Import modular components
import FinanceAnalytics from './components/FinanceAnalytics';
import SalesList from './components/SalesList';
import ExpensesList from './components/ExpensesList';
import InvoicesList from './components/InvoicesList';
import VendorsList from './components/VendorsList';

// Hooks for data fetching
import { useSales, useExpenses, financeCacheUtils } from '@/hooks/useFinanceQueries';

type TabType = 'analytics' | 'sales' | 'expenses' | 'invoices' | 'vendors';

export default function FinanceManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';

  // Fetch data for summary cards based on active tab
  const { data: salesData } = useSales({ status: selectedStatus !== 'all' ? selectedStatus : undefined });
  const { data: expensesData } = useExpenses({ status: selectedStatus !== 'all' ? selectedStatus : undefined });

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cache and refetch
      financeCacheUtils.clearAll();
      // Data will auto-refetch via React Query
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing finance data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle search with debouncing
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <FinanceAnalytics />;
      
      case 'sales':
        return (
          <SalesList
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            refreshing={refreshing}
          />
        );
      
      case 'expenses':
        return (
          <ExpensesList
            searchQuery={searchQuery}
            filterStatus={selectedStatus !== 'all' ? selectedStatus : undefined}
          />
        );
      
      case 'invoices':
        return (
          <InvoicesList
            searchQuery={searchQuery}
            filterStatus={selectedStatus !== 'all' ? selectedStatus : undefined}
          />
        );
      
      case 'vendors':
        return (
          <VendorsList
            searchQuery={searchQuery}
          />
        );
      
      default:
        return null;
    }
  };

  // Handle FAB press
  const handleAddNew = () => {
    switch (activeTab) {
      case 'sales':
        router.push('/(modules)/finance/add-sale' as any);
        break;
      case 'expenses':
        router.push('/(modules)/finance/add-expense' as any);
        break;
      case 'invoices':
        // router.push('/(modules)/finance/add-invoice' as any);
        Alert.alert('Coming Soon', 'Invoice creation will be available soon');
        break;
      case 'vendors':
        // router.push('/(modules)/finance/add-vendor' as any);
        Alert.alert('Coming Soon', 'Vendor creation will be available soon');
        break;
    }
  };

  // Tab configuration
  const tabs: Tab[] = [
    { key: 'analytics', label: 'Analytics', icon: 'analytics' as const },
    { key: 'sales', label: 'Sales', icon: 'trending-up' as const },
    { key: 'expenses', label: 'Expenses', icon: 'wallet' as const },
    { key: 'invoices', label: 'Invoices', icon: 'document-text' as const },
    { key: 'vendors', label: 'Vendors', icon: 'people' as const },
  ];

  // Status options based on tab
  const getStatusOptions = () => {
    switch (activeTab) {
      case 'sales':
        return [
          { label: 'All Status', value: 'all' },
          { label: 'Completed', value: 'completed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Not Yet', value: 'not_yet' },
        ];
      case 'expenses':
        return [
          { label: 'All Status', value: 'all' },
          { label: 'Paid', value: 'paid' },
          { label: 'Not Paid', value: 'not_paid' },
          { label: 'Partial Paid', value: 'partial_paid' },
        ];
      default:
        return [{ label: 'All Status', value: 'all' }];
    }
  };

  // Calculate summary totals for current tab
  const summaryTotals = useMemo(() => {
    if (activeTab === 'sales' && salesData) {
      const sales = Array.isArray(salesData) ? salesData : salesData.results || [];
      const total = sales.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const pending = sales
        .filter((item: any) => item.payment_status === 'pending' || item.payment_status === 'not_yet')
        .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const completed = sales
        .filter((item: any) => item.payment_status === 'completed')
        .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      return { total, pending, completed, label: 'Sales' };
    } else if (activeTab === 'expenses' && expensesData) {
      const expenses = Array.isArray(expensesData) ? expensesData : expensesData.results || [];
      const total = expenses.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const pending = expenses
        .filter((item: any) => item.payment_status === 'not_paid')
        .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const completed = expenses
        .filter((item: any) => item.payment_status === 'paid')
        .reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      return { total, pending, completed, label: 'Expenses' };
    }
    return { total: 0, pending: 0, completed: 0, label: 'Total' };
  }, [activeTab, salesData, expensesData]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <ModuleHeader
        title="Finance Management"
        rightActions={
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 8,
              backgroundColor: pressed ? theme.surface : 'transparent',
            })}
          >
            <Ionicons name="filter" size={24} color={theme.text} />
          </Pressable>
        }
      />

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Search Bar - Show for all tabs except analytics */}
      {activeTab !== 'analytics' && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={`Search ${activeTab}...`}
          />
        </View>
      )}

      {/* Summary Cards - Only show for sales and expenses tabs */}
      {(activeTab === 'sales' || activeTab === 'expenses') && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          <View style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            minWidth: 140,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
          }}>
            <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginBottom: 4 }}>
              Total {summaryTotals.label}
            </Text>
            <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.text }}>
              ₹{summaryTotals.total.toLocaleString('en-IN')}
            </Text>
          </View>
          
          <View style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            minWidth: 140,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B',
          }}>
            <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginBottom: 4 }}>
              Pending
            </Text>
            <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.text }}>
              ₹{summaryTotals.pending.toLocaleString('en-IN')}
            </Text>
          </View>
          
          <View style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            minWidth: 140,
            borderLeftWidth: 4,
            borderLeftColor: '#10B981',
          }}>
            <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginBottom: 4 }}>
              {activeTab === 'expenses' ? 'Paid' : 'Completed'}
            </Text>
            <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.text }}>
              ₹{summaryTotals.completed.toLocaleString('en-IN')}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Content with Pull-to-Refresh */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Floating Action Button - Hide for analytics tab */}
      {activeTab !== 'analytics' && canManage && (
        <View style={{ position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 80 }}>
          <FloatingActionButton onPress={handleAddNew} />
        </View>
      )}

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
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 20 }}>
                Filter {activeTab}
              </Text>

              {/* Status Filter */}
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginBottom: 10 }}>
                Status
              </Text>
              <View style={{ gap: 10, marginBottom: 20 }}>
                {getStatusOptions().map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedStatus(option.value)}
                    style={({ pressed }) => ({
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: selectedStatus === option.value ? theme.primary : theme.border,
                      backgroundColor: pressed
                        ? theme.primary + '10'
                        : selectedStatus === option.value
                        ? theme.primary + '20'
                        : 'transparent',
                    })}
                  >
                    <Text
                      style={{
                        color: selectedStatus === option.value ? theme.primary : theme.text,
                        fontWeight: selectedStatus === option.value ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => {
                    setSelectedStatus('all');
                    setSearchQuery('');
                    setFilterModalVisible(false);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: pressed ? theme.surface : 'transparent',
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Reset</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterModalVisible(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.primary + 'dd' : theme.primary,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: theme.textInverse, fontWeight: '600' }}>Apply</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
