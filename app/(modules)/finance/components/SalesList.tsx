/**
 * SalesList Component
 * Professional sales list with filtering and actions
 * Following Events module pattern
 */
import React, { useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn, Badge } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useSales, useDeleteSale } from '@/hooks/useFinanceQueries';
import { designSystem } from '@/constants/designSystem';
import type { Sale } from '@/types/finance';

interface SalesListProps {
  searchQuery?: string;
  selectedStatus?: string;
  refreshing?: boolean;
}

interface SaleRowData {
  id: number;
  eventName: string;
  clientName: string;
  date: string;
  amount: number;
  netAmount: number;
  status: string;
  createdBy: string | number;
}

const SalesList: React.FC<SalesListProps> = ({
  searchQuery = '',
  selectedStatus = 'all',
  refreshing = false,
}) => {
  const { theme, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const { data: salesResponse, isLoading, error, refetch } = useSales({});
  const deleteSaleMutation = useDeleteSale();

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;

  // Extract sales array from response - Handle multiple response formats
  const sales = useMemo(() => {
    if (!salesResponse) return [];
    
    // Handle direct array response (when pagination is disabled)
    if (Array.isArray(salesResponse)) return salesResponse;
    
    // Handle paginated response with results key
    if (salesResponse && typeof salesResponse === 'object' && 'results' in salesResponse) {
      return Array.isArray((salesResponse as any).results) ? (salesResponse as any).results : [];
    }
    
    // Fallback
    return [];
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
      const totalReceived = sale.payments?.reduce((sum: number, payment: any) => 
        sum + Number(payment.payment_amount || 0), 0
      ) || 0;
      const netAmount = Number(sale.amount || 0) - Number(sale.discount || 0);
      const balanceDue = netAmount - totalReceived;

      // Get event name - handles three cases: object with name, event_name string, or just ID
      let eventName = '-';
      if (typeof sale.event === 'object' && sale.event?.name) {
        eventName = sale.event.name;
      } else if (sale.event_name) {
        eventName = sale.event_name;
      } else if (sale.event && typeof sale.event === 'number') {
        eventName = `Event #${sale.event}`;
      }
      
      // Extract client and venue information from nested event object
      const eventObj = typeof sale.event === 'object' ? sale.event : null;
      const clientName = eventObj?.client?.name || (eventObj?.name ? eventObj.name : '-');
      const clientContact = eventObj?.client?.number || eventObj?.client?.email || '-';
      const venueName = eventObj?.venue?.name || '-';
      const venueAddress = eventObj?.venue?.address || '-';

      return {
        id: sale.id || 0,
        eventName: eventName || '-',
        clientName: clientName || '-',
        date: new Date(sale.date).toLocaleDateString('en-IN'),
        amount: Number(sale.amount || 0),
        netAmount,
        status: sale.payment_status || 'not_yet',
        createdBy: sale.created_by || '-',
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

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle sale actions
  const handleSaleDetails = (saleId: number) => {
    router.push(`/(modules)/finance/${saleId}` as any);
  };

  const handleEditSale = (saleId: number) => {
    router.push({
      pathname: '/(modules)/finance/add-sale',
      params: { id: saleId },
    } as any);
  };

  const handleDeleteSale = async (saleId: number) => {
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSaleMutation.mutateAsync(saleId);
              Alert.alert('Success', 'Sale deleted successfully');
            } catch (error) {
              console.error('Error deleting sale:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete sale'
              );
            }
          },
        },
      ]
    );
  };

  // Define table columns - EXACTLY like Events module
  const columns: TableColumn<SaleRowData>[] = [
    {
      key: 'eventName',
      title: 'Event',
      sortable: true,
      width: 180,
      render: (value: string) => (
        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }} numberOfLines={2}>
          {value}
        </Text>
      ),
    },
    {
      key: 'clientName',
      title: 'Client',
      sortable: true,
      width: 150,
      render: (value: string) => (
        <Text style={{ fontSize: 14, color: theme.text }} numberOfLines={1}>
          {value}
        </Text>
      ),
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      width: 110,
      render: (value: string) => (
        <Text style={{ fontSize: 14, color: theme.text }}>
          {value}
        </Text>
      ),
    },
    {
      key: 'netAmount',
      title: 'Net Amount',
      sortable: true,
      width: 130,
      render: (value: number) => (
        <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '600' }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (value: string) => (
        <Badge
          label={
            value === 'completed' ? 'Completed' :
            value === 'pending' ? 'Pending' :
            value === 'not_yet' ? 'New' :
            value
          }
          status={value as any}
          size="sm"
        />
      ),
    },
  ];

  // Add actions column if user has permissions
  if (canEdit || canDelete) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (_: any, row: SaleRowData) => (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          {canEdit && (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: theme.primary + '15',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onTouchEnd={() => handleEditSale(row.id)}
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </View>
          )}
          {canDelete && (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: '#EF444415',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onTouchEnd={() => handleDeleteSale(row.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </View>
          )}
        </View>
      ),
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: theme.textSecondary }}>
          Loading sales...
        </Text>
      </View>
    );
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

  // Main render - EXACTLY like Events module
  return (
    <View style={{ flex: 1, paddingHorizontal: 0, paddingVertical: 0 }}>
      <Table
        data={processedSales}
        columns={columns}
        keyExtractor={(item) => item.id.toString()}
        onRowPress={(row) => handleSaleDetails(row.id)}
      />
    </View>
  );
};

export default SalesList;
