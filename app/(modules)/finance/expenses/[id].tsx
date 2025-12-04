/**
 * Expense Detail Screen
 * Shows expense details with photos, vendor info, event linking, edit/delete functionality
 */
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, RefreshControl, TouchableOpacity, Image, Dimensions } from 'react-native';
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
import type { Expense, ExpensePhoto } from '@/types/finance';

type TabType = 'details' | 'photos';

const { width } = Dimensions.get('window');

export default function ExpenseDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const expenseId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Fetch expense details
  const { data: expense, isLoading, error, refetch } = useQuery<Expense>({
    queryKey: ['expense', expenseId],
    queryFn: () => financeService.getExpense(expenseId),
    enabled: !!expenseId && !isNaN(expenseId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/(modules)/finance/add-expense?id=${expenseId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await financeService.deleteExpense(expenseId);
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
              Alert.alert('Success', 'Expense deleted successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const tabs: Tab<TabType>[] = [
    { id: 'details', label: 'Details', icon: 'information-circle' },
    { id: 'photos', label: 'Photos', icon: 'images', badge: expense?.photos?.length || (expense?.photo ? 1 : 0) },
  ];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Expense Details" showBack />
        <LoadingState variant="skeleton" skeletonCount={5} />
      </View>
    );
  }

  if (error || !expense) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Expense Details" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[getTypographyStyle('h2', theme), { marginTop: spacing.md, textAlign: 'center' }]}>
            Failed to load expense
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

  const event = typeof expense.event === 'object' ? expense.event : null;
  const vendor = typeof expense.vendor === 'object' ? expense.vendor : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return theme.success;
      case 'partial_paid':
        return theme.warning;
      case 'not_paid':
        return theme.error;
      default:
        return theme.textSecondary;
    }
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
        title="Expense Details"
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
        {/* KPI Card */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <KPICard
            title="Expense Amount"
            value={formatCurrency(expense.amount)}
            icon="cash"
            color={theme.error}
          />
        </View>

        {/* Tabs */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <View style={{ padding: spacing.md }}>
          {activeTab === 'details' && <DetailsTab expense={expense} event={event} vendor={vendor} theme={theme} />}
          {activeTab === 'photos' && <PhotosTab expense={expense} theme={theme} />}
        </View>
      </ScrollView>
    </View>
  );
}

// Details Tab Component
interface DetailsTabProps {
  expense: Expense;
  event: any;
  vendor: any;
  theme: any;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ expense, event, vendor, theme }) => {
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

      {/* Vendor Info Card */}
      {vendor && (
        <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
          <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
            VENDOR DETAILS
          </Text>
          <InfoRow
            label="Vendor Name"
            value={vendor.name || 'N/A'}
            icon="business"
            theme={theme}
          />
          {vendor.organization_name && (
            <InfoRow
              label="Organization"
              value={vendor.organization_name}
              icon="briefcase"
              theme={theme}
            />
          )}
          {vendor.contact_number && (
            <InfoRow
              label="Contact"
              value={vendor.contact_number}
              icon="call"
              theme={theme}
            />
          )}
          {vendor.email && (
            <InfoRow
              label="Email"
              value={vendor.email}
              icon="mail"
              theme={theme}
            />
          )}
          {vendor.category && (
            <InfoRow
              label="Category"
              value={vendor.category}
              icon="pricetags"
              theme={theme}
            />
          )}
        </View>
      )}

      {/* Expense Info Card */}
      <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
          EXPENSE INFORMATION
        </Text>
        <InfoRow
          label="Particulars"
          value={expense.particulars || 'N/A'}
          icon="list"
          theme={theme}
        />
        <InfoRow
          label="Amount"
          value={formatCurrency(expense.amount)}
          icon="cash"
          theme={theme}
          valueStyle={{ fontWeight: '700', fontSize: 16, color: theme.error }}
        />
        <InfoRow
          label="Expense Date"
          value={formatDate(expense.expense_date)}
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
            status={expense.payment_status}
            variant={
              expense.payment_status === 'paid'
                ? 'success'
                : expense.payment_status === 'partial_paid'
                ? 'warning'
                : 'error'
            }
          />
        </View>
        {expense.details && (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary, marginBottom: 4 }]}>
              Details:
            </Text>
            <Text style={[getTypographyStyle('body', theme)]}>
              {expense.details}
            </Text>
          </View>
        )}
      </View>

      {/* Payment Info Card */}
      <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
          PAYMENT INFORMATION
        </Text>
        <InfoRow
          label="Mode of Payment"
          value={expense.mode_of_payment || 'N/A'}
          icon="card"
          theme={theme}
        />
        <InfoRow
          label="Payment Made By"
          value={expense.payment_made_by || 'N/A'}
          icon="person"
          theme={theme}
        />
        {expense.booked_by && (
          <InfoRow
            label="Booked By"
            value={expense.booked_by}
            icon="person-circle"
            theme={theme}
          />
        )}
        {expense.paid_to && (
          <InfoRow
            label="Paid To"
            value={expense.paid_to}
            icon="person-add"
            theme={theme}
          />
        )}
      </View>

      {/* Bill Info Card */}
      <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
          BILL INFORMATION
        </Text>
        <InfoRow
          label="Bill Evidence"
          value={expense.bill_evidence === 'yes' ? 'Available' : 'Not Available'}
          icon="document-text"
          theme={theme}
          valueStyle={{
            color: expense.bill_evidence === 'yes' ? theme.success : theme.textSecondary,
          }}
        />
        {expense.bill_no && (
          <InfoRow
            label="Bill Number"
            value={expense.bill_no}
            icon="barcode"
            theme={theme}
          />
        )}
        <InfoRow
          label="Reimbursed"
          value={expense.reimbursed || 'N/A'}
          icon="repeat"
          theme={theme}
        />
      </View>

      {/* Meta Info Card */}
      {(expense.created_by_name || expense.created_at) && (
        <View style={[getCardStyle(theme), { padding: spacing.md, gap: spacing.sm }]}>
          <Text style={[getTypographyStyle('label', theme), { color: theme.textSecondary }]}>
            RECORD INFORMATION
          </Text>
          {expense.created_by_name && (
            <InfoRow
              label="Created By"
              value={expense.created_by_name}
              icon="person-circle"
              theme={theme}
            />
          )}
          {expense.created_at && (
            <InfoRow
              label="Created At"
              value={formatDate(expense.created_at)}
              icon="time"
              theme={theme}
            />
          )}
          {expense.updated_at && (
            <InfoRow
              label="Updated At"
              value={formatDate(expense.updated_at)}
              icon="refresh"
              theme={theme}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
};

// Photos Tab Component
interface PhotosTabProps {
  expense: Expense;
  theme: any;
}

const PhotosTab: React.FC<PhotosTabProps> = ({ expense, theme }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const photos = expense.photos || [];
  // Also include legacy photo field if present
  if (expense.photo && !photos.find(p => p.photo === expense.photo)) {
    photos.push({
      id: 0,
      expense: expense.id,
      photo: expense.photo,
      uploaded_at: expense.created_at,
    });
  }

  if (photos.length === 0) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 2 }}>
        <Ionicons name="images-outline" size={64} color={theme.textSecondary} opacity={0.3} />
        <Text style={[getTypographyStyle('h3', theme), { marginTop: spacing.md, color: theme.textSecondary }]}>
          No Photos
        </Text>
        <Text style={[getTypographyStyle('body', theme), { marginTop: spacing.xs, color: theme.textSecondary }]}>
          No bill or receipt photos available
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id || index}
            onPress={() => setSelectedPhoto(photo.photo)}
            style={{
              width: (width - spacing.md * 2 - spacing.sm * 2) / 3,
              aspectRatio: 1,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: theme.border,
            }}
          >
            <Image
              source={{ uri: photo.photo }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            {photo.description && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: spacing.xs,
                }}
              >
                <Text
                  style={[getTypographyStyle('caption', theme), { color: '#fff' }]}
                  numberOfLines={1}
                >
                  {photo.description}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <Pressable
          style={{
            position: 'absolute',
            top: -spacing.md,
            left: -spacing.md,
            right: -spacing.md,
            bottom: -spacing.md,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onPress={() => setSelectedPhoto(null)}
        >
          <Image
            source={{ uri: selectedPhoto }}
            style={{ width: '90%', height: '80%' }}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => setSelectedPhoto(null)}
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: spacing.sm,
              borderRadius: 20,
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      )}
    </Animated.View>
  );
};
