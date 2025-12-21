import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import {
  useLeave, useUpdateLeaveStatus, useDeleteLeave,
  useReimbursement, useUpdateReimbursementStatus, useDeleteReimbursement
} from '@/hooks/useHRQueries';
import { usePermissions } from '@/store/permissionStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { Badge } from '@/components';
import { getTypographyStyle } from '@/utils/styleHelpers';
import hrService from '@/services/hr.service';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LeaveRequest, Reimbursement } from '@/types/hr';

type DetailTab = 'info' | 'documents' | 'history';
type ItemType = 'staff' | 'leave' | 'reimbursement';

export default function HRDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, type } = params as { id: string; type?: string };
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [itemType, setItemType] = useState<ItemType>('staff');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // API hooks
  const { data: leaveData, isLoading: leaveLoading } = useLeave(
    parseInt(id as string),
    { enabled: type === 'leave' }
  );

  const { data: reimbursementData, isLoading: reimbursementLoading } = useReimbursement(
    parseInt(id as string)
  ); // We can always fetch if ID present, or conditionally. enabled option is missing in useReimbursement def but useQuery handles it if id is falsy usually. Actually checking hook def: enabled: !!id. So it fetches.

  // Mutations
  const { mutate: updateLeaveStatus, isPending: isUpdatingLeave } = useUpdateLeaveStatus();
  const { mutate: deleteLeave, isPending: isDeletingLeave } = useDeleteLeave();

  const { mutate: updateReimbursementStatus, isPending: isUpdatingReimbursement } = useUpdateReimbursementStatus();
  const { mutate: deleteReimbursement, isPending: isDeletingReimbursement } = useDeleteReimbursement();

  // Derived state
  const isUpdating = isUpdatingLeave || isUpdatingReimbursement;

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

  const itemData = type === 'leave' ? leaveData
    : type === 'reimbursement' ? reimbursementData
      : null;

  const loading = type === 'leave' ? leaveLoading
    : type === 'reimbursement' ? reimbursementLoading
      : false;

  const handleEdit = () => {
    router.push(`/(modules)/hr/edit/${id}` as any);
  };

  const handleApprove = () => {
    console.log('🟢 handleApprove called, type:', type);

    // Execute directly without confirmation
    if (type === 'leave') {
      updateLeaveStatus(
        { id: parseInt(id as string), data: { status: 'approved' } },
        {
          onSuccess: () => {
            console.log('✅ Leave approved');
            router.back();
          },
          onError: (err: any) => console.error('Error:', err.message)
        }
      );
    } else if (type === 'reimbursement') {
      updateReimbursementStatus(
        { id: parseInt(id as string), status: 'approved', reason: 'Approved' },
        {
          onSuccess: () => {
            console.log('✅ Reimbursement approved');
            router.back();
          },
          onError: (err: any) => console.error('Error:', err.message)
        }
      );
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason');
      return;
    }

    const payload = { id: parseInt(id as string), status: 'rejected', reason: rejectionReason.trim(), rejection_reason: rejectionReason.trim() }; // handles both apis roughly

    if (type === 'leave') {
      updateLeaveStatus(
        { id: payload.id, data: { status: 'rejected', rejection_reason: payload.reason } },
        {
          onSuccess: () => {
            setShowRejectModal(false);
            Alert.alert('Success', 'Rejected successfully', [{ text: 'OK', onPress: () => router.back() }]);
          },
          onError: (err: any) => Alert.alert('Error', err.message || 'Failed')
        }
      );
    } else if (type === 'reimbursement') {
      updateReimbursementStatus(
        { id: payload.id, status: 'rejected', reason: payload.reason },
        {
          onSuccess: () => {
            setShowRejectModal(false);
            console.log('✅ Reimbursement rejected successfully');
            router.back();
          },
          onError: (err: any) => Alert.alert('Error', err.message || 'Failed')
        }
      );
    }
  };

  const handleDelete = () => {
    console.log('🔴 handleDelete called, type:', type);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    if (type === 'leave') {
      deleteLeave(parseInt(id as string), {
        onSuccess: () => {
          console.log('✅ Leave deleted');
          router.back();
        }
      });
    } else if (type === 'reimbursement') {
      deleteReimbursement(parseInt(id as string), {
        onSuccess: () => {
          console.log('✅ Reimbursement deleted');
          router.back();
        }
      });
    }
  };

  const renderInfoTab = () => {
    if (!itemData) return null;

    if (itemType === 'leave') {
      const leaveRequest = itemData as unknown as LeaveRequest;

      const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };

      return (
        <ScrollView style={{ padding: 16 }}>
          {/* Summary Header */}
          <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
            <SummaryRow label="Type" value={leaveRequest.leave_type} theme={theme} />
            <SummaryRow label="Total Days" value={`${leaveRequest.total_days} Day(s)`} theme={theme} />
            <SummaryRow label="From" value={formatDate(leaveRequest.from_date)} theme={theme} />
            <SummaryRow label="To" value={formatDate(leaveRequest.to_date)} theme={theme} isLast />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 12 }}>Details</Text>
            <InfoRow label="Reason" value={leaveRequest.reason} theme={theme} />
            <InfoRow label="Employee" value={leaveRequest.employee_name} theme={theme} />
            <InfoRow label="Applied On" value={formatDate(leaveRequest.applied_date)} theme={theme} />
            <View style={{ marginTop: 16 }}>
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginBottom: 8 }}>Status</Text>
              <StatusBadge status={leaveRequest.status} />
            </View>
          </View>
        </ScrollView>
      );
    }

    if (itemType === 'reimbursement') {
      // Cast to Reimbursement to silence TS errors and enable safe access
      const reimbursement = itemData as unknown as Reimbursement;

      const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };

      // Use the full expense object from backend
      const expenseObj = reimbursement.expense || {};

      // Handle bill evidence: check expense photo first (upload goes there)
      const billPhoto = expenseObj.photo || (reimbursement as any).bill_photo || expenseObj.photos?.[0]?.photo;
      const hasBill = reimbursement.bill_evidence === 'yes' || expenseObj.bill_evidence === 'yes';

      return (
        <ScrollView style={{ padding: 16 }}>
          {/* Compact Amount Card */}
          <View style={{
            alignItems: 'center',
            marginBottom: 16,
            paddingVertical: 16,
            paddingHorizontal: 20,
            backgroundColor: theme.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Reimbursement Amount</Text>
            <Text style={{ color: theme.primary, fontSize: 24, fontWeight: '700' }}>₹{Number(reimbursement.reimbursement_amount || 0).toLocaleString()}</Text>
            <View style={{ marginTop: 8 }}>
              <StatusBadge status={reimbursement.status || 'pending'} />
            </View>
          </View>

          {/* Info Card with Proper Padding */}
          <View style={{
            backgroundColor: theme.surface,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <SummaryRow label="Type" value={expenseObj.particulars || 'N/A'} theme={theme} />
            <SummaryRow label="Expense Date" value={formatDate(expenseObj.expense_date || expenseObj.date || '')} theme={theme} />
            <SummaryRow label="Applied On" value={formatDate(reimbursement.submitted_at)} theme={theme} isLast />
          </View>

          {/* Details Card */}
          <View style={{
            backgroundColor: theme.surface,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Details</Text>
            <InfoRow label="Request ID" value={`#${reimbursement.id}`} theme={theme} />
            <InfoRow label="Employee" value={reimbursement.requested_by_name || (reimbursement as any).employee_name} theme={theme} />
            <InfoRow label="Description" value={reimbursement.details} theme={theme} />
            <InfoRow label="Payment Mode" value={expenseObj.mode_of_payment} theme={theme} />
            <InfoRow label="Payment Status" value={expenseObj.payment_status} theme={theme} />
            <InfoRow label="Original Expense" value={`₹${Number(expenseObj.amount || 0).toLocaleString()}`} theme={theme} isLast />
          </View>
        </ScrollView>
      );
    }
    return null;
  };

  const renderDocumentsTab = () => {
    if (!itemData) return null;

    if (itemType === 'reimbursement') {
      const reimbursement = itemData as unknown as Reimbursement;
      const expenseObj = reimbursement.expense || {};
      const billPhoto = expenseObj.photo || (reimbursement as any).bill_photo || expenseObj.photos?.[0]?.photo;
      const hasBill = reimbursement.bill_evidence === 'yes' || expenseObj.bill_evidence === 'yes';

      return (
        <ScrollView style={{ padding: 16 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ ...getTypographyStyle('base', 'semibold'), color: theme.text, marginBottom: 12 }}>Bill Evidence</Text>
            {billPhoto ? (
              <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                <Image source={{ uri: billPhoto }} style={{ width: '100%', height: 400, resizeMode: 'contain', backgroundColor: '#f0f0f0' }} />
              </View>
            ) : (
              <Text style={{ color: theme.textSecondary }}>No image attached{hasBill ? ' (Evidence marked as YES)' : ''}.</Text>
            )}
          </View>
        </ScrollView>
      );
    }

    // Fallback for other types
    return (
      <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: theme.textSecondary }}>No documents available.</Text></View>
    );
  };

  const renderHistoryTab = () => {
    if (!itemData) return null;

    // Safety cast
    const reimbursement = itemType === 'reimbursement' ? (itemData as unknown as Reimbursement) : null;
    const leave = itemType === 'leave' ? (itemData as unknown as LeaveRequest) : null;

    const steps = [];

    if (itemType === 'reimbursement' && reimbursement) {
      // Step 1: Submitted
      steps.push({
        title: 'Request Submitted',
        date: reimbursement.submitted_at,
        description: `Request created by ${reimbursement.requested_by_name || 'User'}`,
        completed: true,
        icon: 'checkmark-circle'
      });

      // Step 2: Sent to HR/Admin (Auto-success for now as backend notifies immediately)
      steps.push({
        title: 'Sent to HR/Admin',
        date: reimbursement.submitted_at, // Same time effectively
        description: 'Notification sent to HR team',
        completed: true,
        icon: 'mail'
      });

      // Step 3: Current Status
      const status = reimbursement.status?.toLowerCase() || 'pending';
      const isPending = status === 'pending';
      const isApproved = status === 'approved';
      const isRejected = status === 'rejected';

      steps.push({
        title: isPending ? 'Pending Review' : isApproved ? 'Approved' : 'Rejected',
        date: reimbursement.latest_status?.updated_at || null,
        description: isPending ? 'Awaiting action from HR/Admin' :
          `${isApproved ? 'Approved' : 'Rejected'} by ${reimbursement.latest_status?.updated_by_name || 'Admin'}`,
        completed: !isPending,
        isCurrent: isPending,
        icon: isPending ? 'time' : isApproved ? 'checkmark-done-circle' : 'close-circle',
        color: isPending ? theme.primary : isApproved ? '#10b981' : '#ef4444'
      });
    } else if (itemType === 'leave' && leave) {
      // Similar logic for leave if needed, or placeholder
      steps.push({
        title: 'Leave Applied',
        date: leave.applied_date,
        description: `Applied for ${leave.total_days} days`,
        completed: true,
        icon: 'checkmark-circle'
      });

      const status = leave.status?.toLowerCase() || 'pending';
      steps.push({
        title: status === 'pending' ? 'Pending Approval' : status.charAt(0).toUpperCase() + status.slice(1),
        date: leave.updated_at || leave.applied_date, // Fallback
        description: status === 'pending' ? 'Waiting for Team Lead/HR' : `Status updated to ${status}`,
        completed: status !== 'pending',
        isCurrent: status === 'pending',
        icon: status === 'pending' ? 'time' : status === 'approved' ? 'checkmark-done-circle' : 'close-circle',
        color: status === 'pending' ? theme.primary : status === 'approved' ? '#10b981' : '#ef4444'
      });
    }

    return (
      <ScrollView style={{ padding: 20 }}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={index} style={{ flexDirection: 'row', minHeight: 80 }}>
              {/* Timeline Column */}
              <View style={{ alignItems: 'center', marginRight: 16, width: 30 }}>
                {/* Line */}
                {!isLast && (
                  <View style={{
                    position: 'absolute', top: 30, bottom: -10, width: 2,
                    backgroundColor: step.completed ? theme.primary : theme.border
                  }} />
                )}
                {/* Icon/Circle */}
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: step.completed || step.isCurrent ? (step.color || theme.primary) : theme.surface,
                  borderWidth: 2, borderColor: step.completed || step.isCurrent ? (step.color || theme.primary) : theme.border,
                  justifyContent: 'center', alignItems: 'center',
                  zIndex: 1
                }}>
                  <Ionicons name={step.icon as any} size={18} color={step.completed || step.isCurrent ? '#fff' : theme.textSecondary} />
                </View>
              </View>

              {/* Content Column */}
              <View style={{ flex: 1, paddingBottom: 30 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>{step.title}</Text>
                {step.date && (
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                    {new Date(step.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                )}
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>{step.description}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // Logic to show/hide action buttons
  const isItemPending = itemData?.status?.toLowerCase() === 'pending';
  // Allow delete if it's my own request and pending
  const canDelete = isItemPending && (
    (type === 'leave' && (itemData as any).employee === user?.id) ||
    (type === 'reimbursement' && ((itemData as any).requested_by === user?.id || (itemData as any).employee === user?.id))
  );

  // Allow approve/reject if have permission and it's pending (and not my own ideally, but for demo OK)
  const canAction = isItemPending && (canManage || canApprove);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!itemData && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Not Found" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Item not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={itemType === 'staff' ? (itemData as any)?.name || 'Staff Details' : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Details`}
      />

      <TabBar tabs={detailTabs} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as DetailTab)} />

      <View style={{ flex: 1 }}>
        {activeTab === 'info' ? renderInfoTab() :
          activeTab === 'documents' ? renderDocumentsTab() :
            activeTab === 'history' ? renderHistoryTab() : null}
      </View>

      {/* Action Bar */}
      {/* Action Bar */}
      {(canAction || canDelete) && (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface, gap: 12 }}>
          {canAction && (activeTab === 'info') && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Reject" variant="danger" onPress={handleReject} style={{ flex: 1 }} />
              <Button label="Approve" variant="success" onPress={handleApprove} style={{ flex: 1 }} />
            </View>
          )}
          {canDelete && (
            <Button label="Delete Request" variant="outline-danger" onPress={handleDelete} icon="trash" />
          )}
        </View>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#00000080', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 12 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Reject Reason</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, minHeight: 100, color: theme.text, marginBottom: 16 }}
              placeholder="Enter reason..."
              placeholderTextColor={theme.textSecondary}
              multiline
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancel" variant="outline" onPress={() => setShowRejectModal(false)} style={{ flex: 1 }} />
              <Button label="Confirm Reject" variant="danger" onPress={confirmReject} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#00000080', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 12 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Delete Request</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 20 }}>Are you sure you want to delete this request? This action cannot be undone.</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancel" variant="outline" onPress={() => setShowDeleteModal(false)} style={{ flex: 1 }} />
              <Button label="Delete" variant="danger" onPress={confirmDelete} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Helpers
function StatusBadge({ status }: { status: string }) {
  // Map status to color
  let type = 'default';
  const s = status?.toLowerCase() || 'pending';
  if (s === 'approved') type = 'success';
  if (s === 'rejected') type = 'error';
  if (s === 'pending') type = 'warning';

  return <Badge label={status || 'Unknown'} status={type as any} />;
}

function SummaryRow({ label, value, theme, isLast }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{value}</Text>
    </View>
  );
}


function InfoRow({ label, value, theme, isLast }: any) {
  return (
    <View style={{ marginBottom: isLast ? 0 : 12 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 3 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 14 }}>{value || 'N/A'}</Text>
    </View>
  );
}

// Simple internal Button component for this screen to avoid layout shifts or complex import
// Reuse core Button if possible, but for simplicity here inline style is used or import
// Actually better to use core Button if available.
import { Button as CoreButton } from '@/components/core/Button';

// Wrapper to adapt props
function Button({ label, variant = 'primary', style, onPress, icon }: any) {
  // map variant to CoreButton props
  return (
    <Pressable
      onPress={onPress}
      style={[{
        padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
        backgroundColor: variant === 'danger' ? '#ef4444' : variant === 'success' ? '#10b981' : variant === 'outline-danger' ? 'transparent' : '#3b82f6',
        borderWidth: variant === 'outline-danger' ? 1 : 0,
        borderColor: variant === 'outline-danger' ? '#ef4444' : undefined
      }, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={variant === 'outline-danger' ? '#ef4444' : '#fff'} />}
      <Text style={{ color: variant === 'outline-danger' ? '#ef4444' : '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
