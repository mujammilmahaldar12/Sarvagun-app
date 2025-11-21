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
import AppTable from '@/components/ui/AppTable';
import StatusBadge from '@/components/ui/StatusBadge';
import ActionButton from '@/components/ui/ActionButton';
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
    if (!Array.isArray(events)) {
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
    router.push(`/events/${eventId}`);
  };

  const handleEditEvent = (eventId: number) => {
    router.push(`/events/edit-event?eventId=${eventId}`);
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

  // Table configuration
  const columns = [
    { 
      key: 'eventName', 
      title: 'Event Name', 
      width: 150,
      render: (value: string, row: EventRowData) => (
        <Text 
          style={[styles.cellText, { color: theme.text, fontWeight: designSystem.typography.weights.medium }]}
          numberOfLines={2}
        >
          {value}
        </Text>
      ),
    },
    { 
      key: 'clientName', 
      title: 'Client', 
      width: 120,
      render: (value: string) => (
        <Text style={[styles.cellText, { color: theme.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ),
    },
    { 
      key: 'startDate', 
      title: 'Start Date', 
      width: 100,
      render: (value: string) => (
        <Text style={[styles.cellText, { color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }]}>
          {value}
        </Text>
      ),
    },
    { 
      key: 'endDate', 
      title: 'End Date', 
      width: 100,
      render: (value: string) => (
        <Text style={[styles.cellText, { color: theme.textSecondary, fontSize: designSystem.typography.sizes.sm }]}>
          {value}
        </Text>
      ),
    },
    { 
      key: 'venue', 
      title: 'Venue', 
      width: 120,
      render: (value: string) => (
        <Text style={[styles.cellText, { color: theme.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ),
    },
    { 
      key: 'status', 
      title: 'Status', 
      width: 100,
      render: (value: string, row: EventRowData) => (
        <StatusBadge 
          status={value}
        />
      ),
    },
    { 
      key: 'budget', 
      title: 'Budget', 
      width: 120,
      render: (value: number) => (
        <Text style={[styles.cellText, { 
          color: value > 0 ? designSystem.baseColors.success[600] : theme.textSecondary,
          fontWeight: value > 0 ? designSystem.typography.weights.medium : designSystem.typography.weights.regular,
          fontSize: designSystem.typography.sizes.sm
        }]}>
          {value > 0 ? formatCurrency(value) : 'Not set'}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      render: (value: any, row: EventRowData) => (
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="eye-outline"
            title="View"
            onPress={() => handleEventDetails(row.id)}
            variant="secondary"
            size="small"
          />
          
          {canEditEvents && (
            <>
              <ActionButton
                icon="create-outline"
                title="Edit"
                onPress={() => handleEditEvent(row.id)}
                variant="secondary"
                size="small"
              />
              
              <ActionButton
                icon="trash-outline"
                title="Delete"
                onPress={() => handleDeleteEvent(row.id)}
                variant="danger"
                size="small"
              />
            </>
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
      {/* Summary Header */}
      <View style={[styles.summary, { 
        backgroundColor: theme.surface, 
        borderColor: theme.border,
        marginHorizontal: spacing[4],
        marginBottom: spacing[4],
      }]}>
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {processedEvents.length} events
          {selectedStatus !== 'all' && ` • ${selectedStatus} status`}
          {searchQuery && ` • filtered`}
        </Text>
      </View>

      {/* Events Table */}
      <AppTable
        data={processedEvents}
        columns={columns}
        keyExtractor={(item) => `event-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No events found"
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