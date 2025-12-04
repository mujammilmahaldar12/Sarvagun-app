/**
 * ClientsList Component
 * Professional clients list with filtering and actions
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo } from 'react';
import { View, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Table, type TableColumn, Badge, Button } from '@/components';
import ActionButton from '@/components/ui/ActionButton';
import { EmptyState, LoadingState } from '@/components';
import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/hooks/useTheme';
import { useClients } from '@/store/eventsStore';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/store/permissionStore';
import { designSystem } from '@/constants/designSystem';
import type { Client } from '@/types/events';

interface ClientsListProps {
  searchQuery?: string;
  selectedCategory?: number;
  refreshing?: boolean;
  headerComponent?: React.ReactNode;
}

interface ClientRowData {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  organisations: string[];
  bookingsCount: number;
  isActive: boolean;
}

const ClientsList: React.FC<ClientsListProps> = ({
  searchQuery = '',
  selectedCategory,
  refreshing = false,
  headerComponent,
}) => {
  const { theme, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    clients,
    categories,
    loading,
    error,
    update: updateClient,
    delete: deleteClient,
    setFilter,
  } = useClients();

  // Permission checks using professional permission system
  const { canManageClients, canEditClients, canCreateClients } = usePermissions();

  // Legacy permission mapping for transition
  const canManage = canManageClients;
  const canEdit = canEditClients;

  // Process and filter clients data
  const processedClients: ClientRowData[] = useMemo(() => {
    if (!Array.isArray(clients)) {
      return [];
    }

    let filtered = clients.filter(client => client && client.id);

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(client =>
        client.category?.some(cat => cat.id === selectedCategory)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.leadperson?.toLowerCase().includes(query) ||
        client.number?.toLowerCase().includes(query) ||
        client.category?.some(cat => cat.name?.toLowerCase().includes(query))
      );
    }

    // Transform to table format
    return filtered.map(client => ({
      id: client.id,
      name: client.name || 'N/A',
      contactPerson: client.leadperson || 'N/A',
      email: client.email || 'N/A',
      phone: client.number || 'N/A',
      categories: client.category?.map(cat => cat.name).filter(Boolean) || [],
      organisations: client.organisation?.map(org => org.name).filter(Boolean) || [],
      bookingsCount: client.bookings_count || 0,
      isActive: client.is_active ?? true,
    }));
  }, [clients, selectedCategory, searchQuery]);

  // Handle client actions
  const handleClientDetails = (clientId: number) => {
    router.push(`/(modules)/events/${clientId}?type=clients` as any);
  };

  const handleEditClient = (clientId: number) => {
    router.push(`/(modules)/events/add-client?clientId=${clientId}` as any);
  };

  const handleDeleteClient = async (clientId: number) => {
    Alert.alert(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(clientId);
              Alert.alert('Success', 'Client deleted successfully');
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete client'
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleActiveStatus = async (clientId: number, isActive: boolean) => {
    try {
      await updateClient(clientId, { is_active: !isActive });
      Alert.alert(
        'Success',
        `Client ${!isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error updating client status:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update client status'
      );
    }
  };

  // Table configuration
  const columns = [
    {
      key: 'name',
      title: 'Client Name',
      width: 150,
      sortable: true,
      render: (value: string, row: ClientRowData) => (
        <View>
          <Text style={[styles.cellTextPrimary, {
            color: row.isActive ? theme.text : theme.textSecondary,
            opacity: row.isActive ? 1 : 0.6
          }]} numberOfLines={1}>
            {value}
          </Text>
          {row.contactPerson !== 'N/A' && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
              {row.contactPerson}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'email',
      title: 'Contact',
      width: 130,
      sortable: true,
      render: (value: string, row: ClientRowData) => (
        <View>
          <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
            {value}
          </Text>
          {row.phone !== 'N/A' && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
              {row.phone}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'categories',
      title: 'Categories',
      width: 120,
      render: (value: string[], row: ClientRowData) => (
        <View style={styles.chipsContainer}>
          {value.length > 0 ? (
            value.slice(0, 2).map((category, index) => (
              <Chip
                key={`${row.id}-category-${index}-${category}`}
                label={category}
                size="sm"
                variant="secondary"
              />
            ))
          ) : (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
              No category
            </Text>
          )}
          {value.length > 2 && (
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
              +{value.length - 2} more
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'organisations',
      title: 'Organisation',
      width: 120,
      render: (value: string[]) => (
        <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
          {value.length > 0 ? value[0] : 'Independent'}
        </Text>
      ),
    },
    {
      key: 'bookingsCount',
      title: 'Bookings',
      width: 80,
      render: (value: number) => (
        <Text style={[styles.cellTextSecondary, {
          color: value > 0 ? designSystem.baseColors.success[600] : theme.textSecondary,
          fontWeight: value > 0 ? designSystem.typography.weights.medium : designSystem.typography.weights.regular
        }]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      width: 80,
      render: (value: boolean) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          variant={value ? 'filled' : 'outlined'}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      render: (value: any, row: ClientRowData) => (
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="eye-outline"
            title="View"
            onPress={() => handleClientDetails(row.id)}
            variant="secondary"
            size="small"
          />

          {canEditClients && (
            <>
              <ActionButton
                icon="create-outline"
                title="Edit"
                onPress={() => handleEditClient(row.id)}
                variant="secondary"
                size="small"
              />

              <ActionButton
                icon={row.isActive ? "pause-outline" : "play-outline"}
                title={row.isActive ? "Deactivate" : "Activate"}
                onPress={() => handleToggleActiveStatus(row.id, row.isActive)}
                variant="secondary"
                size="small"
              />
            </>
          )}

          {canManageClients && (
            <ActionButton
              icon="trash-outline"
              title="Delete"
              onPress={() => handleDeleteClient(row.id)}
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
    return <LoadingState message="Loading clients..." variant="skeleton" skeletonCount={6} />;
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Clients"
          description={error}
          actionTitle="Try Again"
          onActionPress={() => setFilter({})} // Trigger refetch
        />
      </View>
    );
  }

  // Empty state
  if (processedClients.length === 0 && !loading) {
    const isFiltered = selectedCategory || searchQuery.trim() !== '';

    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="people-outline"
          title={isFiltered ? 'No Clients Found' : 'No Clients Yet'}
          description={
            isFiltered
              ? 'Try adjusting your filters to see more results'
              : 'Add your first client to get started'
          }
          actionTitle={!isFiltered ? 'Add Client' : undefined}
          onActionPress={!isFiltered ? () => router.push('/(modules)/events/add-client' as any) : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Clients Table */}
      <Table
        data={processedClients}
        columns={columns}
        keyExtractor={(item) => `client-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No clients found"
        searchable={true}
        searchPlaceholder="Search clients..."
        exportable={user?.category === 'admin' || user?.category === 'hr'}
        paginated={true}
        pageSize={20}
        ListHeaderComponent={headerComponent}
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
  chipsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: designSystem.spacing[1],
    alignItems: 'center' as const,
  },
  actionsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[1],
    flexWrap: 'wrap' as const,
  },
} as const;

export default ClientsList;