/**
 * Sales Detail Screen
 * Shows sale details with payment installments, edit/delete functionality
 */
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { StatusBadge, InfoRow, KPICard, LoadingState } from '@/components';
import { DetailSection, DetailRow } from '@/components/ui/DetailViews';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/constants/designSystem';
import financeService from '@/services/finance.service';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import type { Sale, SalesPayment, Expense } from '@/types/finance';

type TabType = 'details' | 'payments' | 'expenses';

export default function SalesDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const saleId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sale details
  const { data: sale, isLoading, error, refetch } = useQuery<Sale>({
    queryKey: ['sale', saleId],
    queryFn: () => financeService.getSale(saleId),
    enabled: !!saleId && !isNaN(saleId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/(modules)/finance/add-sale?id=${saleId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sale record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await financeService.deleteSale(saleId);
              queryClient.invalidateQueries({ queryKey: ['sales'] });
              Alert.alert('Success', 'Sale deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sale');
            }
          },
        },
      ]
    );
  };

  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const tabs: Tab[] = [
    { id: 'details', label: 'Details', icon: 'information-circle' },
    { id: 'payments', label: 'Payments', icon: 'cash', badge: sale?.payments?.length },
    { id: 'expenses', label: 'Expenses', icon: 'receipt' },
  ];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Sale Details" showBack />
        <LoadingState variant="skeleton" skeletonCount={5} />
      </View>
    );
  }

  if (error || !sale) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Sale Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[getTypographyStyle('2xl', 'bold'), { marginTop: spacing.md, textAlign: 'center' }]}>
            Failed to load sale
          </Text>
          <Text style={[getTypographyStyle('base', 'regular'), { marginTop: spacing.sm, textAlign: 'center', color: theme.textSecondary }]}>
            {error?.message || 'Something went wrong'}
          </Text>
          <Pressable
            style={{
              marginTop: spacing.lg,
              backgroundColor: theme.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: 8,
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const event = typeof sale.event === 'object' ? sale.event : null;
  const netAmount = sale.amount - (sale.discount || 0);
  const totalReceived = sale.total_received || sale.payments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0;
  const balanceDue = netAmount - totalReceived;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.success;
      case 'pending':
        return theme.warning;
      case 'not_yet':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      cheque: 'Cheque',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
    };
    return labels[mode] || mode;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Sale Details"
        showBack
        rightActions={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={handleEdit}
              style={{
                padding: spacing.sm,
                backgroundColor: theme.primary + '20',
                borderRadius: 8,
              }}
            >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={{
                padding: spacing.sm,
                backgroundColor: theme.error + '20',
                borderRadius: 8,
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* KPI Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: spacing.sm }}
        >
          <KPICard
            title="Total Amount"
            value={formatCurrency(sale.amount)}
            icon="cash"
            color={theme.primary}
          />
          <KPICard
            title="Discount"
            value={formatCurrency(sale.discount || 0)}
            icon="pricetag"
            color={theme.warning}
          />
          <KPICard
            title="Net Amount"
            value={formatCurrency(netAmount)}
            icon="calculator"
            color={theme.info}
          />
          <KPICard
            title="Received"
            value={formatCurrency(totalReceived)}
            icon="checkmark-circle"
            color={theme.success}
          />
          <KPICard
            title="Balance Due"
            value={formatCurrency(balanceDue)}
            icon="alert-circle"
            color={balanceDue > 0 ? theme.error : theme.success}
          />
        </ScrollView>


        {/* Tabs */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabType)} />

        <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, gap: 16 }}>
          {activeTab === 'details' && <DetailsTab sale={sale} event={event} theme={theme} />}
          {activeTab === 'payments' && <PaymentsTab payments={sale.payments || []} theme={theme} />}
          {activeTab === 'expenses' && <ExpensesTab eventId={event?.id} saleAmount={netAmount} theme={theme} />}
        </View>
      </ScrollView>
    </View>
  );
}

