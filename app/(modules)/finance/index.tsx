/**
 * Finance Management Screen with Excel-like Table
 * Shows Sales, Expenses, and Invoices with sortable columns
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import financeService from '@/services/finance.service';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { KPICard, EmptyState, LoadingState, Table, type TableColumn, Badge } from '@/components';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { Sale, Expense, Invoice, FinanceStatistics } from '@/types/finance';
import { formatDate, formatCurrency } from '@/utils/formatters';

type FinanceTab = 'sales' | 'expenses' | 'invoices';
type FinanceItem = (Sale | Expense) & { itemType: 'sale' | 'expense' };

export default function FinanceManagementScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FinanceTab>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [salesPage, setSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [pageSize] = useState(50);
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
    enabled: activeTab === 'sales',
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
    enabled: activeTab === 'expenses',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch invoices with pagination
  const [invoicesPage, setInvoicesPage] = useState(1);
  const {
    data: invoicesResponse,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: ['invoices', filters, invoicesPage, pageSize, debouncedSearch],
    queryFn: async () => {
      const response = await financeService.getInvoices({
        date_from: filters.date_from,
        date_to: filters.date_to,
        search: debouncedSearch || undefined,
        page: invoicesPage,
        page_size: pageSize,
      });
      return response;
    },
    enabled: activeTab === 'invoices',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['financeStatistics'],
    queryFn: () => financeService.getFinanceStatistics(),
    staleTime: 10 * 60 * 1000,
  });

  // Combine and process items (not needed anymore as we removed 'all' tab)
  // React.useEffect(() => {
  //   const newItems: FinanceItem[] = [];

  //   if (activeTab === 'sales') {
  //     const salesItems = (salesResponse?.results || []).map(sale => ({
  //       ...sale,
  //       itemType: 'sale' as const,
  //     }));
  //     newItems.push(...salesItems);
  //   }

  //   if (activeTab === 'expenses') {
  //     const expenseItems = (expensesResponse?.results || []).map(expense => ({
  //       ...expense,
  //       itemType: 'expense' as const,
  //     }));
  //     newItems.push(...expenseItems);
  //   }

  //   // Sort by date
  //   newItems.sort((a, b) => {
  //     const dateA = 'date' in a ? new Date(a.date) : new Date(a.expense_date);
  //     const dateB = 'date' in b ? new Date(b.date) : new Date(b.expense_date);
  //     return dateB.getTime() - dateA.getTime();
  //   });

  //   if (salesPage === 1 && expensesPage === 1) {
  //     setAllItems(newItems);
  //   } else {
  //     setAllItems(prev => [...prev, ...newItems]);
  //   }
  // }, [salesResponse, expensesResponse, activeTab, salesPage, expensesPage]);

  const isLoading = salesLoading || expensesLoading;
  const error = salesError || expensesError;

  // Column definitions for different tabs (memoized with theme)
  const salesColumns: TableColumn[] = useMemo(() => [
    {
      key: 'client_name',
      title: 'Client',
      sortable: true,
      width: 150,
      render: (value, row: Sale) => (
        <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>
          {row.event?.client?.name || 'N/A'}
        </Text>
      )
    },
    {
      key: 'venue_name',
      title: 'Venue',
      sortable: true,
      width: 150,
      render: (value, row: Sale) => (
        <Text style={{ fontSize: 14, color: theme.text }}>
          {row.event?.venue?.name || 'N/A'}
        </Text>
      )
    },
    {
      key: 'event_start_date',
      title: 'Event Start Date',
      sortable: true,
      width: 120,
      render: (value, row: Sale) => (
        <Text style={{ color: theme.text }}>{formatDate(row.event?.start_date || row.date)}</Text>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (value) => <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>{formatCurrency(value)}</Text>
    },
    {
      key: 'payment_status',
      title: 'Payment Status',
      width: 130,
      render: (value) => <Badge label={value} status={value === 'completed' ? 'success' : value === 'pending' ? 'warning' : 'error'} size="sm" />
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 60,
      render: (value, row: Sale) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/sales/${row.id}` as any)}
          style={{
            padding: 4,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      )
    },
  ], [theme]);

  const expensesColumns: TableColumn[] = useMemo(() => [
    {
      key: 'particulars',
      title: 'Particulars',
      sortable: true,
      width: 250,
      render: (value, row: Expense) => (
        <View>
          <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>{row.particulars}</Text>
          {row.vendor_name && (
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              Vendor: {row.vendor_name}
            </Text>
          )}
          {row.event?.name && (
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              Event: {row.event.name}
            </Text>
          )}
        </View>
      )
    },
    {
      key: 'expense_date',
      title: 'Date',
      sortable: true,
      width: 100,
      render: (value) => <Text style={{ color: theme.text }}>{formatDate(value)}</Text>
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (value) => <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>{formatCurrency(value)}</Text>
    },
    {
      key: 'payment_status',
      title: 'Payment Status',
      width: 130,
      render: (value) => <Badge label={value} status={value === 'paid' ? 'success' : value === 'partial_paid' ? 'warning' : 'error'} size="sm" />
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 60,
      render: (value, row: Expense) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/expenses/${row.id}` as any)}
          style={{
            padding: 4,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      )
    },
  ], [theme]);

  const invoicesColumns: TableColumn[] = useMemo(() => [
    {
      key: 'invoice_number',
      title: 'Invoice #',
      sortable: true,
      width: 120,
      render: (value) => <Text style={{ fontWeight: '600', color: theme.text }}>{value}</Text>
    },
    {
      key: 'client_name',
      title: 'Client',
      sortable: true,
      width: 150,
      render: (value, row: Invoice) => (
        <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>{value || 'N/A'}</Text>
      )
    },
    {
      key: 'event_name',
      title: 'Event',
      sortable: true,
      width: 150,
      render: (value, row: Invoice) => (
        <Text style={{ fontSize: 14, color: theme.text }}>{value || 'N/A'}</Text>
      )
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 100,
      render: (value) => <Text style={{ color: theme.text }}>{formatDate(value)}</Text>
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (value) => <Text style={{ fontWeight: '600', fontSize: 14, color: theme.text }}>{formatCurrency(value)}</Text>
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 60,
      render: (value, row: Invoice) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/invoices/${row.id}` as any)}
          style={{
            padding: 4,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      )
    },
  ], [theme]);

  const allColumns: TableColumn[] = useMemo(() => [
    {
      key: 'itemType',
      title: 'Type',
      width: 70,
      render: (value) => <Badge label={value} status={value === 'sale' ? 'success' : 'error'} size="sm" />
    },
    {
      key: 'description',
      title: 'Description',
      sortable: true,
      width: 220,
      render: (value, row) => <Text>{row.itemType === 'sale' ? row.event_name || 'Sale' : row.particulars}</Text>
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 100,
      render: (value, row) => <Text>{formatDate(row.itemType === 'sale' ? row.date : row.expense_date)}</Text>
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (value) => <Text>{formatCurrency(value)}</Text>
    },
    {
      key: 'payment_status',
      title: 'Status',
      width: 110,
      render: (value) => {
        const statusMap: any = {
          completed: 'success', pending: 'warning', not_yet: 'error',
          paid: 'success', partial_paid: 'warning', not_paid: 'error'
        };
        return <Badge label={value} status={statusMap[value] || 'default'} size="sm" />;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 80,
      render: (value, row: FinanceItem) => (
        <TouchableOpacity
          onPress={() => {
            if (row.itemType === 'sale') {
              router.push(`/(modules)/finance/sales/${row.id}` as any);
            } else {
              router.push(`/(modules)/finance/expenses/${row.id}` as any);
            }
          }}
          style={{
            padding: 8,
            backgroundColor: theme.primary + '15',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      )
    },
  ], [theme]);

  // Get current columns based on active tab
  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'sales': return salesColumns;
      case 'expenses': return expensesColumns;
      case 'invoices': return invoicesColumns;
      default: return salesColumns;
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'sales':
        return (salesResponse?.results || []).map((s: Sale) => ({
          ...s,
          event_name: typeof s.event === 'object' ? s.event?.name : s.event_name || 'N/A'
        }));
      case 'expenses':
        return (expensesResponse?.results || []).map((e: Expense) => ({
          ...e,
          vendor_name: typeof e.vendor === 'object' ? e.vendor?.name : e.vendor_name || 'N/A'
        }));
      case 'invoices':
        return (invoicesResponse?.results || []).map((i: Invoice) => ({
          ...i,
          client_name: typeof i.client === 'object' ? i.client?.name : i.client_name || 'N/A',
          event_name: typeof i.event === 'object' ? i.event?.name : i.event_name || 'N/A',
          amount: i.final_amount || i.total_amount || 0
        }));
      default:
        return [];
    }
  };

  // Load more function
  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);

    if (activeTab === 'sales' && salesResponse?.next) {
      setSalesPage(prev => prev + 1);
    } else if (activeTab === 'expenses' && expensesResponse?.next) {
      setExpensesPage(prev => prev + 1);
    } else if (activeTab === 'invoices' && invoicesResponse?.next) {
      setInvoicesPage(prev => prev + 1);
    }

    setTimeout(() => setLoadingMore(false), 500);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setSalesPage(1);
    setExpensesPage(1);
    setInvoicesPage(1);
  }, [activeTab, filters, debouncedSearch]);

  // Tab configuration
  const tabs: Array<{ key: FinanceTab; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }> = [
    { key: 'sales', label: 'All Sales', icon: 'cash', count: statistics?.total_sales },
    { key: 'expenses', label: 'All Expenses', icon: 'receipt', count: statistics?.total_expenses },
    { key: 'invoices', label: 'All Invoices', icon: 'document-text', count: statistics?.total_invoices },
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
      router.push(`/(modules)/finance/sales/${item.id}` as any);
    } else {
      router.push(`/(modules)/finance/expenses/${item.id}` as any);
    }
  };

  const handleInvoiceDetails = (invoiceId: number) => {
    router.push(`/(modules)/finance/invoices/${invoiceId}` as any);
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
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
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

      {/* Finance List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[theme.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Show Invoices Tab */}
        {activeTab === 'invoices' ? (
          <>
            {invoicesLoading && !invoicesResponse ? (
              <LoadingState variant="skeleton" skeletonCount={5} />
            ) : invoicesError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Error Loading Invoices"
                subtitle="Failed to load invoices. Please try again."
                action={{
                  label: 'Retry',
                  icon: 'refresh',
                  onPress: refetch,
                }}
              />
            ) : !invoicesResponse?.results || invoicesResponse.results.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No Invoices"
                subtitle="Start creating invoices for your clients"
                action={{
                  label: 'Create Invoice',
                  icon: 'add-circle',
                  onPress: handleAddFinance,
                }}
              />
            ) : (
              <Table
                columns={invoicesColumns}
                data={invoicesResponse.results}
                keyExtractor={(item) => item.id.toString()}
                emptyMessage="No invoices found"
                stickyHeader
              />
            )}
          </>
        ) : (
          /* Show Sales/Expenses */
          <>
            {isLoading && getCurrentData().length === 0 ? (
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
            ) : getCurrentData().length === 0 ? (
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
              <Table
                columns={getCurrentColumns()}
                data={getCurrentData()}
                keyExtractor={(item) => item.id.toString()}
                emptyMessage={`No ${activeTab} records found`}
                stickyHeader
              />
            )}
          </>
        )}

        {/* Pagination Controls */}
        {!isLoading && getCurrentData().length > 0 && (
          (activeTab === 'sales' && salesResponse?.next) ||
          (activeTab === 'expenses' && expensesResponse?.next) ||
          (activeTab === 'invoices' && invoicesResponse?.next)
        ) && (
            <View style={[styles.paginationContainer, { marginHorizontal: 16, backgroundColor: theme.surface, padding: 16, borderRadius: 12, marginVertical: 16 }]}>
              <Text style={[styles.paginationInfo, { color: theme.textSecondary, marginBottom: 12 }]}>
                Showing {getCurrentData().length} items
              </Text>

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
  // Excel-like Table Styles
  tableContainer: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableCellText: {
    fontSize: 12,
  },
  // Column widths
  tableTypeCol: {
    width: 36,
    alignItems: 'center',
  },
  tableDescCol: {
    flex: 1,
  },
  tableDateCol: {
    width: 70,
  },
  tableAmountCol: {
    width: 80,
    alignItems: 'flex-end',
  },
  tableStatusCol: {
    width: 30,
    alignItems: 'center',
  },
  tableInvoiceNumCol: {
    width: 90,
  },
  tableClientCol: {
    flex: 1,
  },
  // Table cell components
  typeTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
