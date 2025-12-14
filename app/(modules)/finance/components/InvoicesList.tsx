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
import type { Invoice } from '@/types/finance';
import { Ionicons } from '@expo/vector-icons';

interface InvoicesListProps {
  searchQuery?: string;
  dateRange?: { start?: string; end?: string };
  refreshing?: boolean;
  onRefresh?: () => void;
  headerComponent?: React.ReactNode;
}

const InvoicesList: React.FC<InvoicesListProps> = ({
  searchQuery = '',
  dateRange,
  refreshing = false,
  onRefresh,
  headerComponent,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch invoices
  const {
    data: invoicesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoices', searchQuery, dateRange, page],
    queryFn: async () => {
      const params: any = {
        page_size: pageSize,
        page: page,
      };
      if (searchQuery) params.search = searchQuery;
      if (dateRange?.start) params.date_from = dateRange.start;
      if (dateRange?.end) params.date_to = dateRange.end;

      return await financeService.getInvoices(params);
    },
  });

  const invoices = useMemo(() => {
    if (!invoicesResponse) return [];
    if (Array.isArray(invoicesResponse)) return invoicesResponse;
    return (invoicesResponse as any).results || [];
  }, [invoicesResponse]);

  const columns = useMemo(() => [
    {
      key: 'invoice_number',
      title: 'Invoice #',
      width: 100,
      sortable: true,
      render: (value: string) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
          {value}
        </Text>
      ),
    },
    {
      key: 'client_name',
      title: 'Client',
      width: 140,
      sortable: true,
      render: (value: string, row: Invoice) => (
        <View>
          <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '500', color: theme.text }}>
            {value || row.client_name || 'N/A'}
          </Text>
        </View>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      width: 100,
      render: (value: string) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, color: theme.text }}>
          {formatDate(value)}
        </Text>
      ),
    },
    {
      key: 'final_amount',
      title: 'Amount',
      width: 110,
      render: (value: number, row: Invoice) => (
        <Text style={{ fontSize: designSystem.typography.sizes.sm, fontWeight: '600', color: theme.text }}>
          {formatCurrency(value || row.total_amount)}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: '',
      width: 50,
      render: (_: any, row: Invoice) => (
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/finance/invoices/${row.id}` as any)}
          style={{ padding: 4 }}
        >
          <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      )
    }
  ], [theme]);

  if (isLoading && !refreshing && !invoices.length) {
    return <LoadingState message="Loading invoices..." variant="skeleton" skeletonCount={5} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Invoices"
          description="Failed to load invoices data"
          actionTitle="Retry"
          onActionPress={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Table
        data={invoices}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        emptyMessage="No invoices found"
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

export default InvoicesList;
