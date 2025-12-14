import React, { useMemo, useState } from 'react';
import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Table, Badge, FAB, LoadingState } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import financeService from '@/services/finance.service';
import { designSystem } from '@/constants/designSystem';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Expense } from '@/types/finance';
import { Ionicons } from '@expo/vector-icons';

interface ExpensesListProps {
  searchQuery?: string;
  selectedStatus?: string;
  dateRange?: { start?: string; end?: string };
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: React.ReactNode;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  searchQuery = '',
  selectedStatus,
  dateRange,
  refreshing = false,
  onRefresh,
  headerComponent,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch expenses
  const {
    data: expensesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses', searchQuery, selectedStatus, dateRange, page],
    queryFn: async () => {
      const params: any = {
        page_size: pageSize,
        page: page,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedStatus && selectedStatus !== 'all') params.payment_status = selectedStatus;
      if (dateRange?.start) params.date_from = dateRange.start;
      if (dateRange?.end) params.date_to = dateRange.end;

      return await financeService.getExpenses(params);
    },
  });

  const expenses = useMemo(() => {
    if (!expensesResponse) return [];
    if (Array.isArray(expensesResponse)) return expensesResponse;
    return expensesResponse.results || [];
  }, [expensesResponse]);

  const columns = useMemo(() => [
    {
      key: 'particulars',
      title: 'Particulars',
      width: 180,
      sortable: true,
      render: (value: string, row: Expense) => (
        <View>
          <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
            {row.particulars}
          </Text>
          {row.vendor_name && (
            <Text style={{ fontSize: designSystem.typography.sizes.xs, color: theme.textSecondary }}>
              Vendor: {row.vendor_name}
            </Text>
          )}
          {row.event_name && (
            <Text style={{ fontSize: designSystem.typography.sizes.xs, color: theme.textSecondary }}>
              Event: {row.event_name}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'expense_date',
      title: 'Date',
      width: 100,
      sortable: true,
      render: (value: string) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, color: theme.text }}>
          {formatDate(value)}
        </Text>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 110,
      sortable: true,
      render: (value: number) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      key: 'payment_status',
      title: 'Status',
      width: 110,
      render: (value: string) => (
        <Badge
          label={value}
          status={value === 'paid' ? 'success' : value === 'partial_paid' ? 'warning' : 'error'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: (_: any, row: Expense) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/expenses/${row.id}` as any)}
          style={{ padding: 4 }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      )
    }
  ], [theme]);

  if (isLoading && !refreshing && !expenses.length) {
    return <LoadingState message="Loading expenses..." variant="skeleton" skeletonCount={5} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Expenses"
          description="Failed to load expenses data"
          actionTitle="Retry"
          onActionPress={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Table
        data={expenses}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        emptyMessage="No expenses found"
        searchable={false}
        ListHeaderComponent={headerComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={() => {
              onRefresh?.();
              refetch();
            }}
            colors={[theme.primary]}
          />
        }
        paginated={true}
      />


    </View>
  );
};

export default ExpensesList;
