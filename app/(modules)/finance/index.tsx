/**
 * Finance Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Includes Sales, Expenses, Invoices, and Vendors
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, BackHandler, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { FilterBar } from '@/components';
import { KPICard } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import financeService from '@/services/finance.service';
import { getTypographyStyle } from '@/utils/styleHelpers';
import NotificationBell from '@/components/layout/NotificationBell';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatters';

// Import modular components
import SalesList from './components/SalesList';
import ExpensesList from './components/ExpensesList';
import InvoicesList from './components/InvoicesList';
import VendorsList from './components/VendorsList';

type TabType = 'sales' | 'expenses' | 'invoices' | 'vendors';

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

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch statistics
  const { data: statistics, refetch: refetchStats } = useQuery({
    queryKey: ['financeStatistics'],
    queryFn: () => financeService.getFinanceStatistics(),
    staleTime: 10 * 60 * 1000,
  });

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

  // Handle pull-to-refresh for global stats
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        queryClient.invalidateQueries({ queryKey: [activeTab] })
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchStats, queryClient]);

  // Tab configuration
  const tabs: Tab[] = [
    { key: 'sales', label: 'Sales', icon: 'cash-outline' },
    { key: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
    { key: 'invoices', label: 'Invoices', icon: 'document-text-outline' },
    { key: 'vendors', label: 'Vendors', icon: 'people-outline' },
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
    // Optional: Reset filters or keep them if applicable
    // setFilters({});
  };

  const commonProps = {
    searchQuery,
    refreshing,
    onRefresh,
  };

  const headerComponent = (
    <View>
      {/* KPI Cards Carousel */}
      {statistics && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiContainer}
          contentContainerStyle={styles.kpiContent}
        >
          <KPICard
            title="Total Sales"
            value={formatCurrency(statistics.sales.total_amount || 0)}
            icon="trending-up"
            color="#10b981"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(statistics.expenses.total_amount || 0)}
            icon="trending-down"
            color="#ef4444"
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency((statistics.sales.total_amount || 0) - (statistics.expenses.total_amount || 0))}
            icon="analytics"
            color="#6366f1"
          />
          <KPICard
            title="Pending Sales"
            value={statistics.sales.pending_count || 0}
            icon="time"
            color="#f59e0b"
          />
        </ScrollView>
      )}

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
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Pass theme color via props if needed, simpler here
  },
  kpiContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
