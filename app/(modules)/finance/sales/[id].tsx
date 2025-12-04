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
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/constants/designSystem';
import financeService from '@/services/finance.service';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import type { Sale, SalesPayment } from '@/types/finance';

type TabType = 'details' | 'payments';

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

  const tabs: Tab<TabType>[] = [
    { id: 'details', label: 'Details', icon: 'information-circle' },
    { id: 'payments', label: 'Payments', icon: 'cash', badge: sale?.payments?.length },
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
          <Text style={[getTypographyStyle('h2', theme), { marginTop: spacing.md, textAlign: 'center' }]}>
            Failed to load sale
          </Text>
          <Text style={[getTypographyStyle('body', theme), { marginTop: spacing.sm, textAlign: 'center', color: theme.textSecondary }]}>
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
        rightAction={
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
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
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
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <View style={{ padding: spacing.md }}>
          {activeTab === 'details' && <DetailsTab sale={sale} event={event} theme={theme} />}
          {activeTab === 'payments' && <PaymentsTab payments={sale.payments || []} theme={theme} />}
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

  return (
    <Animated.View entering={FadeIn} style={{ gap: spacing.md }}>
      {/* Event Info Card */}
      {event && (
        <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
          <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
            EVENT DETAILS
          </Text>
          <InfoRow
            label="Event Name"
            value={event.name || 'N/A'}
            icon="calendar"
            theme={theme}
          />
          {event.client && (
            <InfoRow
              label="Client"
              value={typeof event.client === 'object' ? event.client.name : 'N/A'}
              icon="person"
              theme={theme}
            />
          )}
          {event.venue && (
            <InfoRow
              label="Venue"
              value={typeof event.venue === 'object' ? event.venue.name : 'N/A'}
              icon="location"
              theme={theme}
            />
          )}
          {event.event_date && (
            <InfoRow
              label="Event Date"
              value={formatDate(event.event_date)}
              icon="time"
              theme={theme}
            />
          )}
        </View>
      )}

      {/* Sale Info Card */}
      <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
          SALE INFORMATION
        </Text>
        <InfoRow
          label="Amount"
          value={formatCurrency(sale.amount)}
          icon="cash"
          theme={theme}
        />
        <InfoRow
          label="Discount"
          value={formatCurrency(sale.discount || 0)}
          icon="pricetag"
          theme={theme}
        />
        <InfoRow
          label="Net Amount"
          value={formatCurrency(sale.amount - (sale.discount || 0))}
          icon="calculator"
          theme={theme}
          valueStyle={{ fontWeight: '700', fontSize: 16, color: theme.primary }}
        />
        <InfoRow
          label="Date"
          value={formatDate(sale.date)}
          icon="calendar-outline"
          theme={theme}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="checkmark-circle" size={16} color={theme.textSecondary} />
            <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
              Payment Status
            </Text>
          </View>
          <StatusBadge
            status={sale.payment_status}
            variant={
              sale.payment_status === 'completed'
                ? 'success'
                : sale.payment_status === 'pending'
                ? 'warning'
                : 'error'
            }
          />
        </View>
        {sale.created_by_name && (
          <InfoRow
            label="Created By"
            value={sale.created_by_name}
            icon="person-circle"
            theme={theme}
          />
        )}
      </View>

      {/* Payment Summary Card */}
      <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
          PAYMENT SUMMARY
        </Text>
        <InfoRow
          label="Total Received"
          value={formatCurrency(sale.total_received || 0)}
          icon="checkmark-circle"
          theme={theme}
          valueStyle={{ color: theme.success, fontWeight: '600' }}
        />
        <InfoRow
          label="Balance Due"
          value={formatCurrency(sale.balance_due || 0)}
          icon="alert-circle"
          theme={theme}
          valueStyle={{
            color: (sale.balance_due || 0) > 0 ? theme.error : theme.success,
            fontWeight: '600',
          }}
        />
        <InfoRow
          label="Total Payments"
          value={`${sale.payments?.length || 0} installment(s)`}
          icon="list"
          theme={theme}
        />
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

  const getPaymentModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      cash: 'cash',
      cheque: 'document-text',
      upi: 'phone-portrait',
      bank_transfer: 'business',
    };
    return icons[mode] || 'card';
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
        <Text style={[getTypographyStyle('h3', theme), { marginTop: spacing.md, color: theme.textSecondary }]}>
          No Payments Yet
        </Text>
        <Text style={[getTypographyStyle('body', theme), { marginTop: spacing.xs, color: theme.textSecondary }]}>
          Payment installments will appear here
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: spacing.md }}>
      {payments.map((payment, index) => (
        <View key={payment.id || index} style={[getCardStyle(theme), { padding: spacing.md }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={[getTypographyStyle('h3', theme), { color: theme.primary }]}>
                {formatCurrency(payment.payment_amount)}
              </Text>
              <Text style={[getTypographyStyle('caption', theme), { color: theme.textSecondary, marginTop: 2 }]}>
                Payment #{index + 1}
              </Text>
            </View>
            <View style={{
              backgroundColor: theme.primary + '15',
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              <Ionicons name={getPaymentModeIcon(payment.mode_of_payment) as any} size={14} color={theme.primary} />
              <Text style={[getTypographyStyle('caption', theme), { color: theme.primary, fontWeight: '600' }]}>
                {getPaymentModeLabel(payment.mode_of_payment)}
              </Text>
            </View>
          </View>

          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <InfoRow
              label="Date"
              value={formatDate(payment.payment_date)}
              icon="calendar-outline"
              theme={theme}
            />
            {payment.notes && (
              <View style={{ marginTop: spacing.xs }}>
                <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary, marginBottom: 4 }]}>
                  Notes:
                </Text>
                <Text style={[getTypographyStyle('body', theme)]}>
                  {payment.notes}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </Animated.View>
  );
};
