import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSale, useSalePayments, useDeleteSale } from '@/hooks/useFinanceQueries';
import { useTheme } from '@/hooks/useTheme';
import { designSystem, getTypographyStyle } from '@/constants/designSystem';
import { useAuthStore } from '@/store/authStore';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { hasPermission } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const canManage = hasPermission('Finance', 'manage_all_finance');
  const canEdit = hasPermission('Finance', 'edit_finance');
  const canDelete = hasPermission('Finance', 'delete_finance');

  // Fetch sale data
  const { data: sale, isLoading, error, refetch } = useSale(Number(id));
  const { data: payments = [], isLoading: paymentsLoading } = useSalePayments(Number(id));
  const deleteSale = useDeleteSale();

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
    return <LoadingState message="Loading sale details..." />;
  }

  if (error || !sale) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Sale Details" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Sale Not Found"
          message="The sale you're looking for doesn't exist or has been deleted."
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
    if (!sale) return null;

    if (false) {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Expense Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Expense Information
            </Text>
            <InfoRow label="Type" value={
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: 
                  item.expenseType === 'Event' ? '#DBEAFE' :
                  item.expenseType === 'Reimbursement' ? '#FEF3C7' : '#E5E7EB',
              }}>
                <Text style={{
                  ...getTypographyStyle('xs', 'semibold'),
                  color: 
                    item.expenseType === 'Event' ? '#1E40AF' :
                    item.expenseType === 'Reimbursement' ? '#92400E' : '#374151',
                }}>
                  {item.expenseType}
                </Text>
              </View>
            } />
            <InfoRow label="Title" value={item.title} />
            <InfoRow label="Amount" value={`₹${item.amount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Category" value={item.category} />
            <InfoRow label="Date" value={item.date} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
          </View>

          {/* Vendor Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Vendor Information
            </Text>
            <InfoRow label="Vendor" value={item.vendor} />
            <InfoRow label="Invoice Number" value={item.invoiceNumber} />
            <InfoRow label="Payment Method" value={item.paymentMethod || 'Not specified'} />
          </View>

          {/* Submission Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Submission Details
            </Text>
            <InfoRow label="Submitted By" value={item.submittedBy} />
            <InfoRow label="Submitted Date" value={item.submittedDate} />
            {item.approvedBy && <InfoRow label="Approved By" value={item.approvedBy} />}
            {item.approvedDate && <InfoRow label="Approved Date" value={item.approvedDate} />}
          </View>

          {/* Additional Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Additional Details
            </Text>
            <InfoRow label="Description" value={item.description} multiline />
            {item.notes && <InfoRow label="Notes" value={item.notes} multiline />}
          </View>
        </View>
      );
    } else {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Invoice Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Invoice Information
            </Text>
            <InfoRow label="Invoice Number" value={item.invoiceNumber} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Invoice Date" value={item.date} />
            <InfoRow label="Due Date" value={item.dueDate} />
          </View>

          {/* Customer Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Customer Information
            </Text>
            <InfoRow label="Customer Name" value={item.customerName} />
            <InfoRow label="Email" value={item.customerEmail} />
            <InfoRow label="Phone" value={item.customerPhone} />
            <InfoRow label="Address" value={item.customerAddress} multiline />
          </View>

          {/* Product/Service Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Product/Service Details
            </Text>
            <InfoRow label="Product/Service" value={item.productService} />
            <InfoRow label="Description" value={item.description} multiline />
          </View>

          {/* Financial Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Financial Details
            </Text>
            <InfoRow label="Amount" value={`₹${item.amount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Tax Amount" value={`₹${item.taxAmount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Total Amount" value={`₹${item.totalAmount?.toLocaleString('en-IN')}`} />
            {item.paidAmount > 0 && <InfoRow label="Paid Amount" value={`₹${item.paidAmount?.toLocaleString('en-IN')}`} />}
            {item.paymentMethod && <InfoRow label="Payment Method" value={item.paymentMethod} />}
            {item.paidDate && <InfoRow label="Paid Date" value={item.paidDate} />}
          </View>

          {/* Additional Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text }}>
              Additional Information
            </Text>
            <InfoRow label="Sales Person" value={item.salesPerson} />
            <InfoRow label="Terms" value={item.terms} multiline />
            {item.notes && <InfoRow label="Notes" value={item.notes} multiline />}
          </View>
        </View>
      );
    }
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
        rightAction={
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
          <ScrollView.RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
            <StatusBadge
              status={sale.payment_status || 'pending'}
              label={sale.payment_status?.toUpperCase() || 'PENDING'}
            />
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
                {sale.created_by?.first_name} {sale.created_by?.last_name}
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
            padding: 20,
            backgroundColor: theme.surface,
            borderRadius: 12,
            ...designSystem.shadows.md,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
              Payment History
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
              {payments.length} {payments.length === 1 ? 'Payment' : 'Payments'}
            </Text>
          </View>

          {paymentsLoading ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : payments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="wallet-outline" size={40} color={theme.textSecondary} />
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 8 }}>
                No payments recorded yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {payments.map((payment, index) => (
                <View
                  key={payment.id || index}
                  style={{
                    padding: 14,
                    backgroundColor: theme.background,
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.primary,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                        ₹{(payment.payment_amount || 0).toLocaleString('en-IN')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <Ionicons
                          name={getModeIcon(payment.mode_of_payment)}
                          size={14}
                          color={theme.textSecondary}
                        />
                        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                          {payment.mode_of_payment?.replace('_', ' ').toUpperCase()} • {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                      {payment.notes && (
                        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: 6 }}>
                          {payment.notes}
                        </Text>
                      )}
                    </View>
                    {payment.payment_status && (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                          backgroundColor: getStatusColor(payment.payment_status) + '20',
                        }}
                      >
                        <Text
                          style={{
                            ...getTypographyStyle('xs', 'semibold'),
                            color: getStatusColor(payment.payment_status),
                          }}
                        >
                          {payment.payment_status.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes Section */}
        {sale.notes && (
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
              {sale.notes}
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
            Created: {new Date(sale.created_at).toLocaleString('en-IN')}
          </Text>
          <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
            Last Updated: {new Date(sale.updated_at).toLocaleString('en-IN')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
