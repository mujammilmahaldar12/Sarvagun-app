import React, { useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn, Badge } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useExpenses, useDeleteExpense } from '@/hooks/useFinanceQueries';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { ExpenseRowData } from '@/types/finance';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface ExpensesListProps {
  searchQuery?: string;
  filterStatus?: string;
}

export default function ExpensesList({ searchQuery = '', filterStatus }: ExpensesListProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;

  const { data: expensesResponse, isLoading, error } = useExpenses();
  const deleteExpense = useDeleteExpense();

  // Extract expenses array from response
  const expenses = useMemo(() => {
    if (!expensesResponse) return [];
    // Handle both array response and paginated response
    return Array.isArray(expensesResponse) ? expensesResponse : (expensesResponse as any).results || [];
  }, [expensesResponse]);

  const processedExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    let filtered = expenses.filter(expense => expense && expense.id);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) => {
          const vendorName = typeof expense.vendor === 'object' ? expense.vendor?.name : '';
          const eventName = typeof expense.event === 'object' ? expense.event?.name : '';
          return (
            expense.particulars?.toLowerCase().includes(query) ||
            vendorName?.toLowerCase().includes(query) ||
            eventName?.toLowerCase().includes(query) ||
            expense.mode_of_payment?.toLowerCase().includes(query)
          );
        }
      );
    }

    // Apply status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter((expense) => expense.payment_status === filterStatus);
    }

    // Transform to row data
    return filtered.map(
      (expense): ExpenseRowData => {
        // Extract client and venue information from nested event object
        const eventObj = typeof expense.event === 'object' ? expense.event : null;
        const vendorObj = typeof expense.vendor === 'object' ? expense.vendor : null;
        
        // Get event name - handles three cases: object with name, event_name string, or just ID
        let eventName = '-';
        if (typeof expense.event === 'object' && expense.event?.name) {
          eventName = expense.event.name;
        } else if (expense.event_name) {
          eventName = expense.event_name;
        } else if (expense.event && typeof expense.event === 'number') {
          eventName = `Event #${expense.event}`;
        }
        
        // Get vendor name - handles object vs ID
        let vendorName = '-';
        if (typeof expense.vendor === 'object' && expense.vendor?.name) {
          vendorName = expense.vendor.name;
        } else if (expense.vendor_name) {
          vendorName = expense.vendor_name;
        } else if (expense.vendor && typeof expense.vendor === 'number') {
          vendorName = `Vendor #${expense.vendor}`;
        }
        
        const clientName = eventObj?.client?.name || (eventObj?.name ? eventObj.name : '-');
        const clientContact = eventObj?.client?.number || eventObj?.client?.email || '-';
        const venueName = eventObj?.venue?.name || '-';
        const venueAddress = eventObj?.venue?.address || '-';
        
        return {
          id: expense.id,
          particulars: expense.particulars || '-',
          vendorName: vendorName,
          eventName: eventName,
          clientName,
          clientContact,
          venueName,
          venueAddress,
          amount: expense.amount || 0,
          expense_date: expense.expense_date,
          payment_status: expense.payment_status || 'pending',
          mode_of_payment: expense.mode_of_payment || '-',
          bill_evidence: expense.bill_evidence,
          createdBy: '-',
        };
      }
    );
  }, [expenses, searchQuery, filterStatus]);

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense.mutateAsync(id);
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const columns: TableColumn<ExpenseRowData>[] = [
    {
      key: 'particulars',
      title: 'Particulars',
      width: 180,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }} numberOfLines={2}>
          {row.particulars}
        </Text>
      ),
    },
    {
      key: 'eventName',
      title: 'Event',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={1}>
          {row.eventName}
        </Text>
      ),
    },
    {
      key: 'expense_date',
      title: 'Date',
      width: 110,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {new Date(row.expense_date).toLocaleDateString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'clientName',
      title: 'Client',
      width: 150,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }} numberOfLines={2}>
          {row.clientName || 'N/A'}
        </Text>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 120,
      sortable: true,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
          ₹{(row.amount || 0).toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      key: 'payment_status',
      title: 'Status',
      width: 100,
      render: (row) => (
        <Badge 
          label={row.payment_status}
          status={row.payment_status === 'paid' ? 'success' : row.payment_status === 'pending' ? 'pending' : 'cancelled'}
          size="sm"
        />
      ),
    },

  ];

  // Add actions column if user has permission
  if (canManage || canEdit || canDelete) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      width: 140,
      render: (row) => (
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          {(canManage || canEdit) && (
            <Pressable
              onPress={() => router.push(`/(modules)/finance/add-expense?id=${row.id}`)}
              style={({ pressed }) => ({
                padding: 6,
                borderRadius: 6,
                backgroundColor: pressed ? theme.primary + '20' : 'transparent',
              })}
            >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </Pressable>
          )}
          {(canManage || canDelete) && (
            <Pressable
              onPress={() => handleDelete(row.id)}
              style={({ pressed }) => ({
                padding: 6,
                borderRadius: 6,
                backgroundColor: pressed ? '#EF444420' : 'transparent',
              })}
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
        title="Error Loading Expenses"
        description="Failed to load expenses. Please try again."
      />
    );
  }

  if (processedExpenses.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title="No Expenses Found"
        description={
          searchQuery || filterStatus
            ? 'No expenses match your search criteria. Try adjusting filters.'
            : 'Start by adding your first expense.'
        }
      />
    );
  }

  return (
    <Table
      data={processedExpenses}
      columns={columns}
      keyExtractor={(row) => row.id.toString()}
      onRowPress={(row) => router.push(`/(modules)/finance/expense-detail/${row.id}`)}
      emptyMessage="No expenses to display"
    />
  );
}
