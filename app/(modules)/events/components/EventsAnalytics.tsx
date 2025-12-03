/**
 * EventsAnalytics Component
 * Professional analytics dashboard for events management
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import KPICard from '@/components/ui/KPICard';
import { LoadingState } from '@/components';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import EventStatusPieChart from '@/components/charts/EventStatusPieChart';
import ClientSegmentChart from '@/components/charts/ClientSegmentChart';
import { Button } from '@/components/core';
import { DateRangePicker } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { useEventsStore } from '@/store/eventsStore';
import { designSystem } from '@/constants/designSystem';
import type { Lead, Client } from '@/types/events';

interface EventsAnalyticsProps {
  refreshing?: boolean;
}

interface AnalyticsData {
  totalLeads: number;
  pendingLeads: number;
  convertedLeads: number;
  rejectedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  activeEvents: number;
  completedEvents: number;
  plannedEvents: number;
  cancelledEvents: number;
  totalClients: number;
  b2bClients: number;
  b2cClients: number;
  b2gClients: number;
  onlineLeads: number;
  offlineLeads: number;
}

const EventsAnalytics: React.FC<EventsAnalyticsProps> = ({ 
  refreshing = false 
}) => {
  const { theme, spacing } = useTheme();
  const store = useEventsStore();
  
  const { 
    leads, 
    events, 
    clients,
    loading 
  } = store;

  // Debug logging
  React.useEffect(() => {
    console.log('📊 Analytics Data:', {
      leadsCount: leads.length,
      eventsCount: events.length,
      clientsCount: clients.length,
      loading,
    });
  }, [leads, events, clients, loading]);

  // Filter state
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filter data by date range
  const filteredLeads = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return leads;
    return leads.filter((lead) => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= dateRange.startDate! && leadDate <= dateRange.endDate!;
    });
  }, [leads, dateRange]);

  const filteredEvents = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return events;
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return eventDate >= dateRange.startDate! && eventDate <= dateRange.endDate!;
    });
  }, [events, dateRange]);

  // Calculate comprehensive analytics
  const analyticsData: AnalyticsData = useMemo(() => {
    // Leads Analytics
    const totalLeads = filteredLeads.length;
    const pendingLeads = filteredLeads.filter((l) => l.status === 'pending').length;
    const convertedLeads = filteredLeads.filter((l) => l.status === 'converted').length;
    const rejectedLeads = filteredLeads.filter((l) => l.status === 'rejected').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    // Source Analytics
    const onlineLeads = filteredLeads.filter((l) => l.source === 'online').length;
    const offlineLeads = filteredLeads.filter((l) => l.source === 'offline').length;

    // Events Analytics
    const totalRevenue = 0; // Budget not available in AppEvent type
    const activeEvents = filteredEvents.filter((e) => e.status === 'ongoing').length;
    const completedEvents = filteredEvents.filter((e) => e.status === 'completed').length;
    const plannedEvents = filteredEvents.filter((e) => e.status === 'scheduled').length;
    const cancelledEvents = filteredEvents.filter((e) => e.status === 'cancelled').length;

    // Client Analytics
    const totalClients = clients.length;
    const b2bClients = clients.filter((c) =>
      (c as any).category?.some((cat: any) => cat.name?.toLowerCase().includes('b2b'))
    ).length;
    const b2cClients = clients.filter((c) =>
      (c as any).category?.some((cat: any) => cat.name?.toLowerCase().includes('b2c'))
    ).length;
    const b2gClients = clients.filter((c) =>
      (c as any).category?.some((cat: any) => cat.name?.toLowerCase().includes('b2g'))
    ).length;

    return {
      totalLeads,
      pendingLeads,
      convertedLeads,
      rejectedLeads,
      conversionRate,
      totalRevenue,
      activeEvents,
      completedEvents,
      plannedEvents,
      cancelledEvents,
      totalClients,
      b2bClients,
      b2cClients,
      b2gClients,
      onlineLeads,
      offlineLeads,
    };
  }, [filteredLeads, filteredEvents, clients]);

  // Export analytics data
  const handleExport = async () => {
    setExporting(true);
    try {
      // Simulate export - in real app, would generate CSV/PDF
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const exportData = {
        dateRange: dateRange.startDate && dateRange.endDate 
          ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
          : 'All Time',
        ...analyticsData,
        exportedAt: new Date().toISOString(),
      };
      
      console.log('Exporting analytics:', exportData);
      Alert.alert('Success', 'Analytics exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export analytics');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setDateRange({});
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading.leads || loading.events || loading.clients) {
    return <LoadingState message="Loading analytics..." variant="skeleton" skeletonCount={8} />;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Filters and Export Section */}
      <View style={styles.headerSection}>
        {/* Header with Export Button */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>
              Analytics Overview
            </Text>
            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              {dateRange.startDate && dateRange.endDate 
                ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
                : 'All Time Data'}
            </Text>
          </View>
          <Button
            title="Export"
            leftIcon="download-outline"
            variant="outline"
            size="sm"
            onPress={handleExport}
            loading={exporting}
          />
        </View>

        {/* Filter Toggle */}
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggle, {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            marginBottom: showFilters ? spacing[3] : 0,
          }]}
        >
          <View style={styles.filterToggleLeft}>
            <View style={[styles.filterIconCircle, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons name="filter" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.filterToggleText, { color: theme.text }]}>
              Filters
            </Text>
            {(dateRange.startDate || dateRange.endDate) && (
              <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={showFilters ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.textSecondary} 
          />
        </Pressable>

        {/* Filter Options */}
        {showFilters && (
          <View style={[styles.filterContent, {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }]}>
            <DateRangePicker
              label="Date Range"
              value={dateRange}
              onChange={setDateRange}
              placeholder="Select date range"
            />

            {(dateRange.startDate || dateRange.endDate) && (
              <Button
                title="Clear Filters"
                variant="ghost"
                size="sm"
                onPress={clearFilters}
                leftIcon="close-circle-outline"
                style={{ marginTop: spacing[3] }}
              />
            )}
          </View>
        )}
      </View>

      {/* Lead Analytics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: `${designSystem.baseColors.info[500]}15` }]}>
            <Ionicons name="people" size={20} color={designSystem.baseColors.info[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Lead Performance
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Track lead acquisition and conversion
            </Text>
          </View>
        </View>
        
        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Leads"
            value={analyticsData.totalLeads.toString()}
            subtitle={`${analyticsData.pendingLeads} pending`}
            trend={analyticsData.totalLeads > 0 ? 'up' : 'neutral'}
            icon="people-outline"
            gradientColors={[theme.primary, designSystem.baseColors.purple[600]]}
          />
          
          <KPICard
            title="Conversion Rate"
            value={formatPercentage(analyticsData.conversionRate)}
            subtitle={`${analyticsData.convertedLeads} converted`}
            trend={analyticsData.conversionRate > 50 ? 'up' : analyticsData.conversionRate > 25 ? 'neutral' : 'down'}
            icon="trending-up"
            gradientColors={[designSystem.baseColors.success[500], designSystem.baseColors.success[600]]}
          />
          
          <KPICard
            title="Online Sources"
            value={analyticsData.onlineLeads.toString()}
            subtitle={`${analyticsData.offlineLeads} offline`}
            trend={analyticsData.onlineLeads > analyticsData.offlineLeads ? 'up' : 'neutral'}
            icon="globe-outline"
            gradientColors={[designSystem.baseColors.info[500], designSystem.baseColors.info[600]]}
          />
        </View>

        {/* Conversion Funnel Chart */}
        <View style={styles.chartWrapper}>
          <ConversionFunnelChart
            data={{
              total: analyticsData.totalLeads,
              pending: analyticsData.pendingLeads,
              converted: analyticsData.convertedLeads,
            }}
          />
        </View>
      </View>

      {/* Events Analytics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: `${designSystem.baseColors.warning[500]}15` }]}>
            <Ionicons name="calendar" size={20} color={designSystem.baseColors.warning[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Event Portfolio
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Monitor event status and revenue
            </Text>
          </View>
        </View>
        
        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Revenue"
            value={formatCurrency(analyticsData.totalRevenue)}
            subtitle={`${events.length} events`}
            trend={analyticsData.totalRevenue > 0 ? 'up' : 'neutral'}
            icon="cash-outline"
            gradientColors={[designSystem.baseColors.success[500], designSystem.baseColors.success[600]]}
          />
          
          <KPICard
            title="Active Events"
            value={analyticsData.activeEvents.toString()}
            subtitle={`${analyticsData.plannedEvents} planned`}
            trend={analyticsData.activeEvents > 0 ? 'up' : 'neutral'}
            icon="calendar-outline"
            gradientColors={[designSystem.baseColors.warning[500], designSystem.baseColors.warning[600]]}
          />
          
          <KPICard
            title="Completed"
            value={analyticsData.completedEvents.toString()}
            subtitle={`${analyticsData.cancelledEvents} cancelled`}
            trend={analyticsData.completedEvents > analyticsData.cancelledEvents ? 'up' : 'neutral'}
            icon="checkmark-circle-outline"
            gradientColors={[theme.primary, designSystem.baseColors.purple[600]]}
          />
        </View>

        {/* Event Status Chart */}
        <View style={styles.chartWrapper}>
          <EventStatusPieChart
            data={[
              { status: 'Scheduled', count: analyticsData.plannedEvents, color: designSystem.baseColors.info[500] },
              { status: 'Ongoing', count: analyticsData.activeEvents, color: designSystem.baseColors.warning[500] },
              { status: 'Completed', count: analyticsData.completedEvents, color: designSystem.baseColors.success[500] },
              { status: 'Cancelled', count: analyticsData.cancelledEvents, color: designSystem.baseColors.error[500] },
            ]}
          />
        </View>
      </View>

      {/* Client Analytics Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconCircle, { backgroundColor: `${designSystem.baseColors.purple[500]}15` }]}>
            <Ionicons name="briefcase" size={20} color={designSystem.baseColors.purple[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Client Portfolio
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Analyze client segments and distribution
            </Text>
          </View>
        </View>
        
        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Clients"
            value={analyticsData.totalClients.toString()}
            subtitle="Active clients"
            trend={analyticsData.totalClients > 0 ? 'up' : 'neutral'}
            icon="briefcase-outline"
            gradientColors={[theme.primary, designSystem.baseColors.purple[600]]}
          />
          
          <KPICard
            title="B2B Segment"
            value={analyticsData.b2bClients.toString()}
            subtitle={`${formatPercentage((analyticsData.b2bClients / Math.max(analyticsData.totalClients, 1)) * 100)} of total`}
            trend={analyticsData.b2bClients > analyticsData.b2cClients ? 'up' : 'neutral'}
            icon="business-outline"
            gradientColors={[designSystem.baseColors.purple[500], designSystem.baseColors.purple[600]]}
          />
          
          <KPICard
            title="B2C Segment"
            value={analyticsData.b2cClients.toString()}
            subtitle={`${formatPercentage((analyticsData.b2cClients / Math.max(analyticsData.totalClients, 1)) * 100)} of total`}
            trend={analyticsData.b2cClients > 0 ? 'up' : 'neutral'}
            icon="person-outline"
            gradientColors={[designSystem.baseColors.info[500], designSystem.baseColors.info[600]]}
          />
        </View>

        {/* Client Segment Chart */}
        <View style={styles.chartWrapper}>
          <ClientSegmentChart
            data={[
              { category: 'B2B', count: analyticsData.b2bClients, icon: 'business-outline' },
              { category: 'B2C', count: analyticsData.b2cClients, icon: 'person-outline' },
              { category: 'B2G', count: analyticsData.b2gClients, icon: 'briefcase-outline' },
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: designSystem.spacing[4],
    paddingBottom: designSystem.spacing[8],
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: designSystem.typography.sizes.base,
  },
  headerSection: {
    marginTop: designSystem.spacing[5],
    marginBottom: designSystem.spacing[5],
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: designSystem.spacing[4],
  },
  pageTitle: {
    fontSize: designSystem.typography.sizes['3xl'],
    fontWeight: designSystem.typography.weights.bold as any,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: designSystem.typography.sizes.sm,
    marginTop: designSystem.spacing[1],
  },
  filterToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: designSystem.spacing[3],
    borderRadius: designSystem.borderRadius.lg,
    borderWidth: 1,
  },
  filterToggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[2],
  },
  filterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '600' as any,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as any,
  },
  filterContent: {
    padding: designSystem.spacing[4],
    borderRadius: designSystem.borderRadius.lg,
    borderWidth: 1,
  },
  section: {
    marginBottom: designSystem.spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[3],
    marginBottom: designSystem.spacing[4],
  },
  sectionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sectionTitle: {
    fontSize: designSystem.typography.sizes.xl,
    fontWeight: designSystem.typography.weights.bold as any,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: designSystem.typography.sizes.sm,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: designSystem.spacing[3],
    marginHorizontal: -2,
  },
  chartWrapper: {
    marginTop: designSystem.spacing[4],
  },
} as const;

export default EventsAnalytics;