import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, Modal, Alert, Platform, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import AppTable from '@/components/ui/AppTable';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import StatusBadge from '@/components/ui/StatusBadge';
import KPICard from '@/components/ui/KPICard';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import EventStatusPieChart from '@/components/charts/EventStatusPieChart';
import ClientSegmentChart from '@/components/charts/ClientSegmentChart';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import eventsService from '@/services/events.service';
import type { Lead, Event, Client, Venue } from '@/types/events';
import { COLORS } from '@/constants/colors';

type TabType = 'analytics' | 'leads' | 'events' | 'clients' | 'venues';

export default function EventManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  
  const scrollY = useRef(0);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canApprove = canManage || user?.designation === 'manager';

  // Fetch data when tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'analytics':
          // Fetch all data for analytics
          const [leadsData, eventsData, clientsData, venuesData] = await Promise.all([
            eventsService.getLeads(),
            eventsService.getEvents(),
            eventsService.getClients(),
            eventsService.getVenues(),
          ]);
          setLeads(leadsData);
          setEvents(eventsData);
          setClients(clientsData);
          setVenues(venuesData);
          break;
        case 'leads':
          const leadsDataSingle = await eventsService.getLeads();
          setLeads(leadsDataSingle);
          break;
        case 'events':
          const eventsDataSingle = await eventsService.getEvents();
          setEvents(eventsDataSingle);
          break;
        case 'clients':
          const clientsDataSingle = await eventsService.getClients();
          setClients(clientsDataSingle);
          break;
        case 'venues':
          const venuesDataSingle = await eventsService.getVenues();
          setVenues(venuesDataSingle);
          break;
      }
    } catch (error: any) {
      console.error('Event management fetch error:', error.message || error);
      Alert.alert('Error', `Failed to fetch data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Calculate analytics statistics
  const calculateStatistics = useMemo(() => {
    const totalLeads = leads.length;
    const pendingLeads = leads.filter((l) => l.status === 'pending').length;
    const convertedLeads = leads.filter((l) => l.status === 'converted').length;
    const rejectedLeads = leads.filter((l) => l.status === 'rejected').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalRevenue = events.reduce((sum, e) => sum + (e.total_budget || 0), 0);
    const activeEvents = events.filter((e) => e.status === 'in-progress').length;
    const completedEvents = events.filter((e) => e.status === 'completed').length;
    const plannedEvents = events.filter((e) => e.status === 'planned').length;
    const cancelledEvents = events.filter((e) => e.status === 'cancelled').length;

    const totalClients = clients.length;
    const b2bClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2b'))
    ).length;
    const b2cClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2c'))
    ).length;
    const b2gClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2g'))
    ).length;

    const onlineLeads = leads.filter((l) => l.source === 'online').length;
    const offlineLeads = leads.filter((l) => l.source === 'offline').length;

    return {
      totalLeads,
      pendingLeads,
      convertedLeads,
      rejectedLeads,
      conversionRate,
      totalRevenue,
      activeEvents,
      completedEvents,
      plannedEvents,
      cancelledEvents,
      totalClients,
      b2bClients,
      b2cClients,
      b2gClients,
      onlineLeads,
      offlineLeads,
    };
  }, [leads, events, clients]);

  // Get current data based on active tab
  const getCurrentData = () => {
    let data: any[] = [];
    
    switch (activeTab) {
      case 'leads':
        if (!Array.isArray(leads)) {
          return [];
        }
        data = leads
          .filter(lead => lead && lead.id) // Filter out null/undefined leads
          .map(lead => ({
            id: lead.id,
            clientName: lead?.client?.name || 'N/A',
            contactPerson: lead?.client?.number || lead?.client?.leadperson || 'N/A',
            phone: lead?.client?.number || 'N/A',
            email: lead?.client?.email || 'N/A',
            status: lead?.status || 'pending',
            assignedTo: lead?.user_name || 'Unassigned',
            createdDate: lead?.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : 'N/A',
            createdBy: lead?.user || 'N/A',
          }));
        break;
      case 'events':
        if (!Array.isArray(events)) {
          return [];
        }
        data = events.map(event => ({
          id: event?.id || 0,
          eventName: event?.name || 'N/A',
          clientName: event?.client?.name || 'N/A',
          startDate: event?.start_date ? new Date(event.start_date).toLocaleDateString('en-IN') : 'N/A',
          endDate: event?.end_date ? new Date(event.end_date).toLocaleDateString('en-IN') : 'N/A',
          venue: event?.venue?.name || 'N/A',
          status: event?.status || 'planned',
          budget: event?.total_budget || 0,
          createdBy: event?.created_by || 'N/A',
        }));
        break;
      case 'clients':
        if (!Array.isArray(clients)) {
          return [];
        }
        data = clients.map(client => ({
          id: client?.id || 0,
          name: client?.name || 'N/A',
          contactPerson: client?.leadperson || client?.number || 'N/A',
          phone: client?.number || 'N/A',
          email: client?.email || 'N/A',
          category: client?.category && Array.isArray(client.category) && client.category.length > 0 ? client.category.map((c: any) => c?.name || '').join(', ') : 'N/A',
          organisation: client?.organisation && Array.isArray(client.organisation) && client.organisation.length > 0 ? client.organisation.map((o: any) => o?.name || '').join(', ') : '-',
          createdBy: client?.created_by || 'N/A',
        }));
        break;
      case 'venues':
        if (!Array.isArray(venues)) {
          return [];
        }
        data = venues.map(venue => ({
          id: venue?.id || 0,
          name: venue?.name || 'N/A',
          address: venue?.address || 'N/A',
          capacity: venue?.capacity || 'N/A',
          contactPerson: venue?.contact_person || '-',
          contactPhone: venue?.contact_phone || '-',
          createdBy: venue?.created_by || 'N/A',
        }));
        break;
    }

    // Role-based filtering
    if (user?.category === 'intern' || user?.category === 'employee') {
      data = data.filter(item => item.createdBy === user.id);
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
        switch (activeTab) {
          case 'leads':
            return (
              item.clientName?.toLowerCase().includes(searchLower) ||
              item.contactPerson?.toLowerCase().includes(searchLower) ||
              item.email?.toLowerCase().includes(searchLower) ||
              item.phone?.includes(searchQuery)
            );
          case 'events':
            return (
              item.eventName?.toLowerCase().includes(searchLower) ||
              item.clientName?.toLowerCase().includes(searchLower) ||
              item.venue?.toLowerCase().includes(searchLower)
            );
          case 'clients':
            return (
              item.name?.toLowerCase().includes(searchLower) ||
              item.contactPerson?.toLowerCase().includes(searchLower) ||
              item.email?.toLowerCase().includes(searchLower) ||
              item.phone?.includes(searchQuery)
            );
          case 'venues':
            return (
              item.name?.toLowerCase().includes(searchLower) ||
              item.address?.toLowerCase().includes(searchLower) ||
              item.contactPerson?.toLowerCase().includes(searchLower)
            );
          default:
            return true;
        }
      });
    }

    // Apply status filter (only for leads and events)
    if (selectedStatus && selectedStatus !== 'all' && (activeTab === 'leads' || activeTab === 'events')) {
      data = data.filter((item: any) => item.status === selectedStatus);
    }

    return data;
  }, [activeTab, searchQuery, selectedStatus, leads, events, clients, venues, user]);

  // Lead columns
  const leadColumns = [
    {
      key: 'clientName',
      title: 'Client',
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
          status={item?.status || 'pending'}
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
      width: 180,
      render: (item: any) => {
        if (!item || !item.id) return null;
        
        const isPending = item.status === 'pending';
        
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {isPending && (
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  router.push({
                    pathname: '/(modules)/events/convert-lead',
                    params: { leadId: item.id.toString() }
                  } as any);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: pressed ? theme.colors.primary + 'dd' : theme.colors.primary,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                })}
              >
                <Ionicons name="swap-horizontal" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Convert</Text>
              </Pressable>
            )}
            
            <Pressable
              onPress={async (e) => {
                e?.stopPropagation?.();
                try {
                  await eventsService.deleteLead(item.id);
                  fetchData();
                } catch (error: any) {
                  // Silent error
                }
              }}
              style={({ pressed }) => ({
                padding: 6,
                backgroundColor: pressed ? '#DC2626dd' : 'transparent',
                borderRadius: 6,
              })}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </Pressable>
          </View>
        );
      },
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
      key: 'clientName',
      title: 'Client',
      sortable: true,
      width: 130,
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
      render: (item: any) => item.budget ? `₹${item.budget.toLocaleString('en-IN')}` : '-',
    },
  ];

  // Client columns
  const clientColumns = [
    {
      key: 'name',
      title: 'Name',
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
      key: 'email',
      title: 'Email',
      sortable: false,
      width: 180,
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      width: 100,
    },
    {
      key: 'organisation',
      title: 'Organisation',
      sortable: true,
      width: 130,
    },
  ];

  // Venue columns
  const venueColumns = [
    {
      key: 'name',
      title: 'Venue Name',
      sortable: true,
      width: 150,
    },
    {
      key: 'address',
      title: 'Address',
      sortable: false,
      width: 200,
    },
    {
      key: 'capacity',
      title: 'Capacity',
      sortable: true,
      width: 100,
    },
    {
      key: 'contactPerson',
      title: 'Contact Person',
      sortable: false,
      width: 130,
    },
    {
      key: 'contactPhone',
      title: 'Contact Phone',
      sortable: false,
      width: 120,
    },
  ];

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'leads':
        return leadColumns;
      case 'events':
        return eventColumns;
      case 'clients':
        return clientColumns;
      case 'venues':
        return venueColumns;
      default:
        return [];
    }
  };

  // Handlers
  const handleRowPress = (row: any) => {
    router.push({
      pathname: '/(modules)/events/[id]',
      params: { id: row.id, type: activeTab },
    });
  };

  const handleAddNew = () => {
    switch (activeTab) {
      case 'leads':
        router.push('/(modules)/events/add-lead' as any);
        break;
      case 'clients':
        router.push('/(modules)/events/add-client' as any);
        break;
      case 'venues':
        router.push('/(modules)/events/add-venue' as any);
        break;
      // Events don't have direct creation - only from leads
    }
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
    { key: 'clients' as TabType, label: 'Clients', icon: 'people' as const },
    { key: 'venues' as TabType, label: 'Venues', icon: 'location' as const },
    { key: 'analytics' as TabType, label: 'Analytics', icon: 'stats-chart' as const },
  ];

  const statusOptions = () => {
    switch (activeTab) {
      case 'leads':
        return [
          { label: 'All Status', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Converted', value: 'converted' },
          { label: 'Rejected', value: 'rejected' },
        ];
      case 'events':
        return [
          { label: 'All Status', value: 'all' },
          { label: 'Planned', value: 'planned' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ];
      default:
        return [{ label: 'All', value: 'all' }];
    }
  };

  const showFAB = activeTab !== 'events' && activeTab !== 'analytics'; // No FAB on events/analytics tabs

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
        {loading && activeTab !== 'analytics' ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : activeTab === 'analytics' ? (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
          >
            {/* Analytics Dashboard */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
              {/* Section Title */}
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 22, 
                  fontWeight: '700', 
                  color: theme.colors.text,
                  marginBottom: 4,
                  textAlign: 'center',
                }}>
                  Dashboard Overview
                </Text>
                <Text style={{ 
                  fontSize: 13, 
                  color: theme.colors.textSecondary,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  Key metrics and insights at a glance
                </Text>
              </View>

              {/* KPI Cards Grid - 2x2 Grid with proper alignment */}
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                <View style={{ width: '48.5%', marginBottom: 12 }}>
                  <KPICard
                    title="Total Leads"
                    value={calculateStatistics.totalLeads}
                    icon="people-circle"
                    gradientColors={COLORS.gradients.blue as [string, string]}
                    subtitle="All time"
                    onPress={() => setActiveTab('leads')}
                  />
                </View>

                <View style={{ width: '48.5%', marginBottom: 12 }}>
                  <KPICard
                    title="Conversion Rate"
                    value={`${calculateStatistics.conversionRate.toFixed(1)}%`}
                    icon="trending-up"
                    gradientColors={COLORS.gradients.green as [string, string]}
                    trend="up"
                    trendValue={`${calculateStatistics.convertedLeads} converted`}
                  />
                </View>

                <View style={{ width: '48.5%', marginBottom: 12 }}>
                  <KPICard
                    title="Total Revenue"
                    value={`₹${(calculateStatistics.totalRevenue / 100000).toFixed(1)}L`}
                    icon="cash"
                    gradientColors={COLORS.gradients.purple as [string, string]}
                    subtitle="From all events"
                    onPress={() => setActiveTab('events')}
                  />
                </View>

                <View style={{ width: '48.5%', marginBottom: 12 }}>
                  <KPICard
                    title="Active Events"
                    value={calculateStatistics.activeEvents}
                    icon="calendar"
                    gradientColors={COLORS.gradients.orange as [string, string]}
                    subtitle="In progress"
                    onPress={() => setActiveTab('events')}
                  />
                </View>
              </View>

              {/* Charts Section - Only Important Charts */}
              <View style={{ gap: 16 }}>
                {/* Section Title */}
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    color: theme.colors.text,
                    textAlign: 'center',
                  }}>
                    Performance Analytics
                  </Text>
                </View>

                {/* Conversion Funnel - Most Important */}
                <ConversionFunnelChart
                  data={{
                    total: calculateStatistics.totalLeads,
                    pending: calculateStatistics.pendingLeads,
                    converted: calculateStatistics.convertedLeads,
                  }}
                />

                {/* Event Status Distribution */}
                <EventStatusPieChart
                  data={[
                    {
                      status: 'Planned',
                      count: calculateStatistics.plannedEvents,
                      color: COLORS.charts.info,
                    },
                    {
                      status: 'In Progress',
                      count: calculateStatistics.activeEvents,
                      color: COLORS.charts.secondary,
                    },
                    {
                      status: 'Completed',
                      count: calculateStatistics.completedEvents,
                      color: COLORS.charts.success,
                    },
                    {
                      status: 'Cancelled',
                      count: calculateStatistics.cancelledEvents,
                      color: COLORS.charts.danger,
                    },
                  ]}
                />

                {/* Lead Sources - Compact Card */}
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors.text, 
                    marginBottom: 12,
                    textAlign: 'center',
                  }}>
                    Lead Sources
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ 
                      flex: 1, 
                      alignItems: 'center', 
                      padding: 16, 
                      backgroundColor: COLORS.status.online.bg, 
                      borderRadius: 12,
                      gap: 6,
                    }}>
                      <Ionicons name="globe-outline" size={32} color={COLORS.status.online.text} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.status.online.text }}>
                        {calculateStatistics.onlineLeads}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.status.online.dark, fontWeight: '600' }}>
                        Online
                      </Text>
                    </View>
                    <View style={{ 
                      flex: 1, 
                      alignItems: 'center', 
                      padding: 16, 
                      backgroundColor: COLORS.status.offline.bg, 
                      borderRadius: 12,
                      gap: 6,
                    }}>
                      <Ionicons name="storefront-outline" size={32} color={COLORS.status.offline.text} />
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.status.offline.text }}>
                        {calculateStatistics.offlineLeads}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.status.offline.dark, fontWeight: '600' }}>
                        Offline
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
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
        )}
      </View>

      {/* Floating Action Buttons */}
      {showFAB && (
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
      )}

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
              {statusOptions().map((option) => (
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
