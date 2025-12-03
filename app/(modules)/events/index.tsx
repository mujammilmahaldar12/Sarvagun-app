/**
 * Events Management Screen
 * Professional, modular implementation with proper separation of concerns
 * Refactored from monolithic component to orchestrate specialized components
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, BackHandler, Modal, Pressable, Text, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  const insets = useSafeAreaInsets();
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
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
        icon: 'add' as const,
        onPress: () => router.push('/(modules)/events/add-lead'),
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
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
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
        contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom + 16) }}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setIsAtTop(offsetY <= 0);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            enabled={isAtTop}
            progressViewOffset={0}
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
          position="bottom-left"
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
