/**
 * Invoice Detail Screen
 * Shows invoice details with line items, client/event info, PDF generation
 */
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, RefreshControl, TouchableOpacity, Share } from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { InfoRow, KPICard, LoadingState } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/constants/designSystem';
import financeService from '@/services/finance.service';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import type { Invoice, InvoiceItem } from '@/types/finance';

type TabType = 'details' | 'items';

export default function InvoiceDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const invoiceId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch invoice details
  const { data: invoice, isLoading, error, refetch } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: () => financeService.getInvoice(invoiceId),
    enabled: !!invoiceId && !isNaN(invoiceId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/(modules)/finance/add-invoice?id=${invoiceId}`);
  };

  const handleDelete = () => {
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
              await financeService.deleteInvoice(invoiceId);
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              Alert.alert('Success', 'Invoice deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    Alert.alert(
      'Download Invoice',
      'Choose download format:',
      [
        {
          text: 'PDF',
          onPress: async () => {
            try {
              // TODO: Implement actual PDF generation endpoint
              Alert.alert('Downloading', 'PDF download will be implemented with backend endpoint');
              // const pdfUrl = await financeService.generateInvoicePDF(invoiceId);
              // await Share.share({ url: pdfUrl, message: `Invoice ${invoice.invoice_number}` });
            } catch (error) {
              Alert.alert('Error', 'Failed to generate PDF');
            }
          },
        },
        {
          text: 'Excel',
          onPress: async () => {
            try {
              Alert.alert('Downloading', 'Excel export will be implemented with backend endpoint');
            } catch (error) {
              Alert.alert('Error', 'Failed to export Excel');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleShareInvoice = async () => {
    if (!invoice) return;
    try {
      await Share.share({
        message: `Invoice: ${invoice.invoice_number}\nClient: ${invoice.client_name || 'N/A'}\nAmount: ${formatCurrency(invoice.final_amount)}\nDate: ${formatDate(invoice.date)}`,
        title: `Invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const tabs: Tab[] = [
    { key: 'details', label: 'Details', icon: 'information-circle' },
    { key: 'items', label: 'Line Items', icon: 'list', badge: invoice?.items?.length },
  ];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Invoice Details" showBack />
        <LoadingState variant="skeleton" skeletonCount={5} />
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Invoice Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[getTypographyStyle('2xl'), { marginTop: spacing.md, textAlign: 'center', color: theme.text }]}>
            Failed to load invoice
          </Text>
          <Text style={[getTypographyStyle('base'), { marginTop: spacing.sm, textAlign: 'center', color: theme.textSecondary }]}>
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

  const client = typeof invoice.client === 'object' ? invoice.client : null;
  const event = typeof invoice.event === 'object' ? invoice.event : null;
  const cgst = parseFloat(invoice.cgst || '0');
  const sgst = parseFloat(invoice.sgst || '0');
  const totalTax = cgst + sgst;

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
        title="Invoice Details"
        showBack
        rightActions={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleDownloadPDF}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: '#10B981',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="download" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: theme.primary,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="create" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                padding: 10,
                backgroundColor: theme.error + '15',
                borderRadius: 8,
              }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Invoice Header Card */}
        <View style={[getCardStyle(theme.surface), { margin: 16, padding: 20, borderRadius: 12 }]}>
          {/* Client Name - Most Prominent */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1, marginBottom: 6 }}>
              CLIENT
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
              {client?.name || invoice.client_name || 'N/A'}
            </Text>
          </View>

          {/* Invoice Number and Date Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border + '30' }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                INVOICE NUMBER
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.primary }}>
                {invoice.invoice_number}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>
                DATE
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                {formatDate(invoice.date)}
              </Text>
            </View>
          </View>
        </View>

        {/* KPI Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        >
          <KPICard
            title="Total Amount"
            value={formatCurrency(invoice.total_amount)}
            icon="cash"
            color={theme.primary}
          />
          <KPICard
            title="Discount"
            value={formatCurrency(invoice.discount || 0)}
            icon="pricetag"
            color={theme.warning}
          />
          {totalTax > 0 && (
            <KPICard
              title="Tax (GST)"
              value={formatCurrency(totalTax)}
              icon="receipt"
              color={theme.info}
            />
          )}
          <KPICard
            title="Final Amount"
            value={formatCurrency(invoice.final_amount)}
            icon="calculator"
            color={theme.success}
          />
        </ScrollView>

        {/* Tabs */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabType)} />

        <View style={{ padding: spacing.md }}>
          {activeTab === 'details' && <DetailsTab invoice={invoice} client={client} event={event} theme={theme} />}
          {activeTab === 'items' && <ItemsTab items={invoice.items || []} theme={theme} />}
        </View>
      </ScrollView>
    </View>
  );
}

