/**
 * EventsList Component
 * Professional events list with filtering and actions
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn, Badge, Button } from '@/components';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useEvents } from '@/store/eventsStore';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/store/permissionStore';
import { designSystem } from '@/constants/designSystem';
import type { Event } from '@/types/events';

interface EventsListProps {
  searchQuery?: string;
  selectedStatus?: string;
  refreshing?: boolean;
}

interface EventRowData {
  id: number;
  eventName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: string;
  budget: number;
  createdBy: string | number;
}

const EventsList: React.FC<EventsListProps> = ({
  searchQuery = '',
  selectedStatus = 'all',
  refreshing = false,
}) => {
  const { theme, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { canEditEvents, canManageEvents } = usePermissions();
  
  const {
    events,
    loading,
    error,
    update: updateEvent,
    delete: deleteEvent,
    setFilter,
  } = useEvents();

  // Legacy permission checks for transition period
  // TODO: Remove after full migration to permission system
  const canManage = canManageEvents;
  const canEdit = canEditEvents;

  // Process and filter events data
  const processedEvents: EventRowData[] = useMemo(() => {
    console.log('📊 Events Debug:', {
      isArray: Array.isArray(events),
      total: Array.isArray(events) ? events.length : 0,
      firstEvent: Array.isArray(events) && events.length > 0 ? events[0] : null,
      selectedStatus,
      searchQuery,
      userId: user?.id,
      userCategory: user?.category
    });
    
    if (!Array.isArray(events)) {
      console.log('⚠️ Events is not an array:', typeof events, events);
      return [];
    }

    let filtered = events.filter(event => event && event.id);

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.name?.toLowerCase().includes(query) ||
        event.client?.name?.toLowerCase().includes(query) ||
        event.venue?.name?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    }

    // All users can view all events
    console.log(`✅ All events visible to user ${user?.id} (category: ${user?.category}). Total: ${filtered.length}`);

    // Transform to table format
    return filtered.map(event => ({
      id: event.id || 0,
      eventName: event.name || 'N/A',
      clientName: event.client?.name || 'N/A',
      startDate: event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN') : 'N/A',
      endDate: event.end_date ? new Date(event.end_date).toLocaleDateString('en-IN') : 'N/A',
      venue: event.venue?.name || 'N/A',
      status: event.status || 'planned',
      budget: event.total_budget || 0,
      createdBy: event.created_by || 'N/A',
    }));
  }, [events, selectedStatus, searchQuery]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle event actions
  const handleEventDetails = (eventId: number) => {
    router.push(`/(modules)/events/${eventId}?type=events` as any);
  };

  const handleEditEvent = (eventId: number) => {
    router.push(`/(modules)/events/add-event?id=${eventId}` as any);
  };

  const handleDeleteEvent = async (eventId: number) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              Alert.alert('Success', 'Event deleted successfully');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete event'
              );
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (eventId: number, newStatus: string) => {
    try {
      await updateEvent(eventId, { status: newStatus as Event['status'] });
      Alert.alert('Success', 'Event status updated successfully');
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update event status'
      );
    }
  };

  // Table configuration - Optimized columns with fixed widths
  const columns: TableColumn<EventRowData>[] = [
    { 
      key: 'clientName', 
      title: 'Client', 
      width: 110,
      sortable: true,
      render: (value: string) => (
        <Text 
          style={[styles.cellText, { 
            color: theme.text,
            fontSize: designSystem.typography.sizes.sm 
          }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {value || 'N/A'}
        </Text>
      ),
    },
    { 
      key: 'startDate', 
      title: 'Start', 
      width: 90,
      sortable: true,
      render: (value: string) => (
        <Text 
          style={[styles.cellText, { 
            color: theme.text,
            fontSize: 11,
            fontWeight: designSystem.typography.weights.medium 
          }]} 
          numberOfLines={1}
        >
          {value || 'N/A'}
        </Text>
      ),
    },
    { 
      key: 'endDate', 
      title: 'End', 
      width: 90,
      sortable: true,
      render: (value: string) => (
        <Text 
          style={[styles.cellText, { 
            color: theme.text,
            fontSize: 11,
            fontWeight: designSystem.typography.weights.medium 
          }]} 
          numberOfLines={1}
        >
          {value || 'N/A'}
        </Text>
      ),
    },
    { 
      key: 'venue', 
      title: 'Venue', 
      width: 110,
      sortable: true,
      render: (value: string) => (
        <Text 
          style={[styles.cellText, { 
            color: theme.text,
            fontSize: designSystem.typography.sizes.sm 
          }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {value || 'TBD'}
        </Text>
      ),
    },
    { 
      key: 'status', 
      title: 'Status', 
      width: 100,
      sortable: true,
      render: (value: string, row: EventRowData) => (
        <Badge 
          label={value || 'planned'}
          status={value as any}
          size="sm"
        />
      ),
    },
    { 
      key: 'budget', 
      title: 'Budget', 
      width: 100,
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <Text 
          style={[styles.cellText, { 
            color: value > 0 ? designSystem.baseColors.success[600] : theme.textSecondary,
            fontWeight: value > 0 ? designSystem.typography.weights.medium : designSystem.typography.weights.regular,
            fontSize: designSystem.typography.sizes.xs,
            textAlign: 'right',
          }]}
          numberOfLines={1}
        >
          {value > 0 ? formatCurrency(value) : 'Not set'}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (value: any, row: EventRowData) => (
        <View style={styles.actionsContainer}>
          <Button
            title=""
            leftIcon="eye-outline"
            onPress={() => handleEventDetails(row.id)}
            variant="ghost"
            size="sm"
          />
          
          {canEditEvents && (
            <Button
              title=""
              leftIcon="create-outline"
              onPress={() => handleEditEvent(row.id)}
              variant="ghost"
              size="sm"
              accessibilityLabel={`Edit event ${row.eventName}`}
            />
          )}
        </View>
      ),
    },
  ];

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: spacing[2] }]}>
          Loading events...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Events"
          description={error}
          actionTitle="Try Again"
          onActionPress={() => setFilter({})} // Trigger refetch
        />
      </View>
    );
  }

  // Empty state
  if (processedEvents.length === 0 && !loading) {
    const isFiltered = selectedStatus !== 'all' || searchQuery.trim() !== '';
    
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="calendar-outline"
          title={isFiltered ? 'No Events Found' : 'No Events Yet'}
          description={
            isFiltered
              ? 'Try adjusting your filters to see more results'
              : 'Create your first event to get started'
          }
          actionTitle={!isFiltered ? 'Add Event' : undefined}
          onActionPress={!isFiltered ? () => router.push('/events/add-event') : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Events Table */}
      <Table
        data={processedEvents}
        columns={columns}
        keyExtractor={(item) => `event-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No events found"
        searchable={true}
        searchPlaceholder="Search events..."
        exportable={user?.category === 'admin' || user?.category === 'hr'}
        pageSize={100}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: designSystem.spacing[4],
  },
  loadingText: {
    fontSize: designSystem.typography.sizes.base,
  },
  summary: {
    paddingHorizontal: designSystem.spacing[4],
    paddingVertical: designSystem.spacing[3],
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: designSystem.typography.weights.medium,
  },
  cellText: {
    fontSize: designSystem.typography.sizes.sm,
  },
  actionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[1],
  },
} as const;

export default EventsList;