// Details Tab Component
interface DetailsTabProps {
  sale: Sale;
  event: any;
  theme: any;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ sale, event, theme }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Animated.View entering={FadeIn} style={{ gap: 4 }}>
      {/* Event Info Card */}
      {event && (
        <DetailSection title="Event Details" icon="calendar" delay={0}>
          <DetailRow icon="text-outline" label="Event Name" value={event.name} />
          {event.client && (
            <DetailRow
              icon="person-outline"
              label="Client"
              value={typeof event.client === 'object' ? event.client.name : 'N/A'}
            />
          )}
          {event.venue && (
            <DetailRow
              icon="location-outline"
              label="Venue"
              value={typeof event.venue === 'object' ? event.venue.name : 'N/A'}
            />
          )}
          {event.event_date && (
            <DetailRow
              icon="time-outline"
              label="Event Date"
              value={formatDate(event.event_date)}
              isLast
            />
          )}
        </DetailSection>
      )}

      {/* Sale Info Card */}
      <DetailSection title="Sale Information" icon="cash" delay={100}>
        <DetailRow icon="cash-outline" label="Amount" value={formatCurrency(sale.amount)} />
        <DetailRow icon="pricetag-outline" label="Discount" value={formatCurrency(sale.discount || 0)} />
        <DetailRow
          icon="calculator-outline"
          label="Net Amount"
          value={formatCurrency(sale.amount - (sale.discount || 0))}
          valueStyle={{ fontWeight: '700', color: theme.primary }}
        />
        <DetailRow icon="calendar-outline" label="Sale Date" value={formatDate(sale.date)} isLast />
      </DetailSection>

      {/* Payment Info */}
      <DetailSection title="Payment Details" icon="wallet" delay={200}>
        <DetailRow
          icon="checkmark-circle-outline"
          label="Payment Status"
          value={sale.payment_status?.toUpperCase()}
          valueStyle={{
            color: sale.payment_status === 'completed' ? theme.success :
              sale.payment_status === 'pending' ? theme.warning : theme.error,
            fontWeight: '700'
          }}
        />
        <DetailRow
          icon="cash-outline"
          label="Total Received"
          value={formatCurrency(sale.total_received || 0)}
          valueStyle={{ color: theme.success, fontWeight: '600' }}
        />
        <DetailRow
          icon="alert-circle-outline"
          label="Balance Due"
          value={formatCurrency(sale.balance_due || 0)}
          valueStyle={{
            color: (sale.balance_due || 0) > 0 ? theme.error : theme.success,
            fontWeight: '600'
          }}
        />
        {sale.created_by_name && (
          <DetailRow
            icon="person-circle-outline"
            label="Created By"
            value={sale.created_by_name}
            isLast
          />
        )}
      </DetailSection>
    </Animated.View>
  );
};

// Payments Tab Component
interface PaymentsTabProps {
  payments: SalesPayment[];
  theme: any;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ payments, theme }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentModeIcon = (mode: string): any => {
    const icons: Record<string, string> = {
      cash: 'cash-outline',
      cheque: 'document-text-outline',
      upi: 'phone-portrait-outline',
      bank_transfer: 'business-outline',
    };
    return icons[mode] || 'card-outline';
  };

  const getPaymentModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      cheque: 'Cheque',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
    };
    return labels[mode] || mode;
  };

  if (!payments || payments.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 }}>
        <Ionicons name="card-outline" size={64} color={theme.textSecondary} opacity={0.3} />
        <Text style={[getTypographyStyle('xl', theme), { marginTop: spacing.md, color: theme.textSecondary }]}>
          No Payments Yet
        </Text>
        <Text style={[getTypographyStyle('base', theme), { marginTop: spacing.xs, color: theme.textSecondary }]}>
          Payment installments will appear here
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: 4 }}>
      {payments.map((payment, index) => (
        <DetailSection
          key={payment.id || index}
          title={`Payment #${index + 1}`}
          icon="wallet-outline"
          delay={index * 100}
        >
          <DetailRow
            label="Amount"
            value={formatCurrency(payment.payment_amount)}
            icon="cash-outline"
            valueStyle={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}
          />
          <DetailRow
            label="Date"
            value={formatDate(payment.payment_date)}
            icon="calendar-outline"
          />
          <DetailRow
            label="Mode"
            value={getPaymentModeLabel(payment.mode_of_payment)}
            icon={getPaymentModeIcon(payment.mode_of_payment)}
          />
          {payment.notes && (
            <DetailRow
              label="Notes"
              value={payment.notes}
              icon="document-text-outline"
              isLast
            />
          )}
        </DetailSection>
      ))}
    </Animated.View>
  );
};

