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

  const { data: expenses = [], isLoading, error } = useExpenses();
  const deleteExpense = useDeleteExpense();

  const processedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.particulars?.toLowerCase().includes(query) ||
          expense.vendor?.name?.toLowerCase().includes(query) ||
          expense.event?.name?.toLowerCase().includes(query) ||
          expense.mode_of_payment?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter((expense) => expense.payment_status === filterStatus);
    }

    // Transform to row data
    return filtered.map(
      (expense): ExpenseRowData => ({
        id: expense.id,
        particulars: expense.particulars || 'N/A',
        vendor: expense.vendor?.name || 'N/A',
        event: expense.event?.name || 'N/A',
        amount: expense.amount || 0,
        expense_date: expense.expense_date,
        payment_status: expense.payment_status || 'pending',
        mode_of_payment: expense.mode_of_payment || 'N/A',
        bill_evidence: expense.bill_evidence,
        photos_count: expense.expense_photos?.length || 0,
        created_by: expense.created_by ? `${expense.created_by.first_name} ${expense.created_by.last_name}` : 'N/A',
      })
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
      key: 'vendor',
      title: 'Vendor',
      width: 140,
      render: (row) => (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }} numberOfLines={1}>
          {row.vendor}
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
    {
      key: 'mode_of_payment',
      title: 'Payment Mode',
      width: 130,
      render: (row) => (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: theme.primary + '15',
          }}
        >
          <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.primary }}>
            {(row.mode_of_payment || 'N/A').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      ),
    },
    {
      key: 'bill_evidence',
      title: 'Bill',
      width: 80,
      render: (row) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name={row.bill_evidence ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={row.bill_evidence ? '#10B981' : '#EF4444'}
          />
          {row.photos_count > 0 && (
            <View
              style={{
                backgroundColor: theme.primary,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ ...getTypographyStyle('xs', 'bold'), color: '#FFF' }}>
                {row.photos_count}
              </Text>
            </View>
          )}
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
              onPress={() => router.push(`/(modules)/finance/add-expense?id=${row.id}`)}
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
