import React, { useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppTable, { TableColumn } from '@/components/ui/AppTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useInvoices, useDeleteInvoice } from '@/hooks/useFinanceQueries';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { InvoiceRowData } from '@/types/finance';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface InvoicesListProps {
  searchQuery?: string;
  filterStatus?: string;
}

export default function InvoicesList({ searchQuery = '', filterStatus }: InvoicesListProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;

  const { data: invoices = [], isLoading, error } = useInvoices();
  const deleteInvoice = useDeleteInvoice();

  const processedInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number?.toLowerCase().includes(query) ||
          invoice.client_name?.toLowerCase().includes(query) ||
          invoice.event?.name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === filterStatus);
    }

    // Transform to row data
    return filtered.map(
      (invoice): InvoiceRowData => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number || 'N/A',
        client_name: invoice.client_name || 'N/A',
        event: invoice.event?.name || 'N/A',
        total_amount: invoice.total_amount || 0,
        paid_amount: invoice.paid_amount || 0,
        balance_amount: (invoice.total_amount || 0) - (invoice.paid_amount || 0),
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        status: invoice.status || 'pending',
        items_count: invoice.invoice_items?.length || 0,
        created_by: invoice.created_by ? `${invoice.created_by.first_name} ${invoice.created_by.last_name}` : 'N/A',
      })
    );
  }, [invoices, searchQuery, filterStatus]);

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvoice.mutateAsync(id);
              Alert.alert('Success', 'Invoice deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const columns: TableColumn<InvoiceRowData>[] = [
    {
      key: 'invoice_number',
      title: 'Invoice #',
      width: 120,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.primary }} numberOfLines={1}>
          {row.invoice_number}
        </Text>
      ),
    },
    {
      key: 'client_name',
      title: 'Client',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }} numberOfLines={1}>
          {row.client_name}
        </Text>
      ),
    },
    {
      key: 'event',
      title: 'Event',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={1}>
          {row.event}
        </Text>
      ),
    },
    {
      key: 'total_amount',
      title: 'Total Amount',
      width: 130,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
          ₹{(row.total_amount || 0).toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'paid_amount',
      title: 'Paid',
      width: 120,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: '#10B981' }}>
          ₹{(row.paid_amount || 0).toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'balance_amount',
      title: 'Balance',
      width: 120,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: (row.balance_amount || 0) > 0 ? '#EF4444' : '#10B981' }}>
          ₹{(row.balance_amount || 0).toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'invoice_date',
      title: 'Invoice Date',
      width: 110,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {row?.invoice_date ? new Date(row.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
        </Text>
      ),
    },
    {
      key: 'due_date',
      title: 'Due Date',
      width: 110,
      render: (row) => {
        if (!row?.due_date) {
          return (
            <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
              N/A
            </Text>
          );
        }
        
        const dueDate = new Date(row.due_date);
        const today = new Date();
        const isOverdue = dueDate < today && (row.balance_amount || 0) > 0;
        
        return (
          <Text style={{ ...getTypographyStyle('xs', 'regular'), color: isOverdue ? '#EF4444' : theme.textSecondary }}>
            {dueDate.toLocaleDateString('en-IN')}
          </Text>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (row) => (
        <StatusBadge 
          status={row.status} 
          type={row.status === 'paid' ? 'completed' : row.status === 'pending' ? 'pending' : row.status === 'overdue' ? 'rejected' : 'draft'}
        />
      ),
    },
    {
      key: 'items_count',
      title: 'Items',
      width: 80,
      render: (row) => (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: theme.primary + '20',
          }}
        >
          <Text style={{ ...getTypographyStyle('xs', 'bold'), color: theme.primary }}>
            {row.items_count}
          </Text>
        </View>
      ),
    },
    {
      key: 'created_by',
      title: 'Created By',
      width: 130,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {row.created_by}
        </Text>
      ),
    },
  ];

  // Add actions column if user has permission
  if (canManage || canEdit || canDelete) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (row) => (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          {(canManage || canEdit) && (
            <Pressable
              onPress={() => router.push(`/(modules)/finance/add-invoice?id=${row.id}`)}
              style={{ padding: 4 }}
            >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </Pressable>
          )}
          {(canManage || canDelete) && (
            <Pressable
              onPress={() => handleDelete(row.id)}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          )}
        </View>
      ),
    });
  }

  if (isLoading) {
    return <LoadingState type="card" items={5} />;
  }

  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error Loading Invoices"
        description="Failed to load invoices. Please try again."
      />
    );
  }

  if (processedInvoices.length === 0) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="No Invoices Found"
        description={
          searchQuery || filterStatus
            ? 'No invoices match your search criteria. Try adjusting filters.'
            : 'Start by creating your first invoice.'
        }
      />
    );
  }

  return (
    <AppTable
      data={processedInvoices}
      columns={columns}
      keyExtractor={(row) => row.id.toString()}
      onRowPress={(row) => router.push(`/(modules)/finance/invoice-detail?id=${row.id}`)}
      emptyMessage="No invoices to display"
    />
  );
}