// Expenses Tab Component - Shows linked expenses and profit/loss
interface ExpensesTabProps {
  eventId: number | undefined;
  saleAmount: number;
  theme: any;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ eventId, saleAmount, theme }) => {
  // Fetch expenses for this event
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['eventExpenses', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const response = await financeService.getExpenses({ event: eventId });
      return Array.isArray(response) ? response : (response as any)?.results || [];
    },
    enabled: !!eventId,
  });

  const expenses = expensesData || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
  const profitLoss = saleAmount - totalExpenses;
  const isProfitable = profitLoss >= 0;

  if (!eventId) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 }}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.textSecondary} opacity={0.3} />
        <Text style={[getTypographyStyle('xl', 'semibold'), { marginTop: spacing.md, color: theme.textSecondary }]}>
          No Event Linked
        </Text>
        <Text style={[getTypographyStyle('base', 'regular'), { marginTop: spacing.xs, color: theme.textSecondary, textAlign: 'center' }]}>
          This sale is not linked to an event
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState variant="skeleton" skeletonCount={3} />;
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: 4 }}>
      {/* Profit/Loss Summary */}
      <DetailSection title="Profit/Loss Summary" icon="analytics" delay={0}>
        <DetailRow
          icon="trending-up"
          label="Sale Amount"
          value={formatCurrency(saleAmount)}
          valueStyle={{ color: theme.success, fontWeight: '700' }}
        />
        <DetailRow
          icon="trending-down"
          label="Total Expenses"
          value={formatCurrency(totalExpenses)}
          valueStyle={{ color: theme.error, fontWeight: '700' }}
        />
        <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8 }} />
        <DetailRow
          icon={isProfitable ? 'checkmark-circle' : 'warning'}
          label={isProfitable ? 'Profit' : 'Loss'}
          value={formatCurrency(Math.abs(profitLoss))}
          valueStyle={{
            color: isProfitable ? theme.success : theme.error,
            fontWeight: '700',
            fontSize: 18
          }}
          isLast
        />
      </DetailSection>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        expenses.map((expense: any, index: number) => (
          <DetailSection
            key={expense.id || index}
            title={expense.particulars || 'Expense'}
            icon="receipt-outline"
            delay={100 * (index + 1)}
          >
            <DetailRow
              icon="cash-outline"
              label="Amount"
              value={formatCurrency(expense.amount || 0)}
              valueStyle={{ color: theme.error, fontWeight: '600' }}
            />
            <DetailRow icon="calendar-outline" label="Date" value={formatDate(expense.expense_date || expense.date)} />
            <DetailRow icon="person-outline" label="Paid To" value={expense.paid_to} />
            <DetailRow icon="card-outline" label="Payment Mode" value={expense.mode_of_payment} />
            {expense.details && (
              <DetailRow icon="document-text-outline" label="Details" value={expense.details} isLast />
            )}
          </DetailSection>
        ))
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl }}>
          <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} opacity={0.3} />
          <Text style={[getTypographyStyle('base', 'medium'), { marginTop: spacing.md, color: theme.textSecondary }]}>
            No expenses recorded for this event
          </Text>
        </View>
      )}
    </Animated.View>
  );
};
