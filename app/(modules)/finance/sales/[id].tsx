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
import { StatusBadge, InfoRow, KPICard, LoadingState, Table } from '@/components';
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
  const netAmount = Number(sale.amount) - (Number(sale.discount) || 0);
  const totalReceived = Number(sale.total_received) || (sale.payments?.reduce((sum, p) => sum + (Number(p.payment_amount) || 0), 0) || 0);
  const balanceDue = Number(netAmount) - Number(totalReceived);

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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={handleEdit} style={{ padding: 8, backgroundColor: theme.primary + '20', borderRadius: 8 }}>
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </Pressable>
            <Pressable onPress={handleDelete} style={{ padding: 8, backgroundColor: theme.error + '20', borderRadius: 8 }}>
              <Ionicons name="trash-outline" size={18} color={theme.error} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Compact Summary Card */}
        <View style={{ margin: 16, padding: 14, backgroundColor: theme.surface, borderRadius: 12, gap: 10 }}>
          {/* Client & Event Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                {typeof sale.event === 'object' ? sale.event.client?.name : 'Sale'}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                {typeof sale.event === 'object' ? sale.event.venue?.name : 'Event'} • {formatDate(sale.date)}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
              backgroundColor: sale.payment_status === 'completed' ? '#10B98115' : sale.payment_status === 'pending' ? '#F59E0B15' : '#EF444415'
            }}>
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: sale.payment_status === 'completed' ? '#10B981' : sale.payment_status === 'pending' ? '#F59E0B' : '#EF4444'
              }}>
                {sale.payment_status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Amount Grid */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, padding: 10, backgroundColor: theme.primary + '10', borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: theme.textSecondary }}>Net Amount</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.primary }}>{formatCurrency(netAmount)}</Text>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: '#10B98110', borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: theme.textSecondary }}>Received</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#10B981' }}>{formatCurrency(totalReceived)}</Text>
            </View>
            <View style={{ flex: 1, padding: 10, backgroundColor: balanceDue > 0 ? '#EF444410' : '#10B98110', borderRadius: 8 }}>
              <Text style={{ fontSize: 10, color: theme.textSecondary }}>Balance</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: balanceDue > 0 ? '#EF4444' : '#10B981' }}>{formatCurrency(balanceDue)}</Text>
            </View>
          </View>
        </View>

        {/* Compact Horizontal Tabs */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as TabType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderBottomWidth: 2,
                    borderBottomColor: activeTab === tab.id ? theme.primary : 'transparent',
                  }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.id ? theme.primary : theme.textSecondary}
                  />
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: activeTab === tab.id ? theme.primary : theme.text,
                  }}>
                    {tab.label}
                  </Text>
                  {tab.badge ? (
                    <View style={{
                      backgroundColor: theme.primary,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 1
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{tab.badge}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12, gap: 8 }}>
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
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmt = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  const rowStyle = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border + '30' };
  const labelStyle = { fontSize: 12, color: theme.textSecondary };
  const valueStyle = (color?: string) => ({ fontSize: 12, fontWeight: '600' as const, color: color || theme.text });

  return (
    <Animated.View entering={FadeIn} style={{ gap: 12 }}>
      {/* Event Info */}
      {event && (
        <View style={{ padding: 12, backgroundColor: theme.surface, borderRadius: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>EVENT</Text>
          <View style={rowStyle}><Text style={labelStyle}>Client</Text><Text style={valueStyle()}>{event.client?.name || 'N/A'}</Text></View>
          <View style={rowStyle}><Text style={labelStyle}>Venue</Text><Text style={valueStyle()}>{event.venue?.name || 'N/A'}</Text></View>
          <View style={rowStyle}><Text style={labelStyle}>Event Date</Text><Text style={valueStyle()}>{event.event_date ? formatDate(event.event_date) : 'N/A'}</Text></View>
        </View>
      )}

      {/* Sale Info */}
      <View style={{ padding: 12, backgroundColor: theme.surface, borderRadius: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>SALE</Text>
        <View style={rowStyle}><Text style={labelStyle}>Amount</Text><Text style={valueStyle()}>{fmt(sale.amount)}</Text></View>
        <View style={rowStyle}><Text style={labelStyle}>Discount</Text><Text style={valueStyle()}>{fmt(sale.discount || 0)}</Text></View>
        <View style={rowStyle}><Text style={labelStyle}>Net Amount</Text><Text style={valueStyle(theme.primary)}>{fmt(sale.amount - (sale.discount || 0))}</Text></View>
        <View style={rowStyle}><Text style={labelStyle}>Sale Date</Text><Text style={valueStyle()}>{formatDate(sale.date)}</Text></View>
      </View>

      {/* Payment Summary */}
      <View style={{ padding: 12, backgroundColor: theme.surface, borderRadius: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>PAYMENT</Text>
        <View style={rowStyle}><Text style={labelStyle}>Status</Text><Text style={valueStyle(sale.payment_status === 'completed' ? '#10B981' : sale.payment_status === 'pending' ? '#F59E0B' : '#EF4444')}>{sale.payment_status?.toUpperCase() || 'N/A'}</Text></View>
        <View style={rowStyle}><Text style={labelStyle}>Received</Text><Text style={valueStyle('#10B981')}>{fmt(sale.total_received || 0)}</Text></View>
        <View style={rowStyle}><Text style={labelStyle}>Balance Due</Text><Text style={valueStyle((sale.balance_due || 0) > 0 ? '#EF4444' : '#10B981')}>{fmt(sale.balance_due || 0)}</Text></View>
        {sale.created_by_name && <View style={rowStyle}><Text style={labelStyle}>Created By</Text><Text style={valueStyle()}>{sale.created_by_name}</Text></View>}
      </View>
    </Animated.View>
  );
};

// Payments Tab Component
interface PaymentsTabProps {
  payments: SalesPayment[];
  theme: any;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ payments, theme }) => {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (!payments?.length) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Ionicons name="wallet-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.4 }} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No payments yet</Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: 8 }}>
      {payments.map((p, i) => (
        <View key={p.id || i} style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          padding: 12, backgroundColor: theme.surface, borderRadius: 10,
          borderLeftWidth: 3, borderLeftColor: '#10B981'
        }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>{formatCurrency(p.payment_amount || 0)}</Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
              {p.mode_of_payment?.replace('_', ' ')} • {formatDate(p.payment_date)}
            </Text>
          </View>
        </View>
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
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['eventExpenses', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      console.log('💸 Fetching expenses for event:', eventId);
      const response = await financeService.getExpenses({ event: eventId });
      console.log('💸 Expenses response:', JSON.stringify(response));
      // Handle paginated response - getExpenses returns { results: [...], count, ... }
      const expenses = (response as any)?.results || [];
      console.log('💸 Extracted expenses:', expenses.length);
      return expenses;
    },
    enabled: !!eventId,
  });

  const expenses = expensesData || [];
  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  const profitLoss = saleAmount - totalExpenses;
  const isProfitable = profitLoss >= 0;

  if (!eventId) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.4 }} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No event linked</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState variant="skeleton" skeletonCount={3} />;
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: 8 }}>
      {/* Compact Summary */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, backgroundColor: theme.surface, borderRadius: 10,
        borderLeftWidth: 3, borderLeftColor: isProfitable ? '#10B981' : '#EF4444'
      }}>
        <View>
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>{isProfitable ? 'Profit' : 'Loss'}</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: isProfitable ? '#10B981' : '#EF4444' }}>
            {formatCurrency(Math.abs(profitLoss))}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>
            Sale: <Text style={{ color: '#10B981' }}>{formatCurrency(saleAmount)}</Text>
          </Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary }}>
            Expense: <Text style={{ color: '#EF4444' }}>{formatCurrency(totalExpenses)}</Text>
          </Text>
        </View>
      </View>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Ionicons name="receipt-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No expenses yet</Text>
        </View>
      ) : (
        expenses.map((e: any, i: number) => (
          <View key={e.id || i} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 12, backgroundColor: theme.surface, borderRadius: 10,
            borderLeftWidth: 3, borderLeftColor: '#EF4444'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{e.particulars || 'Expense'}</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                {e.paid_to || 'N/A'} • {formatDate(e.expense_date || e.date)}
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{formatCurrency(e.amount || 0)}</Text>
          </View>
        ))
      )}
    </Animated.View>
  );
};
