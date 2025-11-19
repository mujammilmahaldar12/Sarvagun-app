import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

type TabType = 'info' | 'documents' | 'history';

export default function FinanceDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const itemType = type || 'expenses'; // 'expenses' or 'sales'

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canApprove = canManage || user?.designation === 'manager';
  const canEdit = canManage || item?.employeeId === user?.id;
  const canDelete = canManage || (item?.employeeId === user?.id && item?.status === 'pending');

  useEffect(() => {
    fetchItemDetails();
  }, [id, type]);

  const fetchItemDetails = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API call
    setTimeout(() => {
      let mockData;
      
      if (itemType === 'expenses') {
        mockData = {
          id: parseInt(id),
          expenseType: 'Event',
          title: 'Annual Conference Catering',
          amount: 150000,
          date: '2024-03-15',
          category: 'Food & Beverage',
          status: 'pending',
          submittedBy: 'Sarah Wilson',
          submittedDate: '2024-03-15',
          approvedBy: null,
          approvedDate: null,
          description: 'Catering services for 200 attendees at annual conference',
          vendor: 'Premium Catering Services',
          invoiceNumber: 'PCS-2024-123',
          paymentMethod: 'Bank Transfer',
          notes: 'Vegetarian and non-vegetarian options included',
          eventId: 1,
          employeeId: 1,
        };
      } else {
        mockData = {
          id: parseInt(id),
          invoiceNumber: 'INV-2024-001',
          customerName: 'Tech Corp',
          customerEmail: 'contact@techcorp.com',
          customerPhone: '9876543210',
          customerAddress: '123 Business St, Tech City',
          productService: 'Enterprise Software License',
          description: 'Annual enterprise software license for 50 users',
          amount: 500000,
          taxAmount: 90000,
          totalAmount: 590000,
          date: '2024-03-15',
          dueDate: '2024-04-15',
          status: 'pending',
          paymentMethod: null,
          paidAmount: 0,
          paidDate: null,
          salesPerson: 'Sarah Wilson',
          terms: '30 days payment terms',
          notes: 'Annual renewal with 10% discount',
          employeeId: 1,
        };
      }
      
      setItem(mockData);
      setLoading(false);
    }, 500);
  };

  const handleEdit = () => {
    if (itemType === 'expenses') {
      router.push(`/(modules)/finance/add-expense?id=${id}` as any);
    } else {
      router.push(`/(modules)/finance/add-sale?id=${id}` as any);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${itemType === 'expenses' ? 'Expense' : 'Sale'}`,
      `Are you sure you want to delete this ${itemType === 'expenses' ? 'expense' : 'sale'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log(`Deleting ${itemType}:`, id);
            router.back();
          },
        },
      ]
    );
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Expense',
      `Approve this expense of ₹${item.amount?.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            console.log('Approving expense:', id);
            // API call here
            router.back();
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Expense',
      'Are you sure you want to reject this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            console.log('Rejecting expense:', id);
            // API call here
            router.back();
          },
        },
      ]
    );
  };

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      'Mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () => {
            console.log('Marking sale as paid:', id);
            // API call here
          },
        },
      ]
    );
  };

  const renderInfoTab = () => {
    if (!item) return null;

    if (itemType === 'expenses') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Expense Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Expense Information
            </Text>
            <InfoRow label="Type" value={
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: 
                  item.expenseType === 'Event' ? '#DBEAFE' :
                  item.expenseType === 'Reimbursement' ? '#FEF3C7' : '#E5E7EB',
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: 
                    item.expenseType === 'Event' ? '#1E40AF' :
                    item.expenseType === 'Reimbursement' ? '#92400E' : '#374151',
                }}>
                  {item.expenseType}
                </Text>
              </View>
            } />
            <InfoRow label="Title" value={item.title} />
            <InfoRow label="Amount" value={`₹${item.amount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Category" value={item.category} />
            <InfoRow label="Date" value={item.date} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
          </View>

          {/* Vendor Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Vendor Information
            </Text>
            <InfoRow label="Vendor" value={item.vendor} />
            <InfoRow label="Invoice Number" value={item.invoiceNumber} />
            <InfoRow label="Payment Method" value={item.paymentMethod || 'Not specified'} />
          </View>

          {/* Submission Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Submission Details
            </Text>
            <InfoRow label="Submitted By" value={item.submittedBy} />
            <InfoRow label="Submitted Date" value={item.submittedDate} />
            {item.approvedBy && <InfoRow label="Approved By" value={item.approvedBy} />}
            {item.approvedDate && <InfoRow label="Approved Date" value={item.approvedDate} />}
          </View>

          {/* Additional Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Additional Details
            </Text>
            <InfoRow label="Description" value={item.description} multiline />
            {item.notes && <InfoRow label="Notes" value={item.notes} multiline />}
          </View>
        </View>
      );
    } else {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Invoice Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Invoice Information
            </Text>
            <InfoRow label="Invoice Number" value={item.invoiceNumber} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Invoice Date" value={item.date} />
            <InfoRow label="Due Date" value={item.dueDate} />
          </View>

          {/* Customer Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Customer Information
            </Text>
            <InfoRow label="Customer Name" value={item.customerName} />
            <InfoRow label="Email" value={item.customerEmail} />
            <InfoRow label="Phone" value={item.customerPhone} />
            <InfoRow label="Address" value={item.customerAddress} multiline />
          </View>

          {/* Product/Service Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Product/Service Details
            </Text>
            <InfoRow label="Product/Service" value={item.productService} />
            <InfoRow label="Description" value={item.description} multiline />
          </View>

          {/* Financial Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Financial Details
            </Text>
            <InfoRow label="Amount" value={`₹${item.amount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Tax Amount" value={`₹${item.taxAmount?.toLocaleString('en-IN')}`} />
            <InfoRow label="Total Amount" value={`₹${item.totalAmount?.toLocaleString('en-IN')}`} />
            {item.paidAmount > 0 && <InfoRow label="Paid Amount" value={`₹${item.paidAmount?.toLocaleString('en-IN')}`} />}
            {item.paymentMethod && <InfoRow label="Payment Method" value={item.paymentMethod} />}
            {item.paidDate && <InfoRow label="Paid Date" value={item.paidDate} />}
          </View>

          {/* Additional Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Additional Information
            </Text>
            <InfoRow label="Sales Person" value={item.salesPerson} />
            <InfoRow label="Terms" value={item.terms} multiline />
            {item.notes && <InfoRow label="Notes" value={item.notes} multiline />}
          </View>
        </View>
      );
    }
  };

  const renderDocumentsTab = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
        Documents coming soon
      </Text>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
        History coming soon
      </Text>
    </View>
  );

  const InfoRow = ({ label, value, multiline = false }: { label: string; value: React.ReactNode; multiline?: boolean }) => (
    <View style={{ flexDirection: multiline ? 'column' : 'row', gap: multiline ? 4 : 8 }}>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, width: multiline ? undefined : 140 }}>
        {label}:
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={{ fontSize: 14, color: theme.colors.text, flex: 1 }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );

  const tabs = [
    { key: 'info' as TabType, label: 'Info', icon: 'information-circle' as const },
    { key: 'documents' as TabType, label: 'Documents', icon: 'document' as const },
    { key: 'history' as TabType, label: 'History', icon: 'time' as const },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  const showApprovalButtons = itemType === 'expenses' && canApprove && item?.status === 'pending';
  const showMarkPaidButton = itemType === 'sales' && canManage && (item?.status === 'pending' || item?.status === 'partial');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ModuleHeader
        title={itemType === 'expenses' ? item?.title : item?.invoiceNumber}
        showBack
        rightActions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {showMarkPaidButton && (
              <Pressable
                onPress={handleMarkPaid}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#10B981' + 'dd' : '#10B981',
                })}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', paddingHorizontal: 8 }}>
                  Mark Paid
                </Text>
              </Pressable>
            )}
            {canEdit && (
              <Pressable
                onPress={handleEdit}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? theme.colors.surface : 'transparent',
                })}
              >
                <Ionicons name="create-outline" size={24} color={theme.colors.text} />
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#FEE2E2' : 'transparent',
                })}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </Pressable>
            )}
          </View>
        }
      />

      {/* Approval Buttons (for pending expenses) */}
      {showApprovalButtons && (
        <View style={{
          flexDirection: 'row',
          gap: 12,
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}>
          <Pressable
            onPress={handleApprove}
            style={({ pressed }) => ({
              flex: 1,
              padding: 14,
              borderRadius: 8,
              backgroundColor: pressed ? '#10B981' + 'dd' : '#10B981',
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Approve</Text>
          </Pressable>
          <Pressable
            onPress={handleReject}
            style={({ pressed }) => ({
              flex: 1,
              padding: 14,
              borderRadius: 8,
              backgroundColor: pressed ? '#EF4444' + 'dd' : '#EF4444',
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Reject</Text>
          </Pressable>
        </View>
      )}

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>
    </View>
  );
}
