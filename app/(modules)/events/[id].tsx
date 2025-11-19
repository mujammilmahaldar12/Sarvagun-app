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

type TabType = 'info' | 'timeline' | 'documents';

export default function EventDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const itemType = type || 'leads'; // 'leads' or 'events'

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage || item?.employeeId === user?.id;
  const canDelete = canManage || (item?.employeeId === user?.id && item?.status !== 'completed');

  useEffect(() => {
    fetchItemDetails();
  }, [id, type]);

  const fetchItemDetails = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API call
    setTimeout(() => {
      let mockData;
      
      if (itemType === 'leads') {
        mockData = {
          id: parseInt(id),
          companyName: 'Tech Corp',
          contactPerson: 'John Doe',
          phone: '9876543210',
          email: 'john@techcorp.com',
          status: 'new',
          assignedTo: 'Sarah Wilson',
          createdDate: '2024-03-15',
          source: 'Website',
          industry: 'Technology',
          employeeCount: '100-500',
          address: '123 Business St, Tech City',
          notes: 'Interested in our enterprise solution',
          employeeId: 1,
        };
      } else {
        mockData = {
          id: parseInt(id),
          eventName: 'Annual Conference 2024',
          eventType: 'Conference',
          startDate: '2024-04-01',
          endDate: '2024-04-03',
          venue: 'Grand Hotel',
          venueAddress: '456 Convention Ave, City Center',
          status: 'planned',
          budget: 500000,
          actualExpense: 0,
          attendees: 200,
          coordinator: 'Sarah Wilson',
          description: 'Annual company conference with keynote speakers',
          agenda: 'Day 1: Opening ceremony\nDay 2: Panel discussions\nDay 3: Closing remarks',
          employeeId: 1,
        };
      }
      
      setItem(mockData);
      setLoading(false);
    }, 500);
  };

  const handleEdit = () => {
    if (itemType === 'leads') {
      router.push(`/(modules)/events/add-lead?id=${id}` as any);
    } else {
      router.push(`/(modules)/events/add-event?id=${id}` as any);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${itemType === 'leads' ? 'Lead' : 'Event'}`,
      `Are you sure you want to delete this ${itemType === 'leads' ? 'lead' : 'event'}?`,
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

  const handleConvertToEvent = () => {
    Alert.alert(
      'Convert to Event',
      'Convert this lead to an event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: () => {
            router.push({
              pathname: '/(modules)/events/add-event',
              params: { fromLead: id },
            } as any);
          },
        },
      ]
    );
  };

  const renderInfoTab = () => {
    if (!item) return null;

    if (itemType === 'leads') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Company Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Company Information
            </Text>
            <InfoRow label="Company Name" value={item.companyName} />
            <InfoRow label="Industry" value={item.industry} />
            <InfoRow label="Employee Count" value={item.employeeCount} />
            <InfoRow label="Address" value={item.address} />
          </View>

          {/* Contact Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Contact Information
            </Text>
            <InfoRow label="Contact Person" value={item.contactPerson} />
            <InfoRow label="Phone" value={item.phone} />
            <InfoRow label="Email" value={item.email} />
          </View>

          {/* Lead Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Lead Details
            </Text>
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Source" value={item.source} />
            <InfoRow label="Assigned To" value={item.assignedTo} />
            <InfoRow label="Created Date" value={item.createdDate} />
            <InfoRow label="Notes" value={item.notes} multiline />
          </View>
        </View>
      );
    } else {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Event Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Event Information
            </Text>
            <InfoRow label="Event Name" value={item.eventName} />
            <InfoRow label="Type" value={item.eventType} />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Start Date" value={item.startDate} />
            <InfoRow label="End Date" value={item.endDate} />
            <InfoRow label="Coordinator" value={item.coordinator} />
          </View>

          {/* Venue Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Venue Information
            </Text>
            <InfoRow label="Venue" value={item.venue} />
            <InfoRow label="Address" value={item.venueAddress} />
            <InfoRow label="Expected Attendees" value={item.attendees?.toString()} />
          </View>

          {/* Financial Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Financial Information
            </Text>
            <InfoRow label="Budget" value={`₹${item.budget?.toLocaleString('en-IN')}`} />
            <InfoRow label="Actual Expense" value={`₹${item.actualExpense?.toLocaleString('en-IN')}`} />
          </View>

          {/* Description */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Description
            </Text>
            <InfoRow label="Description" value={item.description} multiline />
            <InfoRow label="Agenda" value={item.agenda} multiline />
          </View>
        </View>
      );
    }
  };

  const renderTimelineTab = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
        Timeline coming soon
      </Text>
    </View>
  );

  const renderDocumentsTab = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
        Documents coming soon
      </Text>
    </View>
  );

  const InfoRow = ({ label, value, multiline = false }: { label: string; value: React.ReactNode; multiline?: boolean }) => (
    <View style={{ flexDirection: multiline ? 'column' : 'row', gap: multiline ? 4 : 8 }}>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, width: multiline ? undefined : 120 }}>
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
    { key: 'timeline' as TabType, label: 'Timeline', icon: 'time' as const },
    { key: 'documents' as TabType, label: 'Documents', icon: 'document' as const },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ModuleHeader
        title={itemType === 'leads' ? item?.companyName : item?.eventName}
        showBack
        rightActions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {itemType === 'leads' && canManage && item?.status === 'qualified' && (
              <Pressable
                onPress={handleConvertToEvent}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? theme.colors.primary + '20' : theme.colors.primary,
                })}
              >
                <Ionicons name="arrow-forward" size={20} color="#fff" />
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

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
      </ScrollView>
    </View>
  );
}
