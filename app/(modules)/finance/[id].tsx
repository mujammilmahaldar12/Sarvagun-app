import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSale, useSalePayments, useDeleteSale, useExpenses } from '@/hooks/useFinanceQueries';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useAuthStore } from '@/store/authStore';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;

  // Fetch sale data
  const { data: sale, isLoading, error, refetch } = useSale(Number(id));
  const { data: payments = [], isLoading: paymentsLoading } = useSalePayments(Number(id));
  const deleteSale = useDeleteSale();

  // Fetch expenses for the event
  // Extract event ID - it could be a number or an object with id
  const eventId = typeof sale?.event === 'object' && sale?.event !== null
    ? sale.event.id
    : sale?.event;

  console.log('🔍 Sales Detail - Event ID:', eventId, 'from sale.event:', sale?.event);

  // Only fetch expenses if we have a valid event ID
  const { data: expensesData, isLoading: expensesLoading } = useExpenses(
    { event: eventId as number },
    { enabled: !!eventId && !!sale } // Only run query when we have event ID and sale data
  );

  // Handle both paginated and array responses
  const expenses = Array.isArray(expensesData)
    ? expensesData
    : (expensesData?.results || []);

  console.log('💰 Sales Detail - Expenses Data:', {
    eventId,
    hasEventId: !!eventId,
    expensesData: expensesData ? 'received' : 'null',
    expensesCount: expenses.length,
    isLoading: expensesLoading
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/(modules)/finance/add-sale?id=${id}`);
  };

  const handleDelete = () => {
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
              await deleteSale.mutateAsync(Number(id));
              Alert.alert('Success', 'Sale deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete sale');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !sale) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Sale Details" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Sale Not Found"
          description="The sale you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  const netAmount = (sale.amount || 0) - (sale.discount || 0);
  const totalReceived = payments.reduce((sum, payment) => sum + (payment.payment_amount || 0), 0);
  const balanceDue = netAmount - totalReceived;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'partial':
        return '#3B82F6';
      case 'overdue':
        return '#EF4444';
      default:
        return theme.textSecondary;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'cash':
        return 'cash-outline';
      case 'cheque':
        return 'document-text-outline';
      case 'upi':
        return 'phone-portrait-outline';
      case 'bank_transfer':
        return 'swap-horizontal-outline';
      case 'card':
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const renderInfoTab = () => {
    return null; // Placeholder for future expansion
  };

  const renderDocumentsTab = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
        Documents coming soon
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={sale ? `Sale #${sale.id}` : 'Sale Details'}
        showBack
        rightActions={
          (canManage || canEdit || canDelete) ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(canManage || canEdit) && (
                <Pressable
                  onPress={handleEdit}
                  style={({ pressed }) => ({
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.primary + '20' : 'transparent',
                  })}
                >
                  <Ionicons name="create-outline" size={24} color={theme.primary} />
                </Pressable>
              )}
              {(canManage || canDelete) && (
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => ({
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? '#EF444420' : 'transparent',
                  })}
                >
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </Pressable>
              )}
            </View>
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Card */}
        <View
          style={{
            padding: 20,
            backgroundColor: theme.surface,
            borderRadius: 12,
            ...designSystem.shadows.md,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Sale ID
              </Text>
              <Text style={{ ...getTypographyStyle('2xl', 'bold'), color: theme.text, marginTop: 4 }}>
                #{sale.id}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                sale.payment_status === 'completed' ? '#DBEAFE' :
                  sale.payment_status === 'pending' ? '#FEF3C7' : '#E0E7FF',
            }}>
              <Text style={{
                ...getTypographyStyle('xs', 'semibold'),
                color:
                  sale.payment_status === 'completed' ? '#1E40AF' :
                    sale.payment_status === 'pending' ? '#92400E' : '#3730A3',
              }}>
                {sale.payment_status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Event
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                {sale.event?.name || 'N/A'}
              </Text>
            </View>

            {sale.event?.client && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  Client
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                  {sale.event.client.name}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Sale Date
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                {new Date(sale.date).toLocaleDateString('en-IN')}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Created By
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                {sale.created_by_name || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View
          style={{
            padding: 20,
            backgroundColor: theme.surface,
            borderRadius: 12,
            gap: 12,
            ...designSystem.shadows.md,
          }}
        >
          <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text, marginBottom: 4 }}>
            Financial Summary
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
              Gross Amount
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
              ₹{(sale.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {sale.discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Discount
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: '#EF4444' }}>
                - ₹{(sale.discount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
              Net Amount
            </Text>
            <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.primary }}>
              ₹{netAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
              Total Received
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#10B981' }}>
              ₹{totalReceived.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
              Balance Due
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: balanceDue > 0 ? '#EF4444' : '#10B981' }}>
              ₹{balanceDue.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Payment History */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            overflow: 'hidden',
            ...designSystem.shadows.md,
          }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: theme.primary + '15',
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: theme.primary + '25',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Ionicons name="wallet" size={18} color={theme.primary} />
              </View>
              <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                Payments
              </Text>
            </View>
            <View style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ ...getTypographyStyle('xs', 'bold'), color: '#FFFFFF' }}>
                {payments.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            {paymentsLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
            ) : payments.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: theme.background,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12
                }}>
                  <Ionicons name="wallet-outline" size={28} color={theme.textSecondary} />
                </View>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  No payments recorded yet
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {payments.map((payment: any, index: number) => (
                  <View
                    key={payment.id || index}
                    style={{
                      padding: 14,
                      backgroundColor: theme.background,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...getTypographyStyle('lg', 'bold'), color: '#10B981' }}>
                          ₹{(payment.payment_amount || 0).toLocaleString('en-IN')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: theme.primary + '15',
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6
                          }}>
                            <Ionicons name={getModeIcon(payment.mode_of_payment)} size={12} color={theme.primary} />
                            <Text style={{ ...getTypographyStyle('xs', 'semibold'), color: theme.primary }}>
                              {payment.mode_of_payment?.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                            {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {payment.notes && (
                      <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
                        "{payment.notes}"
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Event Expenses */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            overflow: 'hidden',
            ...designSystem.shadows.md,
          }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: '#EF444415',
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: '#EF444425',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Ionicons name="receipt" size={18} color="#EF4444" />
              </View>
              <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                Expenses
              </Text>
            </View>
            <View style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ ...getTypographyStyle('xs', 'bold'), color: '#FFFFFF' }}>
                {expenses.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 16 }}>
            {expensesLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
            ) : !eventId ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: theme.background,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12
                }}>
                  <Ionicons name="information-circle-outline" size={28} color={theme.textSecondary} />
                </View>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  No event associated with this sale
                </Text>
              </View>
            ) : expenses.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30,
                  backgroundColor: theme.background,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 12
                }}>
                  <Ionicons name="receipt-outline" size={28} color={theme.textSecondary} />
                </View>
                <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                  No expenses recorded for this event
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {expenses.map((expense: any, index: number) => (
                  <Pressable
                    key={expense.id || index}
                    onPress={() => router.push(`/(modules)/finance/expense-detail/${expense.id}`)}
                    style={({ pressed }) => ({
                      padding: 14,
                      backgroundColor: pressed ? theme.background + 'AA' : theme.background,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                    })}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...getTypographyStyle('sm', 'bold'), color: theme.text }}>
                          {expense.particulars}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: theme.textSecondary + '15',
                            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6
                          }}>
                            <Ionicons name="business-outline" size={12} color={theme.textSecondary} />
                            <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                              {expense.vendor?.name || 'No Vendor'}
                            </Text>
                          </View>
                          <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                            {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ ...getTypographyStyle('base', 'bold'), color: '#EF4444' }}>
                          ₹{(expense.amount || 0).toLocaleString('en-IN')}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor:
                              expense.payment_status === 'paid' ? '#10B981' :
                                expense.payment_status === 'partial_paid' ? '#F59E0B' : '#EF4444',
                            marginTop: 4,
                          }}
                        >
                          <Text style={{ ...getTypographyStyle('xs', 'bold'), color: '#FFFFFF' }}>
                            {expense.payment_status === 'paid' ? 'PAID' :
                              expense.payment_status === 'partial_paid' ? 'PARTIAL' : 'UNPAID'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {(sale as any).notes && (
          <View
            style={{
              padding: 16,
              backgroundColor: theme.surface,
              borderRadius: 12,
              ...designSystem.shadows.sm,
            }}
          >
            <Text style={{ ...getTypographyStyle('sm', 'bold'), color: theme.text, marginBottom: 8 }}>
              Notes
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, lineHeight: 20 }}>
              {(sale as any).notes}
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View
          style={{
            padding: 16,
            backgroundColor: theme.surface,
            borderRadius: 12,
            gap: 8,
          }}
        >
          <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
            Sale Date: {new Date(sale.date).toLocaleDateString('en-IN')}
          </Text>
          <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
            Created By: {sale.created_by_name || 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
