import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, Pressable, Modal, Alert, Platform, Animated } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import AppTable from '@/components/ui/AppTable';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

type TabType = 'leads' | 'events';

// Mock data
const mockLeads = [
  { id: 1, companyName: 'Tech Corp', contactPerson: 'John Doe', phone: '9876543210', email: 'john@techcorp.com', status: 'new', assignedTo: 'Sarah Wilson', createdDate: '2024-03-15', employeeId: 1 },
  { id: 2, companyName: 'Business Solutions', contactPerson: 'Jane Smith', phone: '9876543211', email: 'jane@business.com', status: 'contacted', assignedTo: 'Mike Johnson', createdDate: '2024-03-14', employeeId: 2 },
  { id: 3, companyName: 'Global Enterprises', contactPerson: 'Bob Wilson', phone: '9876543212', email: 'bob@global.com', status: 'qualified', assignedTo: 'Sarah Wilson', createdDate: '2024-03-13', employeeId: 1 },
];

const mockEvents = [
  { id: 1, eventName: 'Annual Conference 2024', eventType: 'Conference', startDate: '2024-04-01', endDate: '2024-04-03', venue: 'Grand Hotel', status: 'planned', budget: 500000, attendees: 200, coordinator: 'Sarah Wilson', employeeId: 1 },
  { id: 2, eventName: 'Product Launch', eventType: 'Launch', startDate: '2024-04-15', endDate: '2024-04-15', venue: 'Tech Hub', status: 'in-progress', budget: 300000, attendees: 150, coordinator: 'Mike Johnson', employeeId: 2 },
  { id: 3, eventName: 'Team Building Workshop', eventType: 'Workshop', startDate: '2024-05-01', endDate: '2024-05-02', venue: 'Resort Paradise', status: 'completed', budget: 150000, attendees: 50, coordinator: 'Sarah Wilson', employeeId: 1 },
];

