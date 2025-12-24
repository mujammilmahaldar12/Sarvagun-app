import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  Dimensions,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useExpense, useExpensePhotos, useUpdateExpense, useDeleteExpense, useDeleteExpensePhoto } from '@/hooks/useFinanceQueries';
import { AppButton, ModuleHeader } from '@/components';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/authStore';
import { shadows, spacing, borderRadius, typography } from '@/constants/designSystem';

const { width, height } = Dimensions.get('window');

const ExpenseDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Queries
  const { data: expense, isLoading, refetch } = useExpense(Number(id));
  const { data: photos = [], refetch: refetchPhotos } = useExpensePhotos(Number(id));

  // Mutations
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const deletePhoto = useDeleteExpensePhoto();

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage;
  const canDelete = canManage;
  const canApprove = canManage;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchPhotos()]);
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push(`/finance/add-expense?id=${id}`);
  };

  const handleDelete = () => {
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
              await deleteExpense.mutateAsync(Number(id));
              Alert.alert('Success', 'Expense deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handleDeletePhoto = (photoId: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto.mutateAsync(photoId);
              refetchPhotos();
              Alert.alert('Success', 'Photo deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!approvalAction || !expense) return;

    const newStatus = approvalAction === 'approve' ? 'approved' : 'rejected';

    try {
      await updateExpense.mutateAsync({
        id: Number(id),
        data: {
          ...expense,
          payment_status: newStatus,
        },
      });

      setShowApprovalModal(false);
      setApprovalNotes('');
      Alert.alert('Success', `Expense ${newStatus} successfully`);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${approvalAction} expense`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return theme.textSecondary;
    }
  };

  const styles = createStyles(theme, isDark);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
        <Text style={styles.errorText}>Expense not found</Text>
        <AppButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModuleHeader
        title="Expense Details"
        showBackButton
        actions={
          <View style={styles.headerActions}>
            {canEdit && (
              <Pressable onPress={handleEdit} style={styles.headerButton}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </Pressable>
            )}
            {canDelete && (
              <Pressable onPress={handleDelete} style={styles.headerButtonDanger}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </Pressable>
            )}
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelSmall}>Expense ID</Text>
              <Text style={styles.expenseId}>#{expense.id}</Text>
            </View>
            <StatusBadge
              status={expense.payment_status}
              color={getStatusColor(expense.payment_status)}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View>
              <Text style={styles.labelSmall}>Particulars</Text>
              <Text style={styles.particulars}>{expense.particulars}</Text>
            </View>

            {expense.details && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.labelSmall}>Details</Text>
                <Text style={styles.detailText}>{expense.details}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSmall}>Expense Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(expense.expense_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.labelSmall}>Created By</Text>
                <Text style={styles.infoValue}>{expense.created_by || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amount Card */}
        <View style={[styles.card, styles.amountCard]}>
          <View style={styles.amountIcon}>
            <Ionicons name="wallet" size={24} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>
              ₹{Number(expense.amount).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.paymentMode}>
            <Text style={styles.paymentModeLabel}>Payment</Text>
            <Text style={styles.paymentModeValue}>
              {expense.mode_of_payment?.toUpperCase() || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Vendor Information */}
        {expense.vendor_details && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Vendor Information</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.labelSmall}>Vendor Name</Text>
                <Text style={styles.infoValue}>{expense.vendor_details.name}</Text>
              </View>
              {expense.vendor_details.contact_person && (
                <View style={styles.infoItem}>
                  <Text style={styles.labelSmall}>Contact Person</Text>
                  <Text style={styles.infoValue}>{expense.vendor_details.contact_person}</Text>
                </View>
              )}
              {expense.vendor_details.phone && (
                <View style={styles.infoItem}>
                  <Text style={styles.labelSmall}>Phone</Text>
                  <Text style={styles.infoValue}>{expense.vendor_details.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Event Information */}
        {expense.event_details && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Linked Event</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.labelSmall}>Event Name</Text>
                <Text style={styles.infoValue}>{expense.event_details.name}</Text>
              </View>
              {expense.event_details.client && (
                <View style={styles.infoItem}>
                  <Text style={styles.labelSmall}>Client</Text>
                  <Text style={styles.infoValue}>{expense.event_details.client.name}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bill Evidence */}
        {expense.bill_evidence && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Bill Evidence</Text>
            </View>
            <View style={styles.billEvidence}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.billEvidenceText}>Bill evidence available</Text>
            </View>
            {expense.bill_no && (
              <View style={styles.infoItem}>
                <Text style={styles.labelSmall}>Bill Number</Text>
                <Text style={styles.infoValue}>{expense.bill_no}</Text>
              </View>
            )}
          </View>
        )}

        {/* Photos Section */}
        {photos.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Bill Photos ({photos.length})</Text>
            </View>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setSelectedPhotoIndex(index)}
                  style={styles.photoItem}
                >
                  <Image
                    source={{ uri: photo.photo }}
                    style={styles.photoImage}
                    contentFit="cover"
                  />
                  {canDelete && (
                    <Pressable
                      onPress={() => handleDeletePhoto(photo.id)}
                      style={styles.photoDeleteBtn}
                    >
                      <Ionicons name="close" size={14} color="#FFF" />
                    </Pressable>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Reimbursement */}
        {expense.reimbursement_requested && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Reimbursement</Text>
            </View>
            <View style={styles.billEvidence}>
              <Ionicons name="cash" size={20} color={theme.primary} />
              <Text style={styles.billEvidenceText}>Reimbursement requested</Text>
            </View>
            {expense.reimbursement_status && (
              <View style={{ marginTop: spacing.sm }}>
                <StatusBadge
                  status={expense.reimbursement_status}
                  color={getStatusColor(expense.reimbursement_status)}
                />
              </View>
            )}
          </View>
        )}

        {/* Approval Actions */}
        {canApprove && expense.payment_status?.toLowerCase() === 'pending' && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Approval Actions</Text>
            </View>
            <View style={styles.actionButtons}>
              <AppButton
                title="Approve"
                onPress={() => handleApproval('approve')}
                variant="primary"
                leftIcon="checkmark-circle"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Reject"
                onPress={() => handleApproval('reject')}
                variant="secondary"
                leftIcon="close-circle"
                style={{ flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444' }}
              />
            </View>
          </View>
        )}

        {/* Notes */}
        {expense.notes && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{expense.notes}</Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Metadata</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Created At</Text>
            <Text style={styles.metadataValue}>
              {new Date(expense.created_at).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Updated At</Text>
            <Text style={styles.metadataValue}>
              {new Date(expense.updated_at).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoIndex(null)}
      >
        <View style={styles.photoModal}>
          <Pressable onPress={() => setSelectedPhotoIndex(null)} style={styles.photoModalClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>
          {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
            <View style={styles.photoModalContent}>
              <Image
                source={{ uri: photos[selectedPhotoIndex].photo }}
                style={styles.photoModalImage}
                contentFit="contain"
              />
              <Text style={styles.photoModalCounter}>
                {selectedPhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.approvalModalOverlay}>
          <View style={[styles.approvalModal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.approvalModalTitle, { color: theme.text }]}>
              {approvalAction === 'approve' ? 'Approve Expense' : 'Reject Expense'}
            </Text>
            <Text style={[styles.approvalModalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to {approvalAction} this expense?
            </Text>
            <View style={styles.approvalModalButtons}>
              <AppButton
                title="Cancel"
                onPress={() => {
                  setShowApprovalModal(false);
                  setApprovalNotes('');
                }}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <AppButton
                title="Confirm"
                onPress={submitApproval}
                variant="primary"
                style={{
                  flex: 1,
                  backgroundColor: approvalAction === 'reject' ? '#EF4444' : theme.primary,
                }}
                loading={updateExpense.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: theme.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.primary + '15',
  },
  headerButtonDanger: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EF444415',
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: 40,
  },
  // Card
  card: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.sm,
  },
  // Header Card
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseId: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: theme.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: spacing.md,
  },
  detailsSection: {
    gap: spacing.sm,
  },
  labelSmall: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  particulars: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: theme.text,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    color: theme.text,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.md,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: theme.text,
    marginTop: 2,
  },
  // Amount Card
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: isDark ? theme.primary + '20' : theme.primary + '10',
  },
  amountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: theme.primary,
  },
  amountValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '800',
    color: theme.primary,
  },
  paymentMode: {
    alignItems: 'flex-end',
  },
  paymentModeLabel: {
    fontSize: typography.sizes.xs,
    color: theme.textSecondary,
  },
  paymentModeValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: theme.text,
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: theme.text,
  },
  // Info List
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {},
  // Bill Evidence
  billEvidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billEvidenceText: {
    fontSize: typography.sizes.sm,
    color: theme.text,
  },
  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    width: (width - 72) / 3,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.background,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // Notes
  notesText: {
    fontSize: typography.sizes.sm,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  // Metadata
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metadataLabel: {
    fontSize: typography.sizes.sm,
    color: theme.textSecondary,
  },
  metadataValue: {
    fontSize: typography.sizes.sm,
    color: theme.text,
  },
  // Photo Modal
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  photoModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width,
    height: height * 0.8,
  },
  photoModalCounter: {
    position: 'absolute',
    bottom: 30,
    fontSize: typography.sizes.sm,
    color: '#FFF',
  },
  // Approval Modal
  approvalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  approvalModal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  approvalModalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  approvalModalMessage: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xl,
  },
  approvalModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

export default ExpenseDetail;
