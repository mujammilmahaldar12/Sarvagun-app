/**
 * Finance Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Includes Sales, Expenses, Invoices, Vendors, and Analytics
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, BackHandler, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { FilterBar, KPICard } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import NotificationBell from '@/components/layout/NotificationBell';
import { useQueryClient } from '@tanstack/react-query';
import { useSales, useExpenses } from '@/hooks/useFinanceQueries';
import { formatCurrency } from '@/utils/formatters';

// Import modular components
import SalesList from './components/SalesList';
import ExpensesList from './components/ExpensesList';
import InvoicesList from './components/InvoicesList';
import VendorsList from './components/VendorsList';
import FinanceAnalytics from './components/FinanceAnalytics';

type TabType = 'analytics' | 'sales' | 'expenses' | 'invoices' | 'vendors';

interface Tab {
  key: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function FinanceManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // UI State - Default to Sales tab
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data for KPI cards (uses same React Query cache as FinanceAnalytics)
  const { data: salesData } = useSales();
  const { data: expensesData } = useExpenses();

  // Calculate KPI statistics from actual data
  const kpiStats = useMemo(() => {
    const sales = (salesData as any)?.results || (Array.isArray(salesData) ? salesData : []);
    const expenses = (expensesData as any)?.results || (Array.isArray(expensesData) ? expensesData : []);

    const totalSalesAmount = sales.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
    const totalDiscount = sales.reduce((sum: number, s: any) => sum + Number(s.discount || 0), 0);
    const totalExpensesAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const pendingSalesCount = sales.filter((s: any) => s.payment_status === 'pending' || s.payment_status === 'not_yet').length;

    return {
      totalSales: totalSalesAmount - totalDiscount,
      totalExpenses: totalExpensesAmount,
      netProfit: (totalSalesAmount - totalDiscount) - totalExpensesAmount,
      pendingSales: pendingSalesCount,
    };
  }, [salesData, expensesData]);

  // Handle back button on Android
  const navigation = useNavigation();
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

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['vendors'] });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Tab configuration
  const tabs: Tab[] = [
    { key: 'sales', label: 'Sales', icon: 'cash-outline' },
    { key: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { key: 'invoices', label: 'Invoices', icon: 'document-text-outline' },
    { key: 'vendors', label: 'Vendors', icon: 'people-outline' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
  ];

  // Filter configuration based on active tab
  const getFilterConfigs = () => {
    if (activeTab === 'sales') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel' as const,
          type: 'select' as const,
          options: [
            { label: 'Completed', value: 'completed', color: '#10b981' },
            { label: 'Pending', value: 'pending', color: '#f59e0b' },
            { label: 'Not Yet', value: 'not_yet', color: '#ef4444' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline' as const,
          type: 'daterange' as const,
        },
      ];
    } else if (activeTab === 'expenses') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel' as const,
          type: 'select' as const,
          options: [
            { label: 'Paid', value: 'paid', color: '#10b981' },
            { label: 'Partial', value: 'partial_paid', color: '#f59e0b' },
            { label: 'Not Paid', value: 'not_paid', color: '#ef4444' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline' as const,
          type: 'daterange' as const,
        },
      ];
    } else if (activeTab === 'invoices') {
      return [
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline' as const,
          type: 'daterange' as const,
        },
      ];
    } else if (activeTab === 'vendors') {
      return [
        {
          key: 'category',
          label: 'Category',
          icon: 'layers-outline' as const,
          type: 'select' as const,
          options: [
            { label: 'Equipment Supplier', value: 'Equipment Supplier' },
            { label: 'Service Provider', value: 'Service Provider' },
            { label: 'Venue Partner', value: 'Venue Partner' },
            { label: 'Others', value: 'Other' },
          ]
        }
      ];
    }
    return [];
  };

  const handleTabChange = (key: TabType) => {
    setActiveTab(key);
  };

  const commonProps = {
    searchQuery,
    refreshing,
    onRefresh,
  };

  // Header with KPI cards and tabs
  const headerComponent = (
    <View>
      {/* KPI Cards Carousel */}
      {activeTab !== 'analytics' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiContainer}
          contentContainerStyle={styles.kpiContent}
        >
          <KPICard
            title="Total Sales"
            value={formatCurrency(kpiStats.totalSales)}
            icon="trending-up"
            color="#10b981"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(kpiStats.totalExpenses)}
            icon="trending-down"
            color="#ef4444"
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency(kpiStats.netProfit)}
            icon="analytics"
            color={kpiStats.netProfit >= 0 ? "#6366f1" : "#ef4444"}
          />
          <KPICard
            title="Pending Sales"
            value={kpiStats.pendingSales}
            icon="time"
            color="#f59e0b"
          />
        </ScrollView>
      )}

      {/* Tab Navigation */}
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
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? theme.primary : theme.text },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {showFilters && getFilterConfigs().length > 0 && (
        <FilterBar
          configs={getFilterConfigs() as any}
          activeFilters={filters}
          onFiltersChange={setFilters}
        />
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {headerComponent}
            <FinanceAnalytics />
          </ScrollView>
        );
      case 'sales':
        return (
          <SalesList
            {...commonProps}
            selectedStatus={filters.status}
            dateRange={filters.dateRange}
            headerComponent={headerComponent}
          />
        );
      case 'expenses':
        return (
          <ExpensesList
            {...commonProps}
            selectedStatus={filters.status}
            dateRange={filters.dateRange}
            headerComponent={headerComponent}
          />
        );
      case 'invoices':
        return (
          <InvoicesList
            {...commonProps}
            dateRange={filters.dateRange}
            headerComponent={headerComponent}
          />
        );
      case 'vendors':
        return (
          <VendorsList
            {...commonProps}
            selectedCategory={filters.category}
            headerComponent={headerComponent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <ModuleHeader
        title="Finance Management"
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name={showFilters ? "filter" : "filter-outline"} size={22} color={theme.text} />
            </TouchableOpacity>
            <NotificationBell size={22} color={theme.text} />
            {['sales', 'expenses', 'invoices', 'vendors'].includes(activeTab) && (
              <TouchableOpacity
                onPress={() => {
                  if (activeTab === 'sales') router.push('/(modules)/finance/add-sale');
                  if (activeTab === 'expenses') router.push('/(modules)/finance/add-expense');
                  if (activeTab === 'invoices') router.push('/(modules)/finance/add-invoice');
                  if (activeTab === 'vendors') router.push('/(modules)/finance/add-vendor');
                }}
                style={{
                  padding: 4,
                  backgroundColor: theme.primary + '15',
                  borderRadius: 8,
                }}
              >
                <Ionicons name="add" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
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
  kpiContainer: {
    maxHeight: 130,
  },
  kpiContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
});
