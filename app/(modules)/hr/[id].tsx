import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import StatusBadge from '@/components/ui/StatusBadge';

type DetailTab = 'info' | 'documents' | 'history';
type ItemType = 'staff' | 'leave' | 'reimbursement';

export default function HRDetailScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [loading, setLoading] = useState(true);
  const [itemData, setItemData] = useState<any>(null);
  const [itemType, setItemType] = useState<ItemType>('staff');

  // Check user role for permissions
  const canManage = ['admin', 'hr'].includes(user?.category || '');
  const canApprove = ['admin', 'hr', 'manager'].includes(user?.category || '');

  // Tabs for detail view
  const detailTabs: Tab[] = [
    { key: 'info', label: 'Information', icon: 'information-circle' },
    { key: 'documents', label: 'Documents', icon: 'document-text' },
    { key: 'history', label: 'History', icon: 'time' },
  ];

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      // Set type from navigation params
      const itemTypeFromParam = (type as ItemType) || 'staff';
      setItemType(itemTypeFromParam);

      // TODO: Replace with real API call based on type
      // await api.get(`/hr/${itemTypeFromParam}/${id}`)
      
      // Mock data based on type
      setTimeout(() => {
        let mockData: any;
        
        if (itemTypeFromParam === 'staff') {
          mockData = {
            id: id,
            type: 'staff',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+91 9876543210',
            designation: 'Senior Developer',
            department: 'IT',
            status: 'Active',
            joinDate: '2024-01-15',
            employeeId: 'EMP001',
            address: '123 Main St, Mumbai, Maharashtra',
            emergencyContact: '+91 9876543211',
            salary: '₹8,50,000',
          };
        } else if (itemTypeFromParam === 'leave') {
          mockData = {
            id: id,
            type: 'leave',
            employee: 'John Doe',
            employeeId: user?.id || 1,
            leaveType: 'Casual Leave',
            from: '2025-11-25',
            to: '2025-11-27',
            days: 3,
            status: 'Pending',
            reason: 'Family function',
            appliedDate: '2025-11-20',
          };
        } else if (itemTypeFromParam === 'reimbursement') {
          mockData = {
            id: id,
            type: 'reimbursement',
            employee: 'John Doe',
            employeeId: user?.id || 1,
            reimbursementType: 'Travel',
            amount: 5000,
            date: '2025-11-15',
            status: 'Pending',
            description: 'Client meeting travel',
            appliedDate: '2025-11-16',
          };
        }

        setItemData(mockData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching details:', error);
      Alert.alert('Error', 'Failed to load details');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen
    router.push(`/(modules)/hr/edit/${id}` as any);
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve',
      `Are you sure you want to approve this ${itemType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            // TODO: Call API to approve
            console.log('Approved:', id);
            Alert.alert('Success', `${itemType} approved successfully`);
            fetchItemDetails();
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject',
      `Are you sure you want to reject this ${itemType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call API to reject
            console.log('Rejected:', id);
            Alert.alert('Success', `${itemType} rejected successfully`);
            fetchItemDetails();
          },
        },
      ]
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
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Status
            </Text>
            <StatusBadge status={itemData.status} type={itemData.status === 'Active' ? 'active' : 'inactive'} />
          </View>
        </View>
      );
    }

    if (itemType === 'leave') {
      return (
        <View style={{ padding: 16 }}>
          <InfoRow label="Employee" value={itemData.employee} theme={theme} />
          <InfoRow label="Leave Type" value={itemData.leaveType} theme={theme} />
          <InfoRow label="From Date" value={itemData.from} theme={theme} />
          <InfoRow label="To Date" value={itemData.to} theme={theme} />
          <InfoRow label="Total Days" value={itemData.days?.toString()} theme={theme} />
          <InfoRow label="Applied On" value={itemData.appliedDate} theme={theme} />
          <InfoRow label="Reason" value={itemData.reason} theme={theme} />
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
              Status
            </Text>
            <StatusBadge status={itemData.status} />
          </View>
        </View>
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
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 }}>
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
        <Text style={{ fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
          Documents section will be implemented with file uploads
        </Text>
        {/* TODO: Add document upload/view functionality */}
      </View>
    );
  };

  const renderHistoryTab = () => {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 32 }}>
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
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ModuleHeader title="Loading..." />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const showApprovalButtons = itemData && 
    itemData.status?.toLowerCase() === 'pending' && 
    (itemType === 'leave' || itemType === 'reimbursement') && 
    canApprove;

  // Check if current user can delete (own pending item)
  const canDelete = itemData &&
    itemData.status?.toLowerCase() === 'pending' &&
    (itemType === 'leave' || itemType === 'reimbursement') &&
    itemData.employeeId === user?.id;

  const handleDelete = () => {
    Alert.alert(
      'Delete',
      `Are you sure you want to delete this ${itemType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call API to delete
            console.log('Deleted:', id);
            Alert.alert('Success', `${itemType} deleted successfully`, [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
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
              <Ionicons name="close-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
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
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Approve
              </Text>
            </Pressable>
          </View>
        ) : null}

        {canManage && itemType === 'staff' && (
          <Pressable
            style={{
              backgroundColor: theme.colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
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
            <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Delete
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Helper component for info rows
function InfoRow({ label, value, theme }: { label: string; value?: string; theme: any }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
        {value || 'N/A'}
      </Text>
    </View>
  );
}