// Details Tab Component
interface DetailsTabProps {
  invoice: Invoice;
  client: any;
  event: any;
  theme: any;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ invoice, client, event, theme }) => {
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

  const cgst = parseFloat(invoice.cgst || '0');
  const sgst = parseFloat(invoice.sgst || '0');

  return (
    <Animated.View entering={FadeIn} style={{ gap: 16 }}>
      {/* Client Info Card */}
      <View style={[getCardStyle(theme.surface), { padding: 20, borderRadius: 12 }]}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5, marginBottom: 16 }}>
          CLIENT INFORMATION
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person" size={18} color={theme.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Client Name</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                {client?.name || invoice.client_name || 'N/A'}
              </Text>
            </View>
          </View>

          {client?.organisation && client.organisation.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="business" size={18} color={theme.primary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Organization</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                  {client.organisation.map((org: any) => typeof org === 'object' ? org.name : org).join(', ')}
                </Text>
              </View>
            </View>
          )}

          {client?.number && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call" size={18} color={theme.primary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Contact</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{client.number}</Text>
              </View>
            </View>
          )}

          {client?.email && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="mail" size={18} color={theme.primary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Email</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{client.email}</Text>
              </View>
            </View>
          )}

          {client?.leadperson && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="person-circle" size={18} color={theme.primary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Lead Person</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{client.leadperson}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Event Info Card */}
      {event && (
        <View style={[getCardStyle(theme.surface), { padding: spacing.md }]}>
          <Text style={[getTypographyStyle('sm'), { color: theme.textSecondary, marginBottom: spacing.sm }]}>
            EVENT DETAILS
          </Text>
          <View style={{ gap: spacing.sm }}>
            <InfoRow
              label="Event Name"
              value={event.name || invoice.event_name || 'N/A'}
              icon="calendar"
            />
            {event.type_of_event && (
              <InfoRow
                label="Event Type"
                value={event.type_of_event}
                icon="pricetags"
              />
            )}
            {event.venue && (
              <InfoRow
                label="Venue"
                value={typeof event.venue === 'object' ? event.venue.name : 'N/A'}
                icon="location"

              />
            )}
            {event.event_date && (
              <InfoRow
                label="Event Date"
                value={formatDate(event.event_date)}
                icon="time"

              />
            )}
          </View>
        </View>
      )}

      {/* Invoice Amount Breakdown */}
      <View style={[getCardStyle(theme.surface), { padding: 20, borderRadius: 12, backgroundColor: theme.surface }]}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5, marginBottom: 16 }}>
          AMOUNT BREAKDOWN
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: theme.text }}>Subtotal</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
              {formatCurrency(invoice.total_amount)}
            </Text>
          </View>

          {invoice.discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: theme.text }}>Discount</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#F59E0B' }}>
                - {formatCurrency(invoice.discount)}
              </Text>
            </View>
          )}

          {cgst > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: theme.text }}>CGST</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                {formatCurrency(cgst)}
              </Text>
            </View>
          )}

          {sgst > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: theme.text }}>SGST</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                {formatCurrency(sgst)}
              </Text>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, backgroundColor: theme.primary + '10', paddingHorizontal: 12, borderRadius: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Final Amount</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.success }}>
              {formatCurrency(invoice.final_amount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Meta Info Card */}
      <View style={[getCardStyle(theme.surface), { padding: spacing.md }]}>
        <Text style={[getTypographyStyle('sm'), { color: theme.textSecondary, marginBottom: spacing.sm }]}>
          RECORD INFORMATION
        </Text>
        <View style={{ gap: spacing.sm }}>
          <InfoRow
            label="Created At"
            value={formatDate(invoice.created_at)}
            icon="time"

          />
          {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
            <InfoRow
              label="Updated At"
              value={formatDate(invoice.updated_at)}
              icon="refresh"

            />
          )}
          <InfoRow
            label="Line Items"
            value={`${invoice.items?.length || 0} item(s)`}
            icon="list"

          />
        </View>
      </View>
    </Animated.View>
  );
};

// Items Tab Component
interface ItemsTabProps {
  items: InvoiceItem[];
  theme: any;
}

const ItemsTab: React.FC<ItemsTabProps> = ({ items, theme }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!items || items.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 }}>
        <Ionicons name="list-outline" size={64} color={theme.textSecondary} opacity={0.3} />
        <Text style={[getTypographyStyle('lg'), { marginTop: spacing.md, color: theme.textSecondary }]}>
          No Line Items
        </Text>
        <Text style={[getTypographyStyle('base'), { marginTop: spacing.xs, color: theme.textSecondary }]}>
          This invoice has no line items
        </Text>
      </View>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Animated.View entering={FadeIn} style={{ gap: spacing.sm }}>
      {/* Line Items */}
      {items.map((item, index) => (
        <View key={item.id || index} style={{
          backgroundColor: theme.surface,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.primary + '10',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.primary }}>
                {item.sr_no || index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                {item.particulars}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                Qty: {item.quantity}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      ))}

      {/* Total Summary */}
      <View style={[getCardStyle(theme.surface), { padding: spacing.md, backgroundColor: theme.primary + '10' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="calculator" size={20} color={theme.primary} />
            <Text style={[getTypographyStyle('lg'), { color: theme.primary }]}>
              Total ({items.length} items)
            </Text>
          </View>
          <Text style={[getTypographyStyle('2xl'), { color: theme.primary }]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
