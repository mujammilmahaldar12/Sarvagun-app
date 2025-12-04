/**
 * Finance Management Screen with Pagination
 * Shows combined Sales + Expenses with Load More functionality
 * Following Leads Management pattern for consistency
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import financeService from '@/services/finance.service';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { KPICard, EmptyState, LoadingState, FilterBar } from '@/components';
import type { Sale, Expense, FinanceStatistics } from '@/types/finance';
import { formatDate, formatCurrency } from '@/utils/formatters';

type FinanceTab = 'all' | 'sales' | 'expenses' | 'invoices';
type FinanceItem = (Sale | Expense) & { itemType: 'sale' | 'expense' };

export default function FinanceManagementScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FinanceTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [salesPage, setSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [pageSize] = useState(50);
  const [allItems, setAllItems] = useState<FinanceItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch sales with pagination
  const {
    data: salesResponse,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['sales', filters, salesPage, pageSize, debouncedSearch],
    queryFn: async () => {
      const response = await financeService.getSales({
        payment_status: filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
        search: debouncedSearch || undefined,
        page: salesPage,
        page_size: pageSize,
      });
      return response;
    },
    enabled: activeTab === 'all' || activeTab === 'sales',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch expenses with pagination
  const {
    data: expensesResponse,
    isLoading: expensesLoading,
    error: expensesError,
  } = useQuery({
    queryKey: ['expenses', filters, expensesPage, pageSize, debouncedSearch],
    queryFn: async () => {
      const response = await financeService.getExpenses({
        payment_status: filters.status,
        vendor: filters.vendor,
        date_from: filters.date_from,
        date_to: filters.date_to,
        search: debouncedSearch || undefined,
        page: expensesPage,
        page_size: pageSize,
      });
      return response;
    },
    enabled: activeTab === 'all' || activeTab === 'expenses',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['financeStatistics'],
    queryFn: () => financeService.getFinanceStatistics(),
    staleTime: 10 * 60 * 1000,
  });

  // Combine and process items
  React.useEffect(() => {
    const newItems: FinanceItem[] = [];

    if (activeTab === 'all' || activeTab === 'sales') {
      const salesItems = (salesResponse?.results || []).map(sale => ({
        ...sale,
        itemType: 'sale' as const,
      }));
      newItems.push(...salesItems);
    }

    if (activeTab === 'all' || activeTab === 'expenses') {
      const expenseItems = (expensesResponse?.results || []).map(expense => ({
        ...expense,
        itemType: 'expense' as const,
      }));
      newItems.push(...expenseItems);
    }

    // Sort by date
    newItems.sort((a, b) => {
      const dateA = 'date' in a ? new Date(a.date) : new Date(a.expense_date);
      const dateB = 'date' in b ? new Date(b.date) : new Date(b.expense_date);
      return dateB.getTime() - dateA.getTime();
    });

    if (salesPage === 1 && expensesPage === 1) {
      setAllItems(newItems);
    } else {
      setAllItems(prev => [...prev, ...newItems]);
    }
  }, [salesResponse, expensesResponse, activeTab, salesPage, expensesPage]);

  const isLoading = salesLoading || expensesLoading;
  const error = salesError || expensesError;

  // Load more function
  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);

    if (activeTab === 'sales' && salesResponse?.next) {
      setSalesPage(prev => prev + 1);
    } else if (activeTab === 'expenses' && expensesResponse?.next) {
      setExpensesPage(prev => prev + 1);
    } else if (activeTab === 'all') {
      if (salesResponse?.next) setSalesPage(prev => prev + 1);
      if (expensesResponse?.next) setExpensesPage(prev => prev + 1);
    }

    setTimeout(() => setLoadingMore(false), 500);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setSalesPage(1);
    setExpensesPage(1);
  }, [activeTab, filters, debouncedSearch]);

  // Tab configuration
  const tabs: Array<{ key: FinanceTab; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }> = [
    { key: 'all', label: 'All', icon: 'list', count: (statistics?.total_sales || 0) + (statistics?.total_expenses || 0) },
    { key: 'sales', label: 'Sales', icon: 'cash', count: statistics?.total_sales },
    { key: 'expenses', label: 'Expenses', icon: 'receipt', count: statistics?.total_expenses },
    { key: 'invoices', label: 'Invoices', icon: 'document-text', count: statistics?.total_invoices },
  ];

  const handleAddFinance = () => {
    if (activeTab === 'sales') {
      router.push('/(modules)/finance/add-sale');
    } else if (activeTab === 'expenses') {
      router.push('/(modules)/finance/add-expense');
    } else if (activeTab === 'invoices') {
      router.push('/(modules)/finance/add-invoice');
    }
  };

  const handleItemDetails = (item: FinanceItem) => {
    if (item.itemType === 'sale') {
      router.push(`/(modules)/finance/${item.id}?type=sale` as any);
    } else {
      router.push(`/(modules)/finance/expense-detail/${item.id}` as any);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return '#10b981';
      case 'pending':
      case 'partial_paid':
        return '#f59e0b';
      case 'not_yet':
      case 'not_paid':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['financeStatistics'] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Finance Management</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Track sales and expenses
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddFinance}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics KPIs */}
      {statistics && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiContainer}
          contentContainerStyle={styles.kpiContent}
        >
          <KPICard
            title="Total Sales"
            value={formatCurrency(statistics.total_sales_amount || 0)}
            icon="trending-up"
            color="#10b981"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(statistics.total_expenses_amount || 0)}
            icon="trending-down"
            color="#ef4444"
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency((statistics.total_sales_amount || 0) - (statistics.total_expenses_amount || 0))}
            icon="analytics"
            color="#6366f1"
          />
          <KPICard
            title="Pending Payments"
            value={statistics.pending_payments_count || 0}
            icon="time"
            color="#f59e0b"
          />
        </ScrollView>
      )}

      {/* Status Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.primary }],
                ]}
              >
                <Ionicons
                  name={tab.icon}
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
                {tab.count !== undefined && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor:
                          activeTab === tab.key ? theme.primary : theme.textSecondary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: activeTab === tab.key ? '#fff' : theme.textSecondary },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filters */}
      <FilterBar
        configs={[
          {
            key: 'status',
            label: 'Status',
            icon: 'funnel',
            type: 'select',
            options: [
              { label: 'Completed', value: 'completed', color: '#10b981' },
              { label: 'Pending', value: 'pending', color: '#f59e0b' },
              { label: 'Not Yet', value: 'not_yet', color: '#ef4444' },
            ],
          },
          {
            key: 'dateRange',
            label: 'Date Range',
            icon: 'calendar-outline',
            type: 'daterange',
          },
        ]}
        activeFilters={filters}
        onFiltersChange={setFilters}
      />

      {/* Finance List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && allItems.length === 0 ? (
          <LoadingState variant="skeleton" skeletonCount={5} />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Finance Data"
            subtitle="Failed to load data. Please try again."
            action={{
              label: 'Retry',
              icon: 'refresh',
              onPress: refetch,
            }}
          />
        ) : allItems.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="No Finance Records"
            subtitle="Start tracking your sales and expenses"
            action={{
              label: 'Add Record',
              icon: 'add-circle',
              onPress: handleAddFinance,
            }}
          />
        ) : (
          <>
            <View style={styles.itemsList}>
              {allItems.map((item, index) => (
                <Animated.View
                  key={`${item.itemType}-${item.id}`}
                  entering={FadeIn.delay(index * 50)}
                  style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Pressable
                    onPress={() => handleItemDetails(item)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {/* Card Header */}
                    <View style={styles.itemCardHeader}>
                      <View style={styles.itemCardTitleContainer}>
                        <Ionicons
                          name={item.itemType === 'sale' ? 'cash' : 'receipt'}
                          size={24}
                          color={item.itemType === 'sale' ? '#10b981' : '#ef4444'}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[styles.itemCardTitle, { color: theme.text }]}>
                            {item.itemType === 'sale'
                              ? (typeof (item as Sale).event === 'object' ? (item as Sale).event?.name : (item as Sale).event_name || 'Sale')
                              : (item as Expense).particulars}
                          </Text>
                          <Text style={[styles.itemCardSubtitle, { color: theme.textSecondary }]}>
                            {formatDate(item.itemType === 'sale' ? (item as Sale).date : (item as Expense).expense_date)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.itemCardBadges}>
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: item.itemType === 'sale' ? '#10b981' + '20' : '#ef4444' + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: item.itemType === 'sale' ? '#10b981' : '#ef4444' },
                            ]}
                          >
                            {item.itemType}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.payment_status) + '20' },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.payment_status) }]}>
                            {item.payment_status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Card Body */}
                    <View style={styles.itemCardBody}>
                      <View style={styles.itemInfoRow}>
                        <Ionicons name="cash-outline" size={16} color={theme.textSecondary} />
                        <Text style={[styles.itemAmount, { color: theme.text }]}>
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                      {item.itemType === 'sale' && (item as Sale).discount > 0 && (
                        <View style={styles.itemInfoRow}>
                          <Ionicons name="pricetag-outline" size={14} color={theme.textSecondary} />
                          <Text style={[styles.itemInfoText, { color: theme.textSecondary }]}>
                            Discount: {formatCurrency((item as Sale).discount)}
                          </Text>
                        </View>
                      )}
                      {item.itemType === 'expense' && (item as Expense).vendor && (
                        <View style={styles.itemInfoRow}>
                          <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                          <Text style={[styles.itemInfoText, { color: theme.textSecondary }]}>
                            {typeof (item as Expense).vendor === 'object' ? (item as Expense).vendor?.name : 'Vendor'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Card Footer */}
                    <View style={styles.itemCardFooter}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                        onPress={() => handleItemDetails(item)}
                      >
                        <Ionicons name="eye" size={16} color={theme.text} />
                        <Text style={[styles.actionButtonText, { color: theme.text }]}>
                          View Details
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* Pagination Controls */}
            {allItems.length > 0 && (salesResponse?.next || expensesResponse?.next) && (
              <View style={[styles.paginationContainer, { marginHorizontal: 16, backgroundColor: theme.surface, padding: 16, borderRadius: 12 }]}>
                <Text style={[styles.paginationInfo, { color: theme.textSecondary, marginBottom: 12 }]}>
                  Showing {allItems.length} items
                </Text>

                <View style={styles.paginationButtons}>
                  <TouchableOpacity
                    style={[styles.paginationButton, { backgroundColor: theme.primary }]}
                    onPress={handleLoadMore}
                    disabled={loadingMore}
                  >
                    <Ionicons name="arrow-down" size={16} color="#fff" />
                    <Text style={styles.paginationButtonText}>
                      {loadingMore ? 'Loading...' : 'Load More 50'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {loadingMore && (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>
                      Loading more items...
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContainer: {
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  itemsList: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  itemCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemCardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  itemInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemInfoText: {
    fontSize: 13,
  },
  itemCardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
});
