/**
 * VenuesList Component
 * Professional venues list with filtering and actions
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo } from 'react';
import { View, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Table, type TableColumn, Button } from '@/components';
import ActionButton from '@/components/ui/ActionButton';
import { EmptyState, LoadingState } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useVenues } from '@/store/eventsStore';
import { useAuthStore } from '@/store/authStore';
import { designSystem } from '@/constants/designSystem';
import type { Venue } from '@/types/events';

interface VenuesListProps {
  searchQuery?: string;
  refreshing?: boolean;
}

interface VenueRowData {
  id: number;
  name: string;
  address: string;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  type?: string;
  facilities?: string;
  createdBy: string | number;
}

const VenuesList: React.FC<VenuesListProps> = ({
  searchQuery = '',
  refreshing = false,
}) => {
  const { theme, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const {
    venues,
    loading,
    error,
    update: updateVenue,
    delete: deleteVenue,
    setFilter,
  } = useVenues();

  // Permission checks
  const canManage = user?.category === 'hr' || user?.category === 'admin';
  const canEdit = canManage || user?.designation === 'manager';

  // Process and filter venues data
  const processedVenues: VenueRowData[] = useMemo(() => {
    if (!Array.isArray(venues)) {
      return [];
    }

    let filtered = venues.filter(venue => venue && venue.id);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(venue =>
        venue.name?.toLowerCase().includes(query) ||
        venue.address?.toLowerCase().includes(query) ||
        venue.contact_person?.toLowerCase().includes(query) ||
        venue.type?.toLowerCase().includes(query) ||
        venue.facilities?.toLowerCase().includes(query)
      );
    }

    // Transform to table format
    return filtered.map(venue => ({
      id: venue.id,
      name: venue.name || 'N/A',
      address: venue.address || 'N/A',
      capacity: venue.capacity,
      contactPerson: venue.contact_person,
      contactPhone: venue.contact_phone,
      type: venue.type,
      facilities: venue.facilities,
      createdBy: venue.created_by || 'N/A',
    }));
  }, [venues, searchQuery]);

  // Handle venue actions
  const handleVenueDetails = (venueId: number) => {
    router.push(`/events/venues/${venueId}`);
  };

  const handleEditVenue = (venueId: number) => {
    router.push(`/events/add-venue?venueId=${venueId}`);
  };

  const handleDeleteVenue = async (venueId: number) => {
    Alert.alert(
      'Delete Venue',
      'Are you sure you want to delete this venue? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVenue(venueId);
              Alert.alert('Success', 'Venue deleted successfully');
            } catch (error) {
              console.error('Error deleting venue:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete venue'
              );
            }
          },
        },
      ]
    );
  };

  // Format capacity
  const formatCapacity = (capacity?: number): string => {
    if (!capacity) return 'N/A';
    return capacity >= 1000 ? `${(capacity / 1000).toFixed(1)}K` : capacity.toString();
  };

  // Table configuration
  const columns = [
    { 
      key: 'name', 
      title: 'Venue Name', 
      width: 140,
      sortable: true,
      render: (value: string, row: VenueRowData) => (
        <View>
          <Text style={[styles.cellTextPrimary, { color: theme.text }]} numberOfLines={1}>
            {value}
          </Text>
          {row.type && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
              {row.type}
            </Text>
          )}
        </View>
      ),
    },
    { 
      key: 'address', 
      title: 'Location', 
      width: 150,
      sortable: true,
      render: (value: string) => (
        <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={2}>
          {value}
        </Text>
      ),
    },
    { 
      key: 'capacity', 
      title: 'Capacity', 
      width: 80,
      sortable: true,
      render: (value?: number) => (
        <Text style={[styles.cellTextSecondary, { 
          color: value && value > 0 ? theme.text : theme.textSecondary,
          fontWeight: value && value > 0 ? designSystem.typography.weights.medium : designSystem.typography.weights.regular
        }]}>
          {formatCapacity(value)}
        </Text>
      ),
    },
    { 
      key: 'contactPerson', 
      title: 'Contact', 
      width: 120,
      render: (value: string | undefined, row: VenueRowData) => (
        <View>
          {value && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
              {value}
            </Text>
          )}
          {row.contactPhone && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
              {row.contactPhone}
            </Text>
          )}
          {!value && !row.contactPhone && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
              N/A
            </Text>
          )}
        </View>
      ),
    },
    { 
      key: 'facilities', 
      title: 'Facilities', 
      width: 120,
      render: (value: string | undefined, row: VenueRowData) => {
        if (!value) {
          return (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
              N/A
            </Text>
          );
        }
        
        const facilities = value.split(',').map(f => f.trim()).slice(0, 2);
        return (
          <View>
            {facilities.map((facility, index) => (
              <Text 
                key={`${row.id}-facility-${index}-${facility}`}
                style={[styles.cellTextSecondary, { color: theme.textSecondary }]} 
                numberOfLines={1}
              >
                {facility}
              </Text>
            ))}
            {value.split(',').length > 2 && (
              <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
                +{value.split(',').length - 2} more
              </Text>
            )}
          </View>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (value: any, row: VenueRowData) => (
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="eye-outline"
            title="View"
            onPress={() => handleVenueDetails(row.id)}
            variant="secondary"
            size="small"
          />
          
          {canEdit && (
            <ActionButton
              icon="create-outline"
              title="Edit"
              onPress={() => handleEditVenue(row.id)}
              variant="secondary"
              size="small"
            />
          )}
          
          {canManage && (
            <ActionButton
              icon="trash-outline"
              title="Delete"
              onPress={() => handleDeleteVenue(row.id)}
              variant="danger"
              size="small"
            />
          )}
        </View>
      ),
    },
  ];

  // Loading state
  if (loading && !refreshing) {
    return <LoadingState message="Loading venues..." variant="skeleton" skeletonCount={6} />;
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Venues"
          description={error}
          action={{
            label: 'Try Again',
            onPress: () => setFilter({}), // Trigger refetch
          }}
        />
      </View>
    );
  }

  // Empty state
  if (processedVenues.length === 0 && !loading) {
    const isFiltered = searchQuery.trim() !== '';
    
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="location-outline"
          title={isFiltered ? 'No Venues Found' : 'No Venues Yet'}
          description={
            isFiltered
              ? 'Try adjusting your search to see more results'
              : 'Add your first venue to get started'
          }
          action={
            !isFiltered
              ? {
                  label: 'Add Venue',
                  onPress: () => router.push('/events/add-venue'),
                }
              : undefined
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Venues Table */}
      <Table
        data={processedVenues}
        columns={columns}
        keyExtractor={(item) => `venue-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No venues found"
        searchable={true}
        searchPlaceholder="Search venues..."
        exportable={user?.category === 'admin' || user?.category === 'hr'}
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
  summarySubtext: {
    fontSize: designSystem.typography.sizes.xs,
    marginTop: designSystem.spacing[1],
  },
  cellTextPrimary: {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: designSystem.typography.weights.medium,
  },
  cellTextSecondary: {
    fontSize: designSystem.typography.sizes.xs,
  },
  actionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[1],
  },
} as const;

export default VenuesList;