export default function EventManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const scrollY = useRef(0);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canApprove = canManage || user?.designation === 'manager';

  // Get current data based on active tab with role-based filtering
  const getCurrentData = () => {
    let data: any[] = [];
    
    if (activeTab === 'leads') {
      data = mockLeads;
    } else {
      data = mockEvents;
    }

    // Role-based filtering
    if (user?.category === 'intern' || user?.category === 'employee') {
      data = data.filter(item => item.employeeId === user.id);
    }

    return data;
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = getCurrentData();

    // Apply search filter
    if (searchQuery) {
      data = data.filter((item: any) => {
        const searchLower = searchQuery.toLowerCase();
        if (activeTab === 'leads') {
          return (
            item.companyName?.toLowerCase().includes(searchLower) ||
            item.contactPerson?.toLowerCase().includes(searchLower) ||
            item.email?.toLowerCase().includes(searchLower) ||
            item.phone?.includes(searchQuery)
          );
        } else {
          return (
            item.eventName?.toLowerCase().includes(searchLower) ||
            item.eventType?.toLowerCase().includes(searchLower) ||
            item.venue?.toLowerCase().includes(searchLower)
          );
        }
      });
    }

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      data = data.filter((item: any) => item.status === selectedStatus);
    }

    return data;
  }, [activeTab, searchQuery, selectedStatus, user]);

  // Lead columns
  const leadColumns = [
    {
      key: 'companyName',
      title: 'Company',
      sortable: true,
      width: 150,
    },
    {
      key: 'contactPerson',
      title: 'Contact Person',
      sortable: true,
      width: 140,
    },
    {
      key: 'phone',
      title: 'Phone',
      sortable: false,
      width: 120,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (item: any) => (
        <StatusBadge
          status={item.status}
        />
      ),
    },
    {
      key: 'assignedTo',
      title: 'Assigned To',
      sortable: true,
      width: 130,
    },
    ...(canManage ? [{
      key: 'actions',
      title: 'Actions',
      sortable: false,
      width: 100,
      render: (item: any) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {item.status === 'new' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleConvertToEvent(item);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: pressed ? theme.colors.primary + '20' : theme.colors.primary,
                borderRadius: 6,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Convert</Text>
            </Pressable>
          )}
        </View>
      ),
    }] : []),
  ];

  // Event columns
  const eventColumns = [
    {
      key: 'eventName',
      title: 'Event Name',
      sortable: true,
      width: 180,
    },
    {
      key: 'eventType',
      title: 'Type',
      sortable: true,
      width: 100,
    },
    {
      key: 'startDate',
      title: 'Start Date',
      sortable: true,
      width: 110,
    },
    {
      key: 'venue',
      title: 'Venue',
      sortable: false,
      width: 130,
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 120,
      render: (item: any) => (
        <StatusBadge
          status={item.status}
        />
      ),
    },
    {
      key: 'budget',
      title: 'Budget',
      sortable: true,
      width: 110,
      render: (item: any) => `₹${item.budget?.toLocaleString('en-IN')}`,
    },
  ];

  const getCurrentColumns = () => {
    return activeTab === 'leads' ? leadColumns : eventColumns;
  };

  // Handlers
  const handleRowPress = (row: any) => {
    router.push({
      pathname: '/(modules)/events/[id]',
      params: { id: row.id, type: activeTab },
    });
  };

  const handleAddNew = () => {
    if (activeTab === 'leads') {
      router.push('/(modules)/events/add-lead' as any);
    } else {
      router.push('/(modules)/events/add-event' as any);
    }
  };

  const handleConvertToEvent = (lead: any) => {
    Alert.alert(
      'Convert to Event',
      `Convert lead "${lead.companyName}" to an event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          onPress: () => {
            console.log('Converting lead to event:', lead);
            // Navigate to add event with pre-filled data
            router.push({
              pathname: '/(modules)/events/add-event',
              params: { fromLead: lead.id },
            } as any);
          },
        },
      ]
    );
  };

  const handleSearchDebounced = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const scrollToTop = () => {
    setShowScrollTop(false);
    // Scroll functionality will be implemented with ref
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;
    
    if (offsetY > 200 && !showScrollTop) {
      setShowScrollTop(true);
    } else if (offsetY <= 200 && showScrollTop) {
      setShowScrollTop(false);
    }
  };

  const tabs = [
    { key: 'leads' as TabType, label: 'Leads', icon: 'business' as const },
    { key: 'events' as TabType, label: 'Events', icon: 'calendar' as const },
  ];

  const statusOptions = activeTab === 'leads'
    ? [
        { label: 'All Status', value: 'all' },
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Lost', value: 'lost' },
      ]
    : [
        { label: 'All Status', value: 'all' },
        { label: 'Planned', value: 'planned' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <ModuleHeader
        title="Event Management"
        rightActions={
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={({ pressed }) => ({
              padding: 8,
              borderRadius: 8,
              backgroundColor: pressed ? theme.colors.surface : 'transparent',
            })}
          >
            <Ionicons name="filter" size={24} color={theme.colors.text} />
          </Pressable>
        }
      />

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <AppTable
          data={filteredData}
          columns={getCurrentColumns()}
          keyExtractor={(item: any) => item.id.toString()}
          onRowPress={handleRowPress}
          searchable={true}
          searchPlaceholder={`Search ${activeTab}...`}
          onSearch={handleSearchDebounced}
          onScroll={handleScroll}
        />
      </View>

      {/* Floating Action Buttons */}
      <View style={{ position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 80 }}>
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Pressable
            onPress={scrollToTop}
            style={({ pressed }) => ({
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.colors.surface,
              borderWidth: 2,
              borderColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-up" size={24} color={theme.colors.primary} />
          </Pressable>
        )}

        {/* Add New Button */}
        <FloatingActionButton onPress={handleAddNew} />
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
              Filter {activeTab}
            </Text>

            {/* Status Filter */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 }}>
              Status
            </Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {statusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedStatus(option.value)}
                  style={({ pressed }) => ({
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selectedStatus === option.value ? theme.colors.primary : theme.colors.border,
                    backgroundColor: pressed
                      ? theme.colors.primary + '10'
                      : selectedStatus === option.value
                      ? theme.colors.primary + '20'
                      : 'transparent',
                  })}
                >
                  <Text
                    style={{
                      color: selectedStatus === option.value ? theme.colors.primary : theme.colors.text,
                      fontWeight: selectedStatus === option.value ? '600' : 'normal',
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => {
                  setSelectedStatus('all');
                  setFilterModalVisible(false);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 14,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed ? theme.colors.surface : 'transparent',
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterModalVisible(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: pressed ? theme.colors.primary + 'dd' : theme.colors.primary,
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
