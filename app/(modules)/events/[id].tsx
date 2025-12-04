import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { StatusBadge, InfoRow, KPICard, LoadingState } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { baseColors, spacing } from '@/constants/designSystem';
import eventsService from '@/services/events.service';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import type { Sales, Expense } from '@/types/events';

type TabType = 'info' | 'timeline' | 'documents';

// Finance Section Component
interface DetailSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  delay?: number;
}

const DetailSection = ({ title, icon, children, delay = 0 }: DetailSectionProps) => {
  const { theme } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.delay(delay).springify()}
      style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: theme.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{title}</Text>
      </View>
      <View style={{ gap: 12 }}>
        {children}
      </View>
    </Animated.View>
  );
};

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null | undefined;
  isLast?: boolean;
}

const DetailRow = ({ icon, label, value, isLast }: DetailRowProps) => {
  const { theme } = useTheme();
  if (!value) return null;
  return (
    <View style={{
      flexDirection: 'row',
      gap: 12,
      paddingBottom: isLast ? 0 : 12,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: theme.border,
    }}>
      <View style={{ width: 20, alignItems: 'center' }}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500', lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
};

interface FinanceSectionProps {
  eventId: number;
}

const FinanceSection: React.FC<FinanceSectionProps> = ({ eventId }) => {
  const { theme } = useTheme();
  const router = useRouter();

  // Fetch sales
  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['eventSales', eventId],
    queryFn: () => eventsService.getEventSales(eventId),
    enabled: !!eventId && !isNaN(eventId),
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['eventExpenses', eventId],
    queryFn: () => eventsService.getEventExpenses(eventId),
    enabled: !!eventId && !isNaN(eventId),
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['eventFinanceSummary', eventId],
    queryFn: () => eventsService.getEventFinanceSummary(eventId),
    enabled: !!eventId && !isNaN(eventId),
  });

  const totalSales = sales.reduce((sum: number, sale: any) => sum + Number(sale.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;

  const completedSales = sales.filter((s: any) => s.payment_status === 'completed').length;
  const paidExpenses = expenses.filter((e: any) => e.payment_status === 'paid').length;

  if (salesLoading || expensesLoading) {
    return (
      <View style={{ gap: 12, paddingVertical: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
          Sales & Expenses
        </Text>
        <LoadingState variant="skeleton" skeletonCount={3} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: 16 }}>
      {/* Header with action button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
          Sales & Expenses
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.primary + '20',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
          onPress={() => {
            // Navigate to finance management (can be implemented later)
            Alert.alert('Info', 'Finance management coming soon!');
          }}
        >
          <Ionicons name="cash" size={16} color={theme.primary} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>
            Manage
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
          <KPICard
            title="Total Sales"
            value={`₹${totalSales.toLocaleString('en-IN')}`}
            icon="trending-up"
            color="#10b981"
            subtitle={`${completedSales}/${sales.length} completed`}
          />
          <KPICard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString('en-IN')}`}
            icon="trending-down"
            color="#ef4444"
            subtitle={`${paidExpenses}/${expenses.length} paid`}
          />
          <KPICard
            title="Net Profit"
            value={`₹${netProfit.toLocaleString('en-IN')}`}
            icon={netProfit >= 0 ? 'checkmark-circle' : 'alert-circle'}
            color={netProfit >= 0 ? '#6366f1' : '#f59e0b'}
          />
        </View>
      </ScrollView>

      {/* Sales List */}
      {sales.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
              Recent Sales ({sales.length})
            </Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {sales.slice(0, 3).map((sale: any, index: number) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.surface,
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor:
                  sale.payment_status === 'completed' ? '#10b981' :
                    sale.payment_status === 'pending' ? '#f59e0b' : '#94a3b8',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>
                  ₹{Number(sale.amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {new Date(sale.date).toLocaleDateString('en-IN')} • {sale.payment_status}
                </Text>
                {sale.discount > 0 && (
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                    Discount: ₹{Number(sale.discount).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
              <Ionicons
                name={
                  sale.payment_status === 'completed' ? 'checkmark-circle' :
                    sale.payment_status === 'pending' ? 'time' : 'alert-circle'
                }
                size={20}
                color={
                  sale.payment_status === 'completed' ? '#10b981' :
                    sale.payment_status === 'pending' ? '#f59e0b' : '#94a3b8'
                }
              />
            </View>
          ))}
        </View>
      )}

      {/* Expenses List */}
      {expenses.length > 0 && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
              Recent Expenses ({expenses.length})
            </Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {expenses.slice(0, 3).map((expense: any, index: number) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.surface,
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor:
                  expense.payment_status === 'paid' ? '#10b981' :
                    expense.payment_status === 'partial_paid' ? '#f59e0b' : '#ef4444',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>
                  {expense.particulars}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginTop: 2 }}>
                  ₹{Number(expense.amount || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {new Date(expense.date).toLocaleDateString('en-IN')} • {expense.payment_status}
                </Text>
                {expense.mode_of_payment && (
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                    via {expense.mode_of_payment}
                  </Text>
                )}
              </View>
              <Ionicons
                name={
                  expense.payment_status === 'paid' ? 'checkmark-circle' :
                    expense.payment_status === 'partial_paid' ? 'time' : 'close-circle'
                }
                size={20}
                color={
                  expense.payment_status === 'paid' ? '#10b981' :
                    expense.payment_status === 'partial_paid' ? '#f59e0b' : '#ef4444'
                }
              />
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {sales.length === 0 && expenses.length === 0 && (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Ionicons name="cash-outline" size={48} color={theme.textSecondary} />
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12, textAlign: 'center' }}>
            No financial records yet
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
            Add sales and expenses to track event finances
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default function EventDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const itemType = type || 'leads'; // 'leads', 'events', 'clients', 'venues'

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage || item?.created_by === user?.id;
  const canDelete = canManage;

  // Safe back navigation helper
  const safeGoBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(modules)/events');
    }
  };

  useEffect(() => {
    fetchItemDetails();
  }, [id, type]);

  const fetchItemDetails = async () => {
    setLoading(true);

    try {
      let data;
      const itemId = parseInt(id);

      switch (itemType) {
        case 'leads':
          data = await eventsService.getLead(itemId);
          break;
        case 'events':
          data = await eventsService.getEvent(itemId);
          break;
        case 'clients':
          data = await eventsService.getClient(itemId);
          break;
        case 'venues':
          data = await eventsService.getVenue(itemId);
          break;
        default:
          safeGoBack();
          return;
      }

      setItem(data);
    } catch (error: any) {
      safeGoBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (itemType === 'leads') {
      router.push(`/(modules)/events/add-lead?id=${id}` as any);
    } else {
      router.push(`/(modules)/events/add-event?id=${id}` as any);
    }
  };

  const handleDelete = async () => {
    const itemName = itemType.slice(0, -1); // Remove 's' from plural
    try {
      const itemId = parseInt(id);
      switch (itemType) {
        case 'leads':
          await eventsService.rejectLead(itemId, 'Deleted by user');
          break;
        case 'events':
          await eventsService.deleteEvent(itemId);
          break;
        case 'clients':
          await eventsService.deleteClient(itemId);
          break;
        case 'venues':
          await eventsService.deleteVenue(itemId);
          break;
      }
      safeGoBack();
    } catch (error: any) {
      // Silent error
    }
  };

  // UI Helper Components
  const renderInfoTab = () => {
    if (!item) return null;

    if (itemType === 'leads') {
      return (
        <View style={{ padding: 16 }}>
          {/* Quick Actions - Only show for pending leads */}
          {item.status === 'pending' && !item.reject && !item.convert && (
            <Animated.View entering={FadeIn.delay(300)} style={{ gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingVertical: 16,
                  borderRadius: 14,
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={() => router.push(`/(modules)/events/convert-lead?leadId=${id}` as any)}
              >
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Convert to Event</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={handleEdit}
                >
                  <Ionicons name="create-outline" size={20} color={theme.text} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#ef4444' + '10',
                    borderWidth: 1,
                    borderColor: '#ef4444' + '30',
                  }}
                  onPress={handleDelete}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Client Information Section */}
          <DetailSection title="Client Information" icon="person" delay={0}>
            <DetailRow icon="person-outline" label="Name" value={item.client?.name} />
            <DetailRow icon="call-outline" label="Phone" value={item.client?.number} />
            <DetailRow icon="mail-outline" label="Email" value={item.client?.email} />
            <DetailRow icon="call-outline" label="Alternate Phone" value={item.client?.alternate_number} isLast />
          </DetailSection>

          {/* Lead Details Section */}
          <DetailSection title="Lead Details" icon="document-text" delay={100}>
            <DetailRow icon="globe-outline" label="Source" value={item.source ? item.source.charAt(0).toUpperCase() + item.source.slice(1) : null} />
            <DetailRow icon="flag-outline" label="Status" value={item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : null} />
            <DetailRow icon="person-circle-outline" label="Created By" value={item.user_name} />
            <DetailRow icon="chatbubble-ellipses-outline" label="Message" value={item.message} />
            <DetailRow icon="ribbon-outline" label="Referral Source" value={item.referral} />
            <DetailRow icon="calendar-outline" label="Created Date" value={item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <DetailRow icon="time-outline" label="Last Updated" value={item.updated_at && item.updated_at !== item.created_at ? new Date(item.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} isLast />
          </DetailSection>

          {/* Conversion Info (if converted) */}
          {item.convert && item.event_id && (
            <DetailSection title="Conversion Info" icon="checkmark-circle" delay={200}>
              <DetailRow icon="calendar-outline" label="Converted Event ID" value={`#${item.event_id}`} isLast />
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 8,
                  backgroundColor: pressed ? theme.primary + '90' : theme.primary,
                })}
                onPress={() => router.push(`/(modules)/events/${item.event_id}?type=events` as any)}
              >
                <Ionicons name="eye-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>View Event</Text>
              </Pressable>
            </DetailSection>
          )}
        </View>
      );
    } else if (itemType === 'events') {
      return (
        <View style={styles.content}>
          {/* Event Information */}
          <View style={styles.section}>
            <Text style={[getTypographyStyle('lg', 'semibold'), { color: theme.text }]}>
              Event Information
            </Text>
            <InfoRow label="Event Name" value={item.name} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Start Date" value={item.start_date ? new Date(item.start_date).toLocaleDateString('en-IN') : 'N/A'} />
            <InfoRow label="End Date" value={item.end_date ? new Date(item.end_date).toLocaleDateString('en-IN') : 'N/A'} />
            <InfoRow label="Created By" value={item.created_by_name || 'N/A'} />
          </View>

          {/* Client Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Client Information
            </Text>
            <InfoRow label="Client Name" value={item.client?.name || 'N/A'} />
            <InfoRow label="Contact" value={item.client?.number || 'N/A'} />
            <InfoRow label="Email" value={item.client?.email || 'N/A'} />
          </View>

          {/* Venue Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Venue Information
            </Text>
            <InfoRow label="Venue" value={item.venue?.name || 'N/A'} />
            <InfoRow label="Address" value={item.venue?.address || 'N/A'} />
            <InfoRow label="Capacity" value={item.venue?.capacity?.toString() || 'N/A'} />
            <InfoRow label="Contact Person" value={item.venue?.contact_person || 'N/A'} />
            <InfoRow label="Contact Phone" value={item.venue?.contact_phone || 'N/A'} />
          </View>

          {/* Financial Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Financial Information
            </Text>
            <InfoRow label="Total Budget" value={item.total_budget ? `₹${item.total_budget.toLocaleString('en-IN')}` : 'N/A'} />
          </View>

          {/* Sales & Expenses - Enhanced */}
          <FinanceSection eventId={parseInt(id)} />

          {/* Additional Details */}
          {item.active_days?.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                Active Days
              </Text>
              <Text style={{ fontSize: 14, color: theme.text }}>
                {item.active_days.map((day: any) =>
                  new Date(day.date).toLocaleDateString('en-IN')
                ).join(', ')}
              </Text>
            </View>
          )}

          {/* Vendors Information */}
          {item.vendors?.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                Assigned Vendors
              </Text>
              {item.vendors.map((vendor: any, index: number) => (
                <View key={index} style={{
                  backgroundColor: theme.surface,
                  padding: 12,
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.primary,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>
                    {vendor.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                    {vendor.organization_name}
                  </Text>
                  {vendor.category && (
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                      {vendor.category}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else if (itemType === 'clients') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Client Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Client Information
            </Text>
            <InfoRow label="Name" value={item.name} />
            <InfoRow label="Contact Number" value={item.number || 'N/A'} />
            <InfoRow label="Email" value={item.email || 'N/A'} />
            <InfoRow label="Lead Person" value={item.leadperson || 'N/A'} />
            <InfoRow label="Bookings Count" value={item.bookings_count?.toString() || '0'} />
          </View>

          {/* Category & Organisation */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Classification
            </Text>
            {item.category?.length > 0 && (
              <InfoRow label="Categories" value={item.category.map((c: any) => c.name).join(', ')} />
            )}
            {item.organisation?.length > 0 && (
              <InfoRow label="Organisations" value={item.organisation.map((o: any) => o.name).join(', ')} />
            )}
          </View>
        </View>
      );
    } else if (itemType === 'venues') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Venue Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Venue Information
            </Text>
            <InfoRow label="Name" value={item.name} />
            <InfoRow label="Address" value={item.address || 'N/A'} />
            <InfoRow label="Capacity" value={item.capacity?.toString() || 'N/A'} />
          </View>

          {/* Contact Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Contact Information
            </Text>
            <InfoRow label="Contact Person" value={item.contact_person || 'N/A'} />
            <InfoRow label="Contact Phone" value={item.contact_phone || 'N/A'} />
          </View>
        </View>
      );
    }

    return null;
  };

  const renderTimelineTab = () => (
    <View style={styles.content}>
      <Text style={[getTypographyStyle('base', 'regular'), { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.xl }]}>
        Timeline coming soon
      </Text>
    </View>
  );

  const renderDocumentsTab = () => (
    <View style={styles.content}>
      <Text style={[getTypographyStyle('base', 'regular'), { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.xl }]}>
        Documents coming soon
      </Text>
    </View>
  );

  const tabs = [
    { key: 'info' as TabType, label: 'Info' },
    { key: 'timeline' as TabType, label: 'Timeline' },
    { key: 'documents' as TabType, label: 'Documents' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const getTitle = () => {
    switch (itemType) {
      case 'leads':
        return item?.client?.name || 'Lead Details';
      case 'events':
        return item?.name || 'Event Details';
      case 'clients':
        return item?.name || 'Client Details';
      case 'venues':
        return item?.name || 'Venue Details';
      default:
        return 'Details';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ModuleHeader
        title={getTitle()}
        showBack
        onBack={safeGoBack}
        rightActions={
          <View style={styles.headerActions}>
            {itemType === 'events' && canManage && (
              <>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/(modules)/events/manage-active-days',
                      params: {
                        eventId: id,
                        eventName: item?.name || 'Event',
                        startDate: item?.start_date || '',
                        endDate: item?.end_date || '',
                      }
                    } as any);
                  }}
                  style={({ pressed }) => ({
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? '#10b981' + '20' : '#10b981',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  })}
                >
                  <Ionicons name="calendar" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Days</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/(modules)/events/manage-vendors',
                      params: { eventId: id, eventName: item?.name || 'Event' }
                    } as any);
                  }}
                  style={({ pressed }) => ({
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.primary + '20' : theme.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  })}
                >
                  <Ionicons name="people" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Vendors</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/(modules)/events/manage-goods',
                      params: { id: id }
                    } as any);
                  }}
                  style={({ pressed }) => ({
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? theme.primary + '20' : theme.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  })}
                >
                  <Ionicons name="cube" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Goods</Text>
                </Pressable>
              </>
            )}
          </View>
        }
      />

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
        variant="underline"
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
});
