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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useExpense, useExpensePhotos, useUpdateExpense, useDeleteExpense, useDeleteExpensePhoto } from '@/hooks/useFinanceQueries';
import { getTypographyStyle } from '@/constants/designSystem';
import { AppButton, ModuleHeader } from '@/components';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthStore } from '@/store/authStore';

const { width, height } = Dimensions.get('window');

const ExpenseDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
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

  // Simple permission checks based on user category
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
          // Backend should automatically set approved_by and approved_at
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
          Loading expense details...
        </Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
        <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text, marginTop: 12, textAlign: 'center' }}>
          Expense not found
        </Text>
        <AppButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

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

  const getReimbursementStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return '#10B981';
      case 'pending':
      case 'requested':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return theme.textSecondary;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Expense Details"
        showBackButton
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {canEdit && (
              <Pressable
                onPress={handleEdit}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? theme.primary + '20' : 'transparent',
                })}
              >
                <Ionicons name="pencil" size={20} color={theme.primary} />
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#EF444420' : 'transparent',
                })}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
              </Pressable>
            )}
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
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
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Expense ID
              </Text>
              <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.primary, marginTop: 2 }}>
                #{expense.id}
              </Text>
            </View>
            <StatusBadge
              status={expense.payment_status}
              color={getStatusColor(expense.payment_status)}
            />
          </View>

          <View style={{ height: 1, backgroundColor: theme.border }} />

          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Particulars
              </Text>
              <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text, marginTop: 4 }}>
                {expense.particulars}
              </Text>
            </View>

            {expense.details && (
              <View>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Details
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 4 }}>
                  {expense.details}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Expense Date
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 4 }}>
                  {new Date(expense.expense_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Created By
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 4 }}>
                  {expense.created_by || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amount Card */}
        <View
          style={{
            backgroundColor: theme.primary + '10',
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
          }}
        >
          <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.primary }}>
            Total Amount
          </Text>
          <Text style={{ ...getTypographyStyle('2xl', 'bold'), color: theme.primary, marginTop: 4 }}>
            ₹{Number(expense.amount).toLocaleString('en-IN')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <View>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Payment Mode
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                {expense.mode_of_payment?.toUpperCase() || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vendor Information */}
        {expense.vendor_details && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
              Vendor Information
            </Text>
            <View style={{ gap: 8 }}>
              <View>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Vendor Name
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                  {expense.vendor_details.name}
                </Text>
              </View>
              {expense.vendor_details.contact_person && (
                <View>
                  <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                    Contact Person
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 2 }}>
                    {expense.vendor_details.contact_person}
                  </Text>
                </View>
              )}
              {expense.vendor_details.phone && (
                <View>
                  <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                    Phone
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 2 }}>
                    {expense.vendor_details.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Event Information */}
        {expense.event_details && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
              Linked Event
            </Text>
            <View style={{ gap: 8 }}>
              <View>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Event Name
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                  {expense.event_details.name}
                </Text>
              </View>
              {expense.event_details.client && (
                <View>
                  <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                    Client
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 2 }}>
                    {expense.event_details.client.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bill Evidence */}
        {expense.bill_evidence && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
              Bill Evidence
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
                Bill evidence available
              </Text>
            </View>
            {expense.bill_no && (
              <View>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Bill Number
                </Text>
                <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                  {expense.bill_no}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Photos Section */}
        {photos.length > 0 && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
                Bill Photos ({photos.length})
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setSelectedPhotoIndex(index)}
                  style={{
                    width: (width - 72) / 3,
                    height: (width - 72) / 3,
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: theme.background,
                  }}
                >
                  <Image
                    source={{ uri: photo.photo }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  {canDelete && (
                    <Pressable
                      onPress={() => handleDeletePhoto(photo.id)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="close" size={16} color="#FFF" />
                    </Pressable>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Reimbursement Information */}
        {expense.reimbursement_requested && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
              Reimbursement
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
                Reimbursement requested
              </Text>
            </View>
            {expense.reimbursement_status && (
              <View>
                <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                  Status
                </Text>
                <StatusBadge
                  status={expense.reimbursement_status}
                  color={getReimbursementStatusColor(expense.reimbursement_status)}
                  style={{ marginTop: 4, alignSelf: 'flex-start' }}
                />
              </View>
            )}
          </View>
        )}

        {/* Approval Actions */}
        {canApprove && expense.payment_status?.toLowerCase() === 'pending' && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
              Approval Actions
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
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
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              padding: 16,
              gap: 8,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
              Notes
            </Text>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
              {expense.notes}
            </Text>
          </View>
        )}

        {/* Metadata */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text style={{ ...getTypographyStyle('md', 'semibold'), color: theme.text }}>
            Metadata
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                Created At
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
                {new Date(expense.created_at).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
                Updated At
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
                {new Date(expense.updated_at).toLocaleString('en-IN')}
              </Text>
            </View>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <Pressable
            onPress={() => setSelectedPhotoIndex(null)}
            style={{
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
            }}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </Pressable>

          {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={{ uri: photos[selectedPhotoIndex].photo }}
                style={{ width, height: height * 0.8 }}
                contentFit="contain"
              />
              <Text style={{
                position: 'absolute',
                bottom: 30,
                ...getTypographyStyle('sm', 'regular'),
                color: '#FFF',
              }}>
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}>
            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 16 }}>
              {approvalAction === 'approve' ? 'Approve Expense' : 'Reject Expense'}
            </Text>
            
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 20 }}>
              Are you sure you want to {approvalAction} this expense?
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
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

export default ExpenseDetail;
