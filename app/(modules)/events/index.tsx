/**
 * Events Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Refactored from monolithic component to orchestrate specialized components
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useEventsStore } from '@/store/eventsStore';

// Import modular components
import EventsAnalytics from './components/EventsAnalytics';
import EventsList from './components/EventsList';
import LeadsList from './components/LeadsList';
import ClientsList from './components/ClientsList';
import VenuesList from './components/VenuesList';
import EventsFilters from './components/EventsFilters';

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

  const fabConfig = getFABConfig();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ModuleHeader
        title="Event Management"
        showBack
      />

      {/* Tab Navigation */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Filters */}
      {activeTab !== 'analytics' && (
        <EventsFilters
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

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
        <FloatingActionButton
          icon={fabConfig.icon}
          onPress={fabConfig.onPress}
        />
      )}
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
