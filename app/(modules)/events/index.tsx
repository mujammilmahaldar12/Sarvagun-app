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
import { FilterBar } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useEventsStore } from '@/store/eventsStore';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useModule } from '@/hooks/useModule';

// Import modular components
import EventsAnalytics from './components/EventsAnalytics';
import EventsList from './components/EventsList';
import LeadsList from './components/LeadsList';
import ClientsList from './components/ClientsList';
import VenuesList from './components/VenuesList';

type TabType = 'analytics' | 'leads' | 'events' | 'clients' | 'venues';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  // Permission checks
  const { canManage, can: canView } = useModule('events.events');

  if (!isAuthenticated) return null;

  if (!canView('view')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
        <Text style={{ marginTop: 16, fontSize: 18, color: theme.textSecondary }}>Access Denied</Text>
      </View>
    );
  }

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
      // Refresh frequently for leads to ensure new additions appear immediately
      // 2 seconds for leads (so it practically always refreshes after adding a lead and coming back)
      // 30 seconds for others to save bandwidth
      const refreshInterval = activeTab === 'leads' ? 2000 : 30000;

      if (isAuthenticated && user && initialLoadDone && (now - lastFocusTime > refreshInterval)) {
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
    // Don't auto-show filters on tab change, keep it clean
  }, []);

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
          icon: 'funnel' as const,
          type: 'select' as const,
          options: [
            { label: 'Pending', value: 'pending', color: '#f59e0b' },
            { label: 'Converted', value: 'converted', color: '#10b981' },
            { label: 'Rejected', value: 'rejected', color: '#ef4444' },
          ],
        },
        {
          key: 'dateRange',
          label: 'Date Range',
          icon: 'calendar-outline' as const,
          type: 'daterange' as const,
        },
      ];
    } else if (activeTab === 'events') {
      return [
        {
          key: 'status',
          label: 'Status',
          icon: 'funnel' as const,
          type: 'select' as const,
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
          icon: 'calendar-outline' as const,
          type: 'daterange' as const,
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
      onRefresh,
    };

    const filterConfigs = getFilterConfigs();

    const headerComponent = (
      <View>
        <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key || '')}
                  style={[
                    styles.tab,
                    activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.primary }],
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === tab.key ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === tab.key ? theme.primary : theme.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {showFilters && filterConfigs.length > 0 && (
          <FilterBar
            configs={filterConfigs as any}
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

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <ModuleHeader
        title="Event Management"
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name={showFilters ? "filter" : "filter-outline"} size={22} color={theme.text} />
            </TouchableOpacity>
            {['leads', 'clients', 'venues'].includes(activeTab) && canManage && (
              <TouchableOpacity
                onPress={() => {
                  if (activeTab === 'leads') router.push('/(modules)/events/add-lead' as any);
                  if (activeTab === 'clients') router.push('/events/add-client' as any);
                  if (activeTab === 'venues') router.push('/events/add-venue' as any);
                }}
                style={{
                  padding: 4,
                  backgroundColor: theme.primary + '15',
                  borderRadius: 8,
                }}
              >
                <Ionicons name="add" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </Animated.View >
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
} as const;
