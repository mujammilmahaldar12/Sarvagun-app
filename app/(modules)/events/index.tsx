/**
 * Events Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Refactored from monolithic component to orchestrate specialized components
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, BackHandler, Modal, Pressable, Text, Platform, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import TabBar, { Tab } from '@/components/layout/TabBar';
import { FAB, FilterBar } from '@/components';
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
  const insets = useSafeAreaInsets();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';

  // Track if initial data has been loaded
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Initialize data on component mount - only once
  useEffect(() => {
    if (isAuthenticated && user && !initialLoadDone) {
      console.log('✅ Events: User authenticated, initializing data...');
      initializeData().then(() => setInitialLoadDone(true));
    }
  }, [isAuthenticated, user, initialLoadDone]);

  // Fetch data when tab changes - debounced to prevent rapid switching issues
  useEffect(() => {
    if (!isAuthenticated || !user || !initialLoadDone) return;

    const timeoutId = setTimeout(() => {
      console.log(`🔄 Events: Fetching data for tab: ${activeTab}`);
      fetchTabData();
    }, 100); // Small delay to prevent rapid tab switching issues

    return () => clearTimeout(timeoutId);
  }, [activeTab, initialLoadDone]);

  // Handle back button on Android
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Only call router.back() if we can actually go back
        if (navigation.canGoBack()) {
          router.back();
          return true;
        }
        // Return false to let the default behavior happen (exit app or go to home)
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router, navigation])
  );

  // Refresh data when screen gains focus - only if coming back from another screen
  const [lastFocusTime, setLastFocusTime] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refresh if more than 30 seconds since last focus (avoid rapid re-fetches)
      if (isAuthenticated && user && initialLoadDone && (now - lastFocusTime > 30000)) {
        console.log('🔄 Events: Screen focused, soft refresh...');
        setLastFocusTime(now);
        // Only fetch current tab data, not everything
        fetchTabData();
      }
    }, [activeTab, isAuthenticated, user, initialLoadDone, lastFocusTime])
  );

  // Initialize required data
  const initializeData = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Events: Not authenticated, skipping data initialization');
      return;
    }

    try {
      console.log('🔄 Events: Fetching reference data and initial tab data...');
      // Fetch reference data that's commonly needed
      await Promise.all([
        eventsStore.fetchClientCategories(),
        eventsStore.fetchOrganisations(),
      ]);
      console.log('✅ Events: Reference data loaded successfully');

      // Fetch initial tab data (leads by default)
      console.log('🔄 Events: Fetching initial leads data...');
      await eventsStore.fetchLeads(true); // true = force refresh
      console.log('✅ Events: Initial data loaded successfully');
    } catch (error) {
      console.error('❌ Events: Error initializing data:', error);
    }
  };

  // Fetch data based on active tab - optimized to use cache
  const fetchTabData = async () => {
    if (!isAuthenticated) return;

    try {
      switch (activeTab) {
        case 'analytics':
          // Fetch all data needed for analytics - force refresh if no data
          console.log('🔄 Events: Fetching analytics data...');
          const hasLeads = eventsStore.leads.length > 0;
          const hasEvents = eventsStore.events.length > 0;
          const hasClients = eventsStore.clients.length > 0;

          await Promise.all([
            eventsStore.fetchLeads(!hasLeads), // force if empty
            eventsStore.fetchEvents(!hasEvents), // force if empty
            eventsStore.fetchClients(!hasClients), // force if empty
          ]);
          console.log('✅ Events: Analytics data loaded');
          break;
        case 'leads':
          await eventsStore.fetchLeads(false);
          break;
        case 'events':
          await eventsStore.fetchEvents(false);
          break;
        case 'clients':
          await eventsStore.fetchClients(false);
          break;
        case 'venues':
          await eventsStore.fetchVenues(false);
          break;
      }
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

  // Handle filter changes
  useEffect(() => {
    const statusValue = filters.status === 'all' ? undefined : filters.status;
    const start_date = filters.dateRange?.start;
    const end_date = filters.dateRange?.end;

    console.log('Applying filters:', { activeTab, statusValue, start_date, end_date });

    switch (activeTab) {
      case 'leads':
        eventsStore.setFilter('leads', {
          status: statusValue,
          start_date,
          end_date
        });
        break;
      case 'events':
        eventsStore.setFilter('events', {
          status: statusValue,
          start_date,
          end_date
        });
        break;
    }
  }, [filters, activeTab]);

  // Handle tab changes
  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey as TabType);
    // Reset filters when changing tabs
    setSearchQuery('');
    setFilters({});
  }, []);

  // Get FAB configuration based on active tab
  const getFABConfig = () => {
    if (!canManage) return null;

    const configs = {
      leads: {
        icon: 'add' as const,
        onPress: () => router.push('/(modules)/events/add-lead'),
        label: 'Add Lead',
      },
      events: null, // Events are created only by converting leads
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

  // Filter configuration
  const getFilterConfigs = () => {
    if (activeTab === 'leads') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel',
          type: 'select',
          options: [
            { label: 'Pending', value: 'pending', color: '#f59e0b' },
            { label: 'Converted', value: 'converted', color: '#10b981' },
            { label: 'Rejected', value: 'rejected', color: '#ef4444' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline',
          type: 'daterange',
        },
      ];
    } else if (activeTab === 'events') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel',
          type: 'select',
          options: [
            { label: 'Upcoming', value: 'upcoming', color: '#3b82f6' },
            { label: 'Ongoing', value: 'ongoing', color: '#10b981' },
            { label: 'Completed', value: 'completed', color: '#6b7280' },
            { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline',
          type: 'daterange',
        },
      ];
    }
    return [];
  };

  // Render active tab content
  const renderTabContent = () => {
    const commonProps = {
      searchQuery,
      refreshing,
    };

    const filterConfigs = getFilterConfigs();

    const headerComponent = (
      <View>
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="pill"
        />

        {filterConfigs.length > 0 && (
          <FilterBar
            configs={filterConfigs}
            activeFilters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </View>
    );

    switch (activeTab) {
      case 'analytics':
        return <EventsAnalytics {...commonProps} headerComponent={headerComponent} />;

      case 'leads':
        return (
          <LeadsList
            {...commonProps}
            selectedStatus={filters.status || 'all'}
            headerComponent={headerComponent}
          />
        );

      case 'events':
        return (
          <EventsList
            {...commonProps}
            selectedStatus={filters.status || 'all'}
            headerComponent={headerComponent}
          />
        );

      case 'clients':
        return (
          <ClientsList
            {...commonProps}
            selectedCategory={filters.category}
            headerComponent={headerComponent}
          />
        );

      case 'venues':
        return <VenuesList {...commonProps} headerComponent={headerComponent} />;

      default:
        return null;
    }
  };

  const fabConfig = getFABConfig();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <ModuleHeader
        title="Event Management"
      />

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Floating Action Button */}
      {fabConfig && (
        <FAB
          icon={fabConfig.icon}
          onPress={fabConfig.onPress}
          position="bottom-left"
        />
      )}
    </Animated.View>
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
