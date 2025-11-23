import React, { useMemo } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn, Badge, Button } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useSales, useDeleteSale } from '@/hooks/useFinanceQueries';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { SaleRowData } from '@/types/finance';

interface SalesListProps {
  searchQuery?: string;
  selectedStatus?: string;
  refreshing?: boolean;
}

export default function SalesList({ searchQuery, selectedStatus, refreshing }: SalesListProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  // Fetch sales data
  const { data: salesResponse, isLoading, error, refetch } = useSales({ 
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchQuery 
  });
  
  const deleteSaleMutation = useDeleteSale();

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canDelete = canManage;

  // Extract sales array from response
  const sales = useMemo(() => {
    if (!salesResponse) return [];
    // Handle both array response and paginated response
    return Array.isArray(salesResponse) ? salesResponse : salesResponse.results || [];
  }, [salesResponse]);

  // Process and filter sales data
  const processedSales: SaleRowData[] = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    
    let filtered = sales.filter(sale => sale && sale.id);
    
    // Apply search filter (client-side for better UX)
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(sale => {
        const eventName = typeof sale.event === 'object' && sale.event?.name 
          ? sale.event.name 
          : sale.event_name || '';
        const createdByName = sale.created_by_name || '';
        
        return (
          eventName.toLowerCase().includes(query) ||
          createdByName.toLowerCase().includes(query) ||
          String(sale.amount).includes(query) ||
          String(sale.id).includes(query)
        );
      });
    }

    // Apply status filter (client-side)
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(sale => sale.payment_status === selectedStatus);
    }

    // Transform to table row data
    return filtered.map(sale => {
      // Calculate totals
      const totalReceived = sale.payments?.reduce((sum, payment) => 
        sum + Number(payment.payment_amount || 0), 0
      ) || 0;
      const netAmount = Number(sale.amount || 0) - Number(sale.discount || 0);
      const balanceDue = netAmount - totalReceived;

      const eventName = typeof sale.event === 'object' && sale.event?.name 
        ? sale.event.name 
        : sale.event_name || 'N/A';

      return {
        id: sale.id,
        eventName,
        amount: Number(sale.amount || 0),
        discount: Number(sale.discount || 0),
        netAmount,
        totalReceived,
        balanceDue,
        date: new Date(sale.date).toLocaleDateString('en-IN'),
        payment_status: sale.payment_status,
        createdBy: sale.created_by_name || 'N/A',
        paymentsCount: sale.payments?.length || 0,
      };
    });
  }, [sales, searchQuery, selectedStatus]);

  // Handle row press
  const handleRowPress = (row: SaleRowData) => {
    router.push({
      pathname: '/(modules)/finance/[id]',
      params: { id: row.id, type: 'sale' },
    });
  };

  // Handle delete
  const handleDelete = (sale: SaleRowData) => {
    Alert.alert(
      'Delete Sale',
      `Are you sure you want to delete this sale for "${sale.eventName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSaleMutation.mutateAsync(sale.id);
              Alert.alert('Success', 'Sale deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete sale');
            }
          },
        },
      ]
    );
  };

  // Handle edit
  const handleEdit = (sale: SaleRowData) => {
    router.push({
      pathname: '/(modules)/finance/add-sale',
      params: { id: sale.id, mode: 'edit' },
    });
  };

  // Define table columns
  const columns = [
    {
      key: 'eventName',
      title: 'Event Name',
      sortable: true,
      width: 180,
      render: (value: string) => (
        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }} numberOfLines={2}>
          {value}
        </Text>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      render: (value: number) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
          ₹{value.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'discount',
      title: 'Discount',
      sortable: true,
      width: 100,
      render: (value: number) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
          ₹{value.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'netAmount',
      title: 'Net Amount',
      sortable: true,
      width: 130,
      render: (value: number) => (
        <Text style={{ ...getTypographyStyle('sm', 'bold'), color: theme.primary }}>
          ₹{value.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'totalReceived',
      title: 'Received',
      sortable: true,
      width: 120,
      render: (value: number) => (
        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: '#10B981' }}>
          ₹{value.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'balanceDue',
      title: 'Balance',
      sortable: true,
      width: 120,
      render: (value: number) => (
        <Text style={{ 
          ...getTypographyStyle('sm', 'semibold'), 
          color: value > 0 ? '#EF4444' : '#10B981' 
        }}>
          ₹{value.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 110,
      render: (value: string) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
          {value}
        </Text>
      ),
    },
    {
      key: 'payment_status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (value: string) => <Badge label={value} status={value as any} size="sm" />,
    },
    {
      key: 'paymentsCount',
      title: 'Payments',
      sortable: true,
      width: 100,
      render: (value: number) => (
        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: theme.primary + '20',
          alignItems: 'center',
          alignSelf: 'flex-start',
        }}>
          <Text style={{ ...getTypographyStyle('xs', 'semibold'), color: theme.primary }}>
            {value} {value === 1 ? 'payment' : 'payments'}
          </Text>
        </View>
      ),
    },
    {
      key: 'createdBy',
      title: 'Created By',
      sortable: true,
      width: 140,
      render: (value: string) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
          {value}
        </Text>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      title: 'Actions',
      sortable: false,
      width: 180,
      render: (_: any, row: SaleRowData) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            iconName="create-outline"
            onPress={(e: any) => {
              e?.stopPropagation?.();
              handleEdit(row);
            }}
            variant="ghost"
            size="sm"
          />
          {canDelete && (
            <Button
              iconName="trash-outline"
              onPress={(e: any) => {
                e?.stopPropagation?.();
                handleDelete(row);
              }}
              variant="ghost"
              size="sm"
            />
          )}
        </View>
      ),
    }] : []),
  ];

  // Loading state
  if (isLoading && !refreshing) {
    return <LoadingState type="card" items={5} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error Loading Sales"
        description={error?.message || 'Failed to load sales data'}
        actionTitle="Try Again"
        onActionPress={() => refetch()}
      />
    );
  }

  // Empty state
  if (processedSales.length === 0) {
    return (
      <EmptyState
        icon="wallet-outline"
        title="No Sales Found"
        description={
          searchQuery || selectedStatus !== 'all'
            ? 'No sales match your filters. Try adjusting your search or filters.'
            : 'No sales have been recorded yet. Create your first sale to get started.'
        }
        actionTitle={canManage && !searchQuery ? 'Add Sale' : undefined}
        onActionPress={canManage && !searchQuery ? () => router.push('/(modules)/finance/add-sale' as any) : undefined}
      />
    );
  }

  // Main render
  return (
    <View style={{ flex: 1 }}>
      <Table
        data={processedSales}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        onRowPress={handleRowPress}
      />
    </View>
  );
}
