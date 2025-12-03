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

  const handleConvertLead = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    Alert.alert(
      'Convert Lead to Event',
      `Convert "${lead.client?.name || 'this lead'}" to an event?\n\nYou'll be able to review and edit all details before finalizing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => router.push(`/(modules)/events/convert-lead?leadId=${leadId}` as any),
          style: 'default'
        }
      ]
    );
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
      width: 200,
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
          
          {row.status === 'pending' && (
            <>
              <ActionButton
                icon="checkmark-circle-outline"
                title={canApprove ? "Convert" : "Convert"}
                onPress={canApprove ? () => handleConvertLead(row.id) : undefined}
                variant={canApprove ? "success" : "secondary"}
                size="small"
                disabled={!canApprove}
                accessibilityLabel={canApprove ? `Convert lead for ${row.clientName}` : 'Conversion requires admin access'}
                style={{ 
                  opacity: canApprove ? 1 : 0.5,
                  minWidth: 70,
                  marginLeft: 4,
                }}
              />
              
              {canApprove && (
                <ActionButton
                  icon="close-circle-outline"
                  title="Reject"
                  onPress={() => handleRejectLead(row.id)}
                  variant="warning"
                  size="small"
                  accessibilityLabel={`Reject lead for ${row.clientName}`}
                  style={{ marginLeft: 4 }}
                />
              )}
            </>
          )}
          
          {row.status === 'converted' && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.success + '20', borderRadius: 6 }}>
              <Text style={{ color: theme.success, fontSize: 10, fontWeight: '600' }}>Converted</Text>
            </View>
          )}
          
          {row.status === 'rejected' && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.error + '20', borderRadius: 6 }}>
              <Text style={{ color: theme.error, fontSize: 10, fontWeight: '600' }}>Rejected</Text>
            </View>
          )}
          
          {canManageLeads && (
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
        pageSize={100}
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