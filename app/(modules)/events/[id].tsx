import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import eventsService from '@/services/events.service';

type TabType = 'info' | 'timeline' | 'documents';

export default function EventDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
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
          router.back();
          return;
      }
      
      setItem(data);
    } catch (error: any) {
      router.back();
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
      router.back();
    } catch (error: any) {
      // Silent error
    }
  };



  const renderInfoTab = () => {
    if (!item) return null;

    if (itemType === 'leads') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Client Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Client Information
            </Text>
            <InfoRow label="Client Name" value={item.client?.name || 'N/A'} />
            <InfoRow label="Contact Number" value={item.client?.number || 'N/A'} />
            <InfoRow label="Email" value={item.client?.email || 'N/A'} />
            <InfoRow label="Lead Person" value={item.client?.leadperson || 'N/A'} />
            {item.client?.category?.length > 0 && (
              <InfoRow label="Category" value={item.client.category.map((c: any) => c.name).join(', ')} />
            )}
            {item.client?.organisation?.length > 0 && (
              <InfoRow label="Organisation" value={item.client.organisation.map((o: any) => o.name).join(', ')} />
            )}
          </View>

          {/* Lead Details */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Lead Details
            </Text>
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow label="Source" value={item.source} />
            <InfoRow label="User" value={item.user_name || 'N/A'} />
            <InfoRow label="Referral" value={item.referral || '-'} />
            <InfoRow label="Created Date" value={item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'N/A'} />
            {item.message && <InfoRow label="Message" value={item.message} multiline />}
            <InfoRow label="Converted" value={item.convert ? 'Yes' : 'No'} />
            <InfoRow label="Rejected" value={item.reject ? 'Yes' : 'No'} />
          </View>
        </View>
      );
    } else if (itemType === 'events') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Event Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Client Information
            </Text>
            <InfoRow label="Client Name" value={item.client?.name || 'N/A'} />
            <InfoRow label="Contact" value={item.client?.number || 'N/A'} />
            <InfoRow label="Email" value={item.client?.email || 'N/A'} />
          </View>

          {/* Venue Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Financial Information
            </Text>
            <InfoRow label="Total Budget" value={item.total_budget ? `₹${item.total_budget.toLocaleString('en-IN')}` : 'N/A'} />
          </View>

          {/* Additional Details */}
          {item.active_days?.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                Active Days
              </Text>
              <Text style={{ fontSize: 14, color: theme.colors.text }}>
                {item.active_days.map((day: any) => 
                  new Date(day.date).toLocaleDateString('en-IN')
                ).join(', ')}
              </Text>
            </View>
          )}
        </View>
      );
    } else if (itemType === 'clients') {
      return (
        <View style={{ padding: 16, gap: 20 }}>
          {/* Client Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
              Venue Information
            </Text>
            <InfoRow label="Name" value={item.name} />
            <InfoRow label="Address" value={item.address || 'N/A'} />
            <InfoRow label="Capacity" value={item.capacity?.toString() || 'N/A'} />
          </View>

          {/* Contact Information */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ModuleHeader
        title={getTitle()}
        showBack
        rightActions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {itemType === 'leads' && canManage && item && !item.reject && !item.convert && (
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: '/(modules)/events/convert-lead',
                    params: { leadId: id }
                  } as any);
                }}
                style={({ pressed }) => ({
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: pressed ? theme.colors.primary + '20' : theme.colors.primary,
                })}
              >
                <Ionicons name="arrow-forward" size={20} color="#fff" />
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
