import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useLeave, useUpdateLeaveStatus, useDeleteLeave } from '@/hooks/useHRQueries';
import { usePermissions } from '@/store/permissionStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';
import hrService from '@/services/hr.service';

type DetailTab = 'info' | 'documents' | 'history';
type ItemType = 'staff' | 'leave' | 'reimbursement';

export default function HRDetailScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [itemType, setItemType] = useState<ItemType>('staff');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // API hooks for leave management
  const { data: leaveData, isLoading: leaveLoading, refetch } = useLeave(
    parseInt(id as string),
    { enabled: type === 'leave' }
  );
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateLeaveStatus();
  const { mutate: deleteLeave, isPending: isDeleting } = useDeleteLeave();

  // Check user role for permissions
  const canManage = permissions.hasPermission('hr:manage');
  const canApprove = permissions.hasPermission('leave:approve');

  // Tabs for detail view
  const detailTabs: Tab[] = [
    { key: 'info', label: 'Information', icon: 'information-circle' },
    { key: 'documents', label: 'Documents', icon: 'document-text' },
    { key: 'history', label: 'History', icon: 'time' },
  ];

  useEffect(() => {
    const itemTypeFromParam = (type as ItemType) || 'staff';
    setItemType(itemTypeFromParam);
  }, [id, type]);

  const itemData = type === 'leave' ? leaveData : null;
  const loading = type === 'leave' ? leaveLoading : false;

  const handleEdit = () => {
    // Navigate to edit screen
    router.push(`/(modules)/hr/edit/${id}` as any);
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Leave',
      `Are you sure you want to approve this leave request for ${itemData?.employee_name || 'this employee'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            updateStatus(
              { id: parseInt(id as string), data: { status: 'approved' } },
              {
                onSuccess: () => {
                  Alert.alert('Success', 'Leave approved successfully', [
                    { text: 'OK', onPress: () => router.back() }
                  ]);
                },
                onError: (error: any) => {
                  Alert.alert('Error', error.message || 'Failed to approve leave');
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    updateStatus(
      {
        id: parseInt(id as string),
        data: { status: 'rejected', rejection_reason: rejectionReason.trim() },
      },
      {
        onSuccess: () => {
          setShowRejectModal(false);
          setRejectionReason('');
          Alert.alert('Success', 'Leave rejected successfully', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to reject leave');
        },
      }
    );
  };

  const renderInfoTab = () => {
    if (!itemData) return null;

    if (itemType === 'staff') {
      return (
        <View style={{ padding: 16 }}>
          <InfoRow label="Employee ID" value={itemData.employeeId} theme={theme} />
          <InfoRow label="Name" value={itemData.name} theme={theme} />
          <InfoRow label="Email" value={itemData.email} theme={theme} />
          <InfoRow label="Phone" value={itemData.phone} theme={theme} />
          <InfoRow label="Designation" value={itemData.designation} theme={theme} />
          <InfoRow label="Department" value={itemData.department} theme={theme} />
          <InfoRow label="Join Date" value={itemData.joinDate} theme={theme} />
          <InfoRow label="Salary" value={itemData.salary} theme={theme} />
          <InfoRow label="Address" value={itemData.address} theme={theme} />
          <InfoRow label="Emergency Contact" value={itemData.emergencyContact} theme={theme} />
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 8 }}>
              Status
            </Text>
            <StatusBadge status={itemData.status} type={itemData.status === 'Active' ? 'active' : 'inactive'} />
          </View>
        </View>
      );
    }

    if (itemType === 'leave') {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };

      const shiftTime = hrService.formatShiftTime(itemData.shift_type || 'full_shift');

      return (
        <ScrollView style={{ padding: 16 }}>
          {/* Summary Header */}
          <View style={{
            backgroundColor: theme.surface,
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 16 }}>
              Summary
            </Text>
            
            <SummaryRow label="Type" value={itemData.leave_type} theme={theme} />
            <SummaryRow 
              label="Balance before leave applied" 
              value={`${itemData.balance_before || 0} Days`} 
              theme={theme} 
            />
            <SummaryRow 
              label="Balance after leave applied" 
              value={`${itemData.balance_after || 0} Days`} 
              theme={theme} 
            />
            <SummaryRow label="Request Duration" value={`${itemData.total_days} Day(s)`} theme={theme} />
            <SummaryRow 
              label="Request Date" 
              value={`${formatDate(itemData.from_date)}, ${formatDate(itemData.to_date)}, ${formatDate(itemData.applied_date || itemData.from_date)}`}
              theme={theme} 
            />
            <SummaryRow label="Request Time" value={itemData.shift_type?.replace('_', ' ').toUpperCase() || 'FULL SHIFT'} theme={theme} />
            <SummaryRow label="Shift" value={shiftTime} theme={theme} />
            <SummaryRow label="Total Time Requested" value={`${itemData.total_days} Day(s)`} theme={theme} isLast />
          </View>

          {/* Employee Info */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 12 }}>
              Employee Details
            </Text>
            <InfoRow label="Name" value={itemData.employee_name} theme={theme} />
            <InfoRow label="Email" value={itemData.employee_email} theme={theme} />
            <InfoRow label="Designation" value={itemData.employee_designation} theme={theme} />
            <InfoRow label="Department" value={itemData.employee_department} theme={theme} />
          </View>

          {/* Leave Details */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 12 }}>
              Leave Details
            </Text>
            <InfoRow label="Reason" value={itemData.reason} theme={theme} />
            <InfoRow label="Applied Date" value={formatDate(itemData.applied_date)} theme={theme} />
            
            {itemData.approved_by_name && (
              <InfoRow label="Reviewed By" value={itemData.approved_by_name} theme={theme} />
            )}
            {itemData.approved_date && (
              <InfoRow label="Reviewed On" value={formatDate(itemData.approved_date)} theme={theme} />
            )}
            {itemData.rejection_reason && (
              <InfoRow label="Rejection Reason" value={itemData.rejection_reason} theme={theme} />
            )}
            
            <View style={{ marginTop: 16 }}>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 8 }}>
                Status
              </Text>
              <StatusBadge status={itemData.status} />
            </View>
          </View>

          {/* Note for Casual/Other leave */}
          {itemData.leave_type?.includes('Casual') && (
            <View style={{
              backgroundColor: `${theme.primary}10`,
              padding: 16,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text }}>
                ℹ️ Casual Other Planned requests need manager approval. Visit the Time History page to track updates.
              </Text>
            </View>
          )}
        </ScrollView>
      );
    }

    if (itemType === 'reimbursement') {
      return (
        <View style={{ padding: 16 }}>
          <InfoRow label="Employee" value={itemData.employee} theme={theme} />
          <InfoRow label="Type" value={itemData.reimbursementType} theme={theme} />
          <InfoRow label="Amount" value={`₹${itemData.amount?.toLocaleString()}`} theme={theme} />
          <InfoRow label="Expense Date" value={itemData.date} theme={theme} />
          <InfoRow label="Applied On" value={itemData.appliedDate} theme={theme} />
          <InfoRow label="Description" value={itemData.description} theme={theme} />
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 8 }}>
              Status
            </Text>
            <StatusBadge status={itemData.status} />
          </View>
        </View>
      );
    }

    return null;
  };

  const renderDocumentsTab = () => {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary, textAlign: 'center', marginTop: 32 }}>
          Documents section will be implemented with file uploads
        </Text>
        {/* TODO: Add document upload/view functionality */}
      </View>
    );
  };

  const renderHistoryTab = () => {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ ...getTypographyStyle('base', 'regular'), color: theme.textSecondary, textAlign: 'center', marginTop: 32 }}>
          Activity history will be displayed here
        </Text>
        {/* TODO: Add activity timeline */}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'documents':
        return renderDocumentsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Loading..." />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (!itemData && type === 'leave') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Not Found" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="document-outline" size={64} color={theme.textSecondary} />
          <Text style={{ ...getTypographyStyle('lg', 'regular'), color: theme.textSecondary, marginTop: 16, textAlign: 'center' }}>
            Leave request not found
          </Text>
        </View>
      </View>
    );
  }

  const showApprovalButtons = itemData && 
    itemData.status?.toLowerCase() === 'pending' && 
    itemType === 'leave' && 
    canApprove;

  // Check if current user can delete (own pending item)
  const canDelete = itemData &&
    itemData.status?.toLowerCase() === 'pending' &&
    itemType === 'leave' &&
    itemData.employee === user?.id;

  const handleDelete = () => {
    Alert.alert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            deleteLeave(parseInt(id as string), {
              onSuccess: () => {
                Alert.alert('Success', 'Leave cancelled successfully', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              },
              onError: (error: any) => {
                Alert.alert('Error', error.message || 'Failed to cancel leave');
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={itemType === 'staff' ? itemData?.name : `${itemType} Details`}
      />

      {/* Tabs */}
      <TabBar
        tabs={detailTabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as DetailTab)}
      />

      {/* Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={{ 
        padding: 16, 
        backgroundColor: theme.surface,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        gap: 12
      }}>
        {showApprovalButtons ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
              onPress={handleReject}
            >
              <Ionicons name="close-circle" size={20} color={theme.textInverse} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.textInverse, ...getTypographyStyle('base', 'semibold') }}>
                Reject
              </Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: '#10B981',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
              onPress={handleApprove}
            >
              <Ionicons name="checkmark-circle" size={20} color={theme.textInverse} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.textInverse, ...getTypographyStyle('base', 'semibold') }}>
                Approve
              </Text>
            </Pressable>
          </View>
        ) : null}

        {canManage && itemType === 'staff' && (
          <Pressable
            style={{
              backgroundColor: theme.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={20} color={theme.textInverse} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.textInverse, ...getTypographyStyle('base', 'semibold') }}>
              Edit Details
            </Text>
          </Pressable>
        )}

        {canDelete && (
          <Pressable
            style={{
              backgroundColor: '#EF4444',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color={theme.textInverse} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.textInverse, ...getTypographyStyle('base', 'semibold') }}>
              Delete
            </Text>
          </Pressable>
        )}
      </View>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginBottom: 16 }}>
              Rejection Reason
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                minHeight: 100,
                textAlignVertical: 'top',
                color: theme.text,
                marginBottom: 16,
              }}
              placeholder="Enter reason for rejection..."
              placeholderTextColor={theme.textSecondary}
              multiline
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: theme.background,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isUpdating}
              >
                <Text style={{ color: theme.text, ...getTypographyStyle('base', 'semibold') }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={confirmReject}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', ...getTypographyStyle('base', 'semibold') }}>
                    Reject
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Helper component for info rows
function InfoRow({ label, value, theme }: { label: string; value?: string; theme: any }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ ...getTypographyStyle('base', 'medium'), color: theme.text }}>
        {value || 'N/A'}
      </Text>
    </View>
  );
}

// Helper component for summary rows
function SummaryRow({ label, value, theme, isLast = false }: { label: string; value?: string; theme: any; isLast?: boolean }) {
  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: theme.border,
    }}>
      <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, flex: 1 }}>
        {label}
      </Text>
      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, flex: 1, textAlign: 'right' }}>
        {value || 'N/A'}
      </Text>
    </View>
  );
}
