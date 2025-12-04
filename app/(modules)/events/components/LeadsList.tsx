/**
 * LeadsList Component
 * Professional leads list with filtering and actions
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Table, type TableColumn, Badge, Button, LoadingState, FAB } from '@/components';
import ActionButton from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useLeads } from '@/store/eventsStore';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/store/permissionStore';
import { designSystem } from '@/constants/designSystem';
import type { Lead } from '@/types/events';

interface LeadsListProps {
  searchQuery?: string;
  selectedStatus?: string;
  refreshing?: boolean;
  headerComponent?: React.ReactNode;
}

interface LeadRowData {
  id: number;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: string;
  source?: string;
  assignedTo: string;
  createdDate: string;
  createdBy: string | number;
}

const LeadsList: React.FC<LeadsListProps> = ({
  searchQuery = '',
  selectedStatus = 'all',
  refreshing = false,
  headerComponent,
}) => {
  const { theme, spacing } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    leads,
    loading,
    error,
    statistics,
    convert: convertLead,
    reject: rejectLead,
    delete: deleteLead,
    setFilter,
  } = useLeads();

  // DEBUG: Force component to show data state
  React.useEffect(() => {
    console.log('🔥 LeadsList MOUNTED/UPDATED:', {
      timestamp: new Date().toISOString(),
      leadsCount: leads?.length || 0,
      loading,
      error,
      isArray: Array.isArray(leads),
      firstLead: leads?.[0]
    });
  }, [leads, loading, error]);

  // Permission checks using professional permission system
  const { canManageLeads, canConvertLeads, canCreateLeads } = usePermissions();

  // Legacy permission mapping for transition
  const canManage = canManageLeads;
  const canApprove = canConvertLeads; // Use convert permission for lead conversion

  // Process and filter leads data
  const processedLeads: LeadRowData[] = useMemo(() => {
    console.log('📊 Leads Debug:', {
      isArray: Array.isArray(leads),
      total: Array.isArray(leads) ? leads.length : 0,
      firstLead: Array.isArray(leads) && leads.length > 0 ? leads[0] : null,
      selectedStatus,
      searchQuery,
      canManage,
      userId: user?.id
    });

    if (!Array.isArray(leads)) {
      console.log('⚠️ Leads is not an array:', typeof leads, leads);
      return [];
    }

    let filtered = leads.filter(lead => lead && lead.id);

    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === selectedStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead =>
        lead.client?.name?.toLowerCase().includes(query) ||
        lead.client?.email?.toLowerCase().includes(query) ||
        lead.client?.leadperson?.toLowerCase().includes(query) ||
        lead.source?.toLowerCase().includes(query) ||
        lead.message?.toLowerCase().includes(query)
      );
    }

    // All users can view all leads
    console.log(`✅ All leads visible to user ${user?.id} (category: ${user?.category}). Total: ${filtered.length}`);

    // Transform to table format
    return filtered.map(lead => ({
      id: lead.id,
      clientName: lead.client?.name || 'N/A',
      contactPerson: lead.client?.leadperson || lead.client?.number || 'N/A',
      phone: lead.client?.number || 'N/A',
      email: lead.client?.email || 'N/A',
      status: lead.status || 'pending',
      source: lead.source,
      assignedTo: lead.user_name || 'Unassigned',
      createdDate: lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : 'N/A',
      createdBy: lead.user_name || 'N/A',
    }));
  }, [leads, selectedStatus, searchQuery, canManageLeads, user?.id]);

  // Handle lead actions
  const handleLeadDetails = (leadId: number) => {
    router.push(`/(modules)/events/${leadId}?type=leads` as any);
  };

  // Table configuration
  const columns = [
    {
      key: 'clientName',
      title: 'Client Name',
      width: 140,
      sortable: true,
      render: (value: string, row: LeadRowData) => (
        <View>
          <Text
            style={[styles.cellTextPrimary, { color: theme.text, fontWeight: '500', marginBottom: 2 }]}
            numberOfLines={1}
          >
            {value}
          </Text>
          {row.contactPerson !== 'N/A' && row.contactPerson !== value && (
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
      render: (value: string, row: LeadRowData) => (
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
      key: 'source',
      title: 'Source',
      width: 80,
      sortable: true,
      render: (value: string | undefined) => (
        <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
          {value || 'N/A'}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      sortable: true,
      render: (value: string) => (
        <Badge
          label={value}
          status={value as any}
          size="sm"
        />
      ),
    },
    {
      key: 'assignedTo',
      title: 'Assigned To',
      width: 100,
      sortable: true,
      render: (value: string) => (
        <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ),
    },
    {
      key: 'createdDate',
      title: 'Created',
      width: 90,
      sortable: true,
      render: (value: string) => (
        <Text style={[styles.cellTextSecondary, {
          color: theme.textSecondary,
          fontSize: designSystem.typography.sizes.xs
        }]}>
          {value}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 80, // Reduced width since only one action
      render: (value: any, row: LeadRowData) => (
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="eye-outline"
            title="View"
            onPress={() => handleLeadDetails(row.id)}
            variant="secondary"
            size="small"
            accessibilityLabel={`View lead for ${row.clientName}`}
            style={{ minWidth: 60 }}
          />
        </View>
      ),
    },
  ];

  // Loading state
  if (loading && !refreshing) {
    return <LoadingState message="Loading leads..." variant="skeleton" skeletonCount={6} />;
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Leads"
          description={error}
          actionTitle="Try Again"
          onActionPress={() => setFilter({})} // Trigger refetch
        />
      </View>
    );
  }

  // Empty state
  if (processedLeads.length === 0 && !loading) {
    const isFiltered = selectedStatus !== 'all' || searchQuery.trim() !== '';

    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="person-add-outline"
          title={isFiltered ? 'No Leads Found' : 'No Leads Yet'}
          description={
            isFiltered
              ? 'Try adjusting your filters to see more results'
              : 'Add your first lead to get started'
          }
          actionTitle={canCreateLeads ? 'Add Lead' : undefined}
          onActionPress={canCreateLeads ? () => router.push('/(modules)/events/add-lead' as any) : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Leads Table */}
      <Table
        data={processedLeads}
        columns={columns}
        keyExtractor={(item) => `lead-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No leads found"
        searchable={true}
        searchPlaceholder="Search leads..."
        exportable={user?.category === 'admin' || user?.category === 'hr'}
        paginated={true}
        pageSize={20}
        ListHeaderComponent={headerComponent}
      />

      {/* Add Lead FAB Button - positioned at bottom-left 30px from bottom, 20px from left */}
      {canCreateLeads && (
        <FAB
          icon="add"
          label="Add Lead"
          variant="extended"
          position="bottom-left"
          onPress={() => router.push('/(modules)/events/add-lead' as any)}
        />
      )}
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
    gap: designSystem.spacing[2],
    flexWrap: 'wrap' as const,
    flexWrap: 'wrap' as const,
  },
} as const;

export default LeadsList;