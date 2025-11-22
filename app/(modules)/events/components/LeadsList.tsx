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
import AppTable from '@/components/ui/AppTable';
import StatusBadge from '@/components/ui/StatusBadge';
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

  // Permission checks using professional permission system
  const { canManageLeads, canConvertLeads, canCreateLeads } = usePermissions();

  // Legacy permission mapping for transition
  const canManage = canManageLeads;
  const canApprove = canManageLeads; // Approve permission is same as manage for leads

  // Process and filter leads data
  const processedLeads: LeadRowData[] = useMemo(() => {
    if (!Array.isArray(leads)) {
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

    // Filter by user permissions (only show user's own leads unless admin/hr)
    if (!canManage && user?.id) {
      filtered = filtered.filter(lead => lead.user === user.id);
    }

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
      createdBy: lead.user || 'N/A',
    }));
  }, [leads, selectedStatus, searchQuery, canManageLeads, user?.id]);

  // Handle lead actions
  const handleLeadDetails = (leadId: number) => {
    router.push(`/events/${leadId}`);
  };

  const handleConvertLead = (leadId: number) => {
    router.push(`/events/convert-lead?leadId=${leadId}`);
  };

  const handleRejectLead = async (leadId: number) => {
    Alert.prompt(
      'Reject Lead',
      'Please provide a reason for rejecting this lead (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              await rejectLead(leadId, reason || '');
              Alert.alert('Success', 'Lead rejected successfully');
            } catch (error) {
              console.error('Error rejecting lead:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to reject lead'
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDeleteLead = async (leadId: number) => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLead(leadId);
              Alert.alert('Success', 'Lead deleted successfully');
            } catch (error) {
              console.error('Error deleting lead:', error);
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete lead'
              );
            }
          },
        },
      ]
    );
  };

  // Table configuration
  const columns = [
    { 
      key: 'clientName', 
      title: 'Client Name', 
      width: 140,
      render: (value: string, row: LeadRowData) => (
        <View>
          <Text style={[styles.cellTextPrimary, { color: theme.text }]} numberOfLines={1}>
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
      render: (value: string) => (
        <StatusBadge
          status={value}
        />
      ),
    },
    { 
      key: 'assignedTo', 
      title: 'Assigned To', 
      width: 100,
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
      width: 140,
      render: (value: any, row: LeadRowData) => (
        <View style={styles.actionsContainer}>
          <ActionButton
            icon="eye-outline"
            title="View"
            onPress={() => handleLeadDetails(row.id)}
            variant="secondary"
            size="small"
            accessibilityLabel={`View lead for ${row.clientName}`}
          />
          
          {canApprove && row.status === 'pending' && (
            <>
              <ActionButton
                icon="checkmark-circle-outline"
                title="Convert"
                onPress={() => handleConvertLead(row.id)}
                variant="success"
                size="small"
                accessibilityLabel={`Convert lead for ${row.clientName}`}
              />
              
              <ActionButton
                icon="close-circle-outline"
                title="Reject"
                onPress={() => handleRejectLead(row.id)}
                variant="warning"
                size="small"
                accessibilityLabel={`Reject lead for ${row.clientName}`}
              />
            </>
          )}
          
          {canConvertLeads && (
            <ActionButton
              icon="trash-outline"
              title="Delete"
              onPress={() => handleDeleteLead(row.id)}
              variant="danger"
              size="small"
              accessibilityLabel={`Delete lead for ${row.clientName}`}
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
          Loading leads...
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
          onActionPress={canCreateLeads ? () => router.push('/events/add-lead') : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Statistics Summary */}
      {statistics && (
        <View style={[styles.summary, { 
          backgroundColor: theme.surface, 
          borderColor: theme.border,
          marginHorizontal: spacing[4],
          marginBottom: spacing[4],
        }]}>
          <Text style={[styles.summaryText, { color: theme.text }]}>
            {processedLeads.length} leads
            {statistics.conversion_rate > 0 && ` • ${statistics.conversion_rate.toFixed(1)}% conversion rate`}
            {selectedStatus !== 'all' && ` • ${selectedStatus} status`}
            {searchQuery && ` • filtered`}
          </Text>
        </View>
      )}

      {/* Leads Table */}
      <AppTable
        data={processedLeads}
        columns={columns}
        keyExtractor={(item) => `lead-${item.id}`}
        loading={loading || refreshing}
        emptyMessage="No leads found"
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
    flexWrap: 'wrap' as const,
  },
} as const;

export default LeadsList;