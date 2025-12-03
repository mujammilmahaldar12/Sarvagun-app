import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import eventsService from '@/services/events.service';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { KPICard, EmptyState, LoadingState, FilterBar, StatusBadge } from '@/components';
import type { Lead, LeadStatistics } from '@/types/events';
import { formatDate } from '@/utils/formatters';

type LeadStatusTab = 'all' | 'pending' | 'converted' | 'rejected';

export default function LeadsManagementScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<LeadStatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search query to prevent API calls on every keystroke
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch leads with pagination
  const {
    data: leadsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', activeTab, filters, page, pageSize, debouncedSearch],
    queryFn: async () => {
      console.log('🔍 Fetching leads with params:', { activeTab, page, pageSize, search: debouncedSearch });
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await eventsService.getLeads({ 
        status, 
        ...filters,
        search: debouncedSearch || undefined, // Server-side search
        page,
        page_size: pageSize 
      });
      
      console.log('📦 Leads response:', { 
        resultsCount: response.results?.length, 
        totalCount: response.count,
        page,
        currentAllLeadsCount: allLeads.length 
      });
      
      // Accumulate leads when loading more
      if (page === 1) {
        setAllLeads(response.results || []);
      } else {
        setAllLeads(prev => [...prev, ...(response.results || [])]);
      }
      
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['leadStatistics'],
    queryFn: () => eventsService.getLeadStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use server-filtered leads directly (no client-side filtering)
  const filteredLeads = allLeads;

  // Load more function
  const handleLoadMore = async () => {
    if (loadingMore || !leadsResponse?.next) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
    setTimeout(() => setLoadingMore(false), 500);
  };

  // Load all function
  const handleLoadAll = async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await eventsService.getLeads({ 
        status, 
        ...filters, 
        page: 1,
        page_size: 9999 // Load all
      });
      setAllLeads(response.results || []);
      setPage(1);
    } catch (err) {
      console.error('Error loading all leads:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Reset pagination when tab, filters, or search change
  React.useEffect(() => {
    console.log('🔄 Resetting page to 1 due to filter change');
    setPage(1);
  }, [activeTab, filters, debouncedSearch]);

  // Tab configuration
  const tabs: Array<{ key: LeadStatusTab; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }> = [
    { key: 'all', label: 'All', icon: 'list', count: statistics?.total_leads },
    { key: 'pending', label: 'Pending', icon: 'hourglass', count: statistics?.pending_leads },
    { key: 'converted', label: 'Converted', icon: 'checkmark-circle', count: statistics?.converted_leads },
    { key: 'rejected', label: 'Rejected', icon: 'close-circle', count: statistics?.rejected_leads },
  ];

  const handleAddLead = () => {
    router.push('/(modules)/events/add-lead');
  };

  const handleLeadDetails = (leadId: number) => {
    router.push(`/(modules)/events/${leadId}?type=leads` as any);
  };

  const handleConvertLead = (leadId: number) => {
    router.push(`/(modules)/events/convert-lead?leadId=${leadId}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'converted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  const getSourceBadgeColor = (source?: string) => {
    return source === 'online' ? '#3b82f6' : '#8b5cf6';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Lead Management</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Track and convert leads
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddLead}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics KPIs */}
      {statistics && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiContainer}
          contentContainerStyle={styles.kpiContent}
        >
          <KPICard
            title="Total Leads"
            value={statistics.total_leads}
            icon="list"
            color="#6366f1"
          />
          <KPICard
            title="Pending"
            value={statistics.pending_leads}
            icon="hourglass"
            color="#f59e0b"
          />
          <KPICard
            title="Converted"
            value={statistics.converted_leads}
            icon="checkmark-circle"
            color="#10b981"
            trend={{
              value: statistics.conversion_rate,
              direction: 'up',
              label: 'conversion rate',
            }}
          />
          <KPICard
            title="Rejected"
            value={statistics.rejected_leads}
            icon="close-circle"
            color="#ef4444"
          />
        </ScrollView>
      )}

      {/* Status Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  activeTab === tab.key && [styles.tabActive, { borderBottomColor: theme.primary }],
                ]}
              >
                <Ionicons
                  name={tab.icon}
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
                {tab.count !== undefined && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor:
                          activeTab === tab.key ? theme.primary : theme.textSecondary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        { color: activeTab === tab.key ? '#fff' : theme.textSecondary },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filters */}
      <FilterBar
        configs={[
          {
            key: 'source',
            label: 'Source',
            icon: 'apps',
            type: 'select',
            options: [
              { label: 'Online', value: 'online', icon: 'globe', color: '#3b82f6' },
              { label: 'Offline', value: 'offline', icon: 'storefront', color: '#8b5cf6' },
            ],
          },
          {
            key: 'dateRange',
            label: 'Date Range',
            icon: 'calendar-outline',
            type: 'daterange',
          },
        ]}
        activeFilters={filters}
        onFiltersChange={setFilters}
      />

      {/* Leads List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} colors={[theme.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && page === 1 && !allLeads.length ? (
          <LoadingState variant="skeleton" skeletonCount={5} />
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Leads"
            subtitle="Failed to load leads. Please try again."
            action={{
              label: 'Retry',
              icon: 'refresh',
              onPress: () => refetch(),
            }}
          />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title={searchQuery ? 'No Matching Leads' : `No ${activeTab === 'all' ? '' : activeTab} Leads`}
            subtitle={
              searchQuery
                ? 'Try adjusting your search'
                : 'Create a new lead to get started'
            }
            action={
              !searchQuery && activeTab === 'all'
                ? {
                    label: 'Add Lead',
                    icon: 'add-circle',
                    onPress: handleAddLead,
                  }
                : undefined
            }
          />
        ) : (
          <>
            <View style={styles.leadsList}>
            {filteredLeads.map((lead: Lead, index: number) => (
              <Animated.View
                key={lead.id}
                entering={FadeIn.delay(index * 50)}
                style={[styles.leadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Pressable
                  onPress={() => handleLeadDetails(lead.id)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {/* Card Header */}
                  <View style={styles.leadCardHeader}>
                    <View style={styles.leadCardTitleContainer}>
                      <Ionicons name="person-circle" size={24} color={theme.primary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.leadCardTitle, { color: theme.text }]}>
                          {lead.client?.name || 'Unnamed Client'}
                        </Text>
                        <Text style={[styles.leadCardSubtitle, { color: theme.textSecondary }]}>
                          {formatDate(lead.created_at, 'short')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.leadCardBadges}>
                      {lead.source && (
                        <View
                          style={[
                            styles.sourceBadge,
                            { backgroundColor: getSourceBadgeColor(lead.source) + '20' },
                          ]}
                        >
                          <Ionicons
                            name={lead.source === 'online' ? 'globe' : 'storefront'}
                            size={12}
                            color={getSourceBadgeColor(lead.source)}
                          />
                          <Text
                            style={[
                              styles.sourceBadgeText,
                              { color: getSourceBadgeColor(lead.source) },
                            ]}
                          >
                            {lead.source}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(lead.status) + '20' },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(lead.status) }]}>
                          {lead.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.leadCardBody}>
                    {lead.client?.number && (
                      <View style={styles.leadInfoRow}>
                        <Ionicons name="call" size={14} color={theme.textSecondary} />
                        <Text style={[styles.leadInfoText, { color: theme.textSecondary }]}>
                          {lead.client.number}
                        </Text>
                      </View>
                    )}
                    {lead.client?.email && (
                      <View style={styles.leadInfoRow}>
                        <Ionicons name="mail" size={14} color={theme.textSecondary} />
                        <Text style={[styles.leadInfoText, { color: theme.textSecondary }]}>
                          {lead.client.email}
                        </Text>
                      </View>
                    )}
                    {lead.referral && (
                      <View style={styles.leadInfoRow}>
                        <Ionicons name="ribbon" size={14} color={theme.textSecondary} />
                        <Text style={[styles.leadInfoText, { color: theme.textSecondary }]}>
                          Referred by: {lead.referral}
                        </Text>
                      </View>
                    )}
                    {lead.message && (
                      <Text
                        style={[styles.leadMessage, { color: theme.text }]}
                        numberOfLines={2}
                      >
                        {lead.message}
                      </Text>
                    )}
                  </View>

                  {/* Card Actions */}
                  {lead.status === 'pending' && (
                    <View style={styles.leadCardActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                        onPress={() => handleLeadDetails(lead.id)}
                      >
                        <Ionicons name="eye" size={16} color={theme.text} />
                        <Text style={[styles.actionButtonTextSecondary, { color: theme.text }]}>
                          View
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {lead.status === 'converted' && lead.event_id && (
                    <View style={styles.leadCardFooter}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={[styles.leadFooterText, { color: theme.textSecondary }]}>
                        Converted to Event #{lead.event_id}
                      </Text>
                    </View>
                  )}

                  {lead.status === 'rejected' && (
                    <View style={styles.leadCardFooter}>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={[styles.leadFooterText, { color: theme.textSecondary }]}>
                        Rejected
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}

            {/* Debug Info */}
            {__DEV__ && (
              <View style={{ padding: 16, backgroundColor: '#f0f0f0', margin: 16 }}>
                <Text>🔍 Debug Info:</Text>
                <Text>isLoading: {isLoading ? 'true' : 'false'}</Text>
                <Text>allLeads.length: {allLeads.length}</Text>
                <Text>filteredLeads.length: {filteredLeads.length}</Text>
                <Text>leadsResponse?.count: {leadsResponse?.count || 'N/A'}</Text>
                <Text>leadsResponse?.next: {leadsResponse?.next ? 'YES' : 'NO'}</Text>
                <Text>page: {page}</Text>
              </View>
            )}
          </View>
          </>
        )}

        {/* Pagination Controls - Always show when we have leads */}
        {filteredLeads.length > 0 && (
          <View style={[styles.paginationContainer, { marginHorizontal: 16, backgroundColor: theme.surface, padding: 16, borderRadius: 12 }]}>
            <Text style={[styles.paginationInfo, { color: theme.textSecondary, marginBottom: 12 }]}>
              Showing {allLeads.length} of {leadsResponse?.count || allLeads.length} leads
            </Text>

            <View style={styles.paginationButtons}>
              {leadsResponse?.next && !loadingMore && (
                <TouchableOpacity
                  style={[styles.paginationButton, { backgroundColor: theme.primary }]}
                  onPress={handleLoadMore}
                >
                  <Ionicons name="arrow-down" size={16} color="#fff" />
                  <Text style={styles.paginationButtonText}>Load More 50</Text>
                </TouchableOpacity>
              )}

              {leadsResponse && allLeads.length < (leadsResponse?.count || 0) && !loadingMore && (
                <TouchableOpacity
                  style={[styles.paginationButton, styles.paginationButtonSecondary, { borderColor: theme.primary }]}
                  onPress={handleLoadAll}
                >
                  <Ionicons name="download" size={16} color={theme.primary} />
                  <Text style={[styles.paginationButtonTextSecondary, { color: theme.primary }]}>
                    Load All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>
                  Loading more leads...
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContainer: {
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kpiContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
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
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  leadsList: {
    padding: 16,
    gap: 12,
  },
  leadCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  leadCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leadCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  leadCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  leadCardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  leadCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  leadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadInfoText: {
    fontSize: 13,
  },
  leadMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  leadCardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  leadCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leadFooterText: {
    fontSize: 13,
  },
  paginationContainer: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  paginationButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
});
