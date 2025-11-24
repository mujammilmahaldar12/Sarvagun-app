/**
 * Events Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Refactored from monolithic component to orchestrate specialized components
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, BackHandler, Modal, Pressable, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { FAB } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useEventsStore } from '@/store/eventsStore';
import { getTypographyStyle } from '@/utils/styleHelpers';

// Import modular components
import EventsAnalytics from './components/EventsAnalytics';
import EventsList from './components/EventsList';
import LeadsList from './components/LeadsList';
import ClientsList from './components/ClientsList';
import VenuesList from './components/VenuesList';

type TabType = 'analytics' | 'leads' | 'events' | 'clients' | 'venues';

export default function EventManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const eventsStore = useEventsStore();
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';

  // Initialize data on component mount - only if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Events: User authenticated, initializing data...');
      initializeData();
    } else {
      console.log('⚠️ Events: User not authenticated, skipping data initialization');
    }
  }, [isAuthenticated, user]);

  // Fetch data when tab changes - only if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log(`🔄 Events: Fetching data for tab: ${activeTab}`);
      fetchTabData();
    } else {
      console.log(`⚠️ Events: Not authenticated, skipping ${activeTab} data fetch`);
    }
  }, [activeTab, isAuthenticated, user]);

  // Handle back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  // Refresh data when screen gains focus (e.g., after creating a lead)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        console.log('🔄 Events: Screen focused, refreshing data...');
        fetchTabData();
      }
    }, [activeTab, isAuthenticated, user])
  );

  // Initialize required data
  const initializeData = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Events: Not authenticated, skipping data initialization');
      return;
    }
    
    try {
      console.log('🔄 Events: Fetching reference data...');
      // Fetch reference data that's commonly needed
      await Promise.all([
        eventsStore.fetchClientCategories(),
        eventsStore.fetchOrganisations(),
      ]);
      console.log('✅ Events: Reference data loaded successfully');
    } catch (error) {
      console.error('❌ Events: Error initializing data:', error);
    }
  };

  // Fetch data based on active tab
  const fetchTabData = async () => {
    if (!isAuthenticated) {
      console.log(`⚠️ Events: Not authenticated, skipping ${activeTab} data fetch`);
      return;
    }
    
    try {
      console.log(`🔄 Events: Fetching ${activeTab} data...`);
      switch (activeTab) {
        case 'analytics':
          // Fetch all data for analytics
          await Promise.all([
            eventsStore.fetchLeads(),
            eventsStore.fetchEvents(),
            eventsStore.fetchClients(),
            eventsStore.fetchVenues(),
            eventsStore.fetchLeadStatistics(),
          ]);
          break;
        case 'leads':
          await eventsStore.fetchLeads();
          await eventsStore.fetchLeadStatistics();
          break;
        case 'events':
          await eventsStore.fetchEvents();
          break;
        case 'clients':
          await eventsStore.fetchClients();
          break;
        case 'venues':
          await eventsStore.fetchVenues();
          break;
      }
      console.log(`✅ Events: ${activeTab} data loaded successfully`);
    } catch (error) {
      console.error(`❌ Events: Error fetching ${activeTab} data:`, error);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cache and fetch fresh data
      eventsStore.clearCache();
      await fetchTabData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  // Handle search changes with debouncing
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Update store filters based on active tab
    switch (activeTab) {
      case 'leads':
        eventsStore.setFilter('leads', { search: query });
        break;
      case 'events':
        eventsStore.setFilter('events', { search: query });
        break;
      case 'clients':
        eventsStore.setFilter('clients', { search: query });
        break;
      case 'venues':
        eventsStore.setFilter('venues', { search: query });
        break;
    }
  }, [activeTab, eventsStore]);

  // Handle status filter changes
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    
    const statusValue = status === 'all' ? undefined : status;
    
    switch (activeTab) {
      case 'leads':
        eventsStore.setFilter('leads', { status: statusValue });
        break;
      case 'events':
        eventsStore.setFilter('events', { status: statusValue });
        break;
    }
  }, [activeTab, eventsStore]);

  // Handle category filter changes
  const handleCategoryChange = useCallback((categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    
    if (activeTab === 'clients') {
      eventsStore.setFilter('clients', { category: categoryId });
    }
  }, [activeTab, eventsStore]);

  // Handle tab changes
  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey as TabType);
    // Reset filters when changing tabs
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedCategory(undefined);
  }, []);

  // Get FAB configuration based on active tab
  const getFABConfig = () => {
    if (!canManage) return null;

    const configs = {
      leads: {
        icon: 'person-add' as const,
        onPress: () => router.push('/events/add-lead'),
        label: 'Add Lead',
      },
      events: {
        icon: 'calendar' as const,
        onPress: () => router.push('/events/add-event'),
        label: 'Add Event',
      },
      clients: {
        icon: 'people' as const,
        onPress: () => router.push('/events/add-client'),
        label: 'Add Client',
      },
      venues: {
        icon: 'location' as const,
        onPress: () => router.push('/events/add-venue'),
        label: 'Add Venue',
      },
      analytics: null,
    };

    return configs[activeTab];
  };

  // Tab configuration
  const tabs: Tab[] = [
    { key: 'analytics', label: 'Analytics', icon: 'analytics' },
    { key: 'leads', label: 'Leads', icon: 'person-add' },
    { key: 'events', label: 'Events', icon: 'calendar' },
    { key: 'clients', label: 'Clients', icon: 'people' },
    { key: 'venues', label: 'Venues', icon: 'location' },
  ];

  // Render active tab content
  const renderTabContent = () => {
    const commonProps = {
      searchQuery,
      refreshing,
    };

    switch (activeTab) {
      case 'analytics':
        return <EventsAnalytics {...commonProps} />;
        
      case 'leads':
        return (
          <LeadsList 
            {...commonProps}
            selectedStatus={selectedStatus}
          />
        );
        
      case 'events':
        return (
          <EventsList 
            {...commonProps}
            selectedStatus={selectedStatus}
          />
        );
        
      case 'clients':
        return (
          <ClientsList 
            {...commonProps}
            selectedCategory={selectedCategory}
          />
        );
        
      case 'venues':
        return <VenuesList {...commonProps} />;
        
      default:
        return null;
    }
  };

  const handleFilter = () => {
    setFilterModalVisible(true);
  };

  const applyFilter = (status: string) => {
    handleStatusChange(status);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setSelectedCategory(undefined);
    setFilterModalVisible(false);
    
    // Clear store filters
    eventsStore.setFilter('leads', { search: '', status: undefined });
    eventsStore.setFilter('events', { search: '', status: undefined });
    eventsStore.setFilter('clients', { search: '', category: undefined });
    eventsStore.setFilter('venues', { search: '' });
  };

  const fabConfig = getFABConfig();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ModuleHeader
        title="Event Management"
        onFilter={handleFilter}
      />

      {/* Tab Navigation */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Floating Action Button */}
      {fabConfig && (
        <FAB
          icon={fabConfig.icon}
          onPress={fabConfig.onPress}
          position="bottom-right"
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={[getTypographyStyle('xl', 'bold'), { color: theme.text }]}>
                Filter by Status
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* All */}
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: selectedStatus === 'all' ? `${theme.primary}20` : theme.background,
                }}
                onPress={() => applyFilter('all')}
              >
                <Ionicons
                  name={selectedStatus === 'all' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selectedStatus === 'all' ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    getTypographyStyle('base', 'semibold'),
                    { color: selectedStatus === 'all' ? theme.primary : theme.text, marginLeft: 12 }
                  ]}
                >
                  All {activeTab === 'leads' ? 'Leads' : activeTab === 'events' ? 'Events' : activeTab}
                </Text>
              </Pressable>

              {/* Status filters based on active tab */}
              {(activeTab === 'leads' || activeTab === 'events') && (
                <>
                  <Pressable
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: selectedStatus === 'pending' ? `${theme.primary}20` : theme.background,
                    }}
                    onPress={() => applyFilter('pending')}
                  >
                    <Ionicons
                      name={selectedStatus === 'pending' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selectedStatus === 'pending' ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        getTypographyStyle('base', 'semibold'),
                        { color: selectedStatus === 'pending' ? theme.primary : theme.text, marginLeft: 12 }
                      ]}
                    >
                      Pending
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: selectedStatus === 'confirmed' ? `${theme.primary}20` : theme.background,
                    }}
                    onPress={() => applyFilter('confirmed')}
                  >
                    <Ionicons
                      name={selectedStatus === 'confirmed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selectedStatus === 'confirmed' ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        getTypographyStyle('base', 'semibold'),
                        { color: selectedStatus === 'confirmed' ? theme.primary : theme.text, marginLeft: 12 }
                      ]}
                    >
                      Confirmed
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: selectedStatus === 'completed' ? `${theme.primary}20` : theme.background,
                    }}
                    onPress={() => applyFilter('completed')}
                  >
                    <Ionicons
                      name={selectedStatus === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selectedStatus === 'completed' ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        getTypographyStyle('base', 'semibold'),
                        { color: selectedStatus === 'completed' ? theme.primary : theme.text, marginLeft: 12 }
                      ]}
                    >
                      Completed
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: selectedStatus === 'cancelled' ? `${theme.primary}20` : theme.background,
                    }}
                    onPress={() => applyFilter('cancelled')}
                  >
                    <Ionicons
                      name={selectedStatus === 'cancelled' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selectedStatus === 'cancelled' ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        getTypographyStyle('base', 'semibold'),
                        { color: selectedStatus === 'cancelled' ? theme.primary : theme.text, marginLeft: 12 }
                      ]}
                    >
                      Cancelled
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            {/* Clear Filters Button */}
            <Pressable
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: theme.background,
              }}
              onPress={clearFilters}
            >
              <Text style={[getTypographyStyle('base', 'semibold'), { color: theme.textSecondary }]}>
                Clear All Filters
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
} as const;
