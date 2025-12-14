import React, { useMemo, useState } from 'react';
import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Table, Badge, LoadingState } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import financeService from '@/services/finance.service';
import { designSystem } from '@/constants/designSystem';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Sale } from '@/types/finance';
import { Ionicons } from '@expo/vector-icons';

interface SalesListProps {
  searchQuery?: string;
  selectedStatus?: string;
  dateRange?: { start?: string; end?: string };
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: React.ReactNode;
}

const SalesList: React.FC<SalesListProps> = ({
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

  // Fetch sales
  const {
    data: salesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sales', searchQuery, selectedStatus, dateRange, page],
    queryFn: async () => {
      const params: any = {
        page_size: pageSize,
        page: page,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;
      if (dateRange?.start) params.date_from = dateRange.start;
      if (dateRange?.end) params.date_to = dateRange.end;

      return await financeService.getSales(params);
    },
  });

  const sales = useMemo(() => {
    if (!salesResponse) return [];
    if (Array.isArray(salesResponse)) return salesResponse;
    return salesResponse.results || [];
  }, [salesResponse]);

  const columns = useMemo(() => [
    {
      key: 'client_name',
      title: 'Client / Event',
      width: 160,
      render: (_: any, row: Sale) => (
        <View>
          <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
            {typeof row.event === 'object' ? row.event.client?.name : row.event_name || 'N/A'}
          </Text>
          <Text style={{ fontSize: designSystem.typography.sizes.xs, color: theme.textSecondary }}>
            {typeof row.event === 'object' ? row.event.venue?.name : 'Event Sale'}
          </Text>
        </View>
      ),
    },
    {
      key: 'date',
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
          status={value === 'completed' ? 'success' : value === 'pending' ? 'warning' : 'error'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: (_: any, row: Sale) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/sales/${row.id}` as any)}
          style={{ padding: 4 }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      )
    }
  ], [theme]);

  if (isLoading && !refreshing && !sales.length) {
    return <LoadingState message="Loading sales..." variant="skeleton" skeletonCount={5} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Sales"
          description="Failed to load sales data"
          actionTitle="Retry"
          onActionPress={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Table
        data={sales}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        emptyMessage="No sales found"
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
        // Basic pagination if response has count
        paginated={true} // Just UI flag, logic handled by custom load more usually or handled by Table if generic
      />


    </View>
  );
};

export default SalesList;
