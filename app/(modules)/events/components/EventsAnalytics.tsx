/**
 * EventsAnalytics Component
 * Professional analytics dashboard for events management
 * Extracted from monolithic events/index.tsx
 */
import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import KPICard from '@/components/ui/KPICard';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import EventStatusPieChart from '@/components/charts/EventStatusPieChart';
import ClientSegmentChart from '@/components/charts/ClientSegmentChart';
import { useTheme } from '@/hooks/useTheme';
import { useEventsStore } from '@/store/eventsStore';
import { designSystem } from '@/constants/designSystem';
import type { Lead, Event, Client } from '@/types/events';

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

  // Calculate comprehensive analytics
  const analyticsData: AnalyticsData = useMemo(() => {
    // Leads Analytics
    const totalLeads = leads.length;
    const pendingLeads = leads.filter((l) => l.status === 'pending').length;
    const convertedLeads = leads.filter((l) => l.status === 'converted').length;
    const rejectedLeads = leads.filter((l) => l.status === 'rejected').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    // Source Analytics
    const onlineLeads = leads.filter((l) => l.source === 'online').length;
    const offlineLeads = leads.filter((l) => l.source === 'offline').length;

    // Events Analytics
    const totalRevenue = events.reduce((sum, e) => sum + (e.total_budget || 0), 0);
    const activeEvents = events.filter((e) => e.status === 'in-progress').length;
    const completedEvents = events.filter((e) => e.status === 'completed').length;
    const plannedEvents = events.filter((e) => e.status === 'planned').length;
    const cancelledEvents = events.filter((e) => e.status === 'cancelled').length;

    // Client Analytics
    const totalClients = clients.length;
    const b2bClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2b'))
    ).length;
    const b2cClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2c'))
    ).length;
    const b2gClients = clients.filter((c) =>
      c.category?.some((cat) => cat.name?.toLowerCase().includes('b2g'))
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
  }, [leads, events, clients]);

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
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: spacing[2] }]}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: spacing[4] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Lead Analytics Section */}
      <View style={[styles.section, { marginBottom: spacing[6] }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text, 
          marginBottom: spacing[4],
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.semibold
        }]}>
          Lead Performance
        </Text>
        
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
        <View style={[styles.chartContainer, { marginTop: spacing[4] }]}>
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
      <View style={[styles.section, { marginBottom: spacing[6] }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text,
          marginBottom: spacing[4],
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.semibold
        }]}>
          Event Portfolio
        </Text>
        
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
        <View style={[styles.chartContainer, { marginTop: spacing[4] }]}>
          <EventStatusPieChart
            data={[
              { status: 'Planned', count: analyticsData.plannedEvents, color: designSystem.baseColors.info[500] },
              { status: 'In Progress', count: analyticsData.activeEvents, color: designSystem.baseColors.warning[500] },
              { status: 'Completed', count: analyticsData.completedEvents, color: designSystem.baseColors.success[500] },
              { status: 'Cancelled', count: analyticsData.cancelledEvents, color: designSystem.baseColors.error[500] },
            ]}
          />
        </View>
      </View>

      {/* Client Analytics Section */}
      <View style={[styles.section, { marginBottom: spacing[8] }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text,
          marginBottom: spacing[4],
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.semibold
        }]}>
          Client Portfolio
        </Text>
        
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
        <View style={[styles.chartContainer, { marginTop: spacing[4] }]}>
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
  section: {
    // marginBottom handled dynamically
  },
  sectionTitle: {
    // Styling handled dynamically
  },
  kpiGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: designSystem.spacing[3],
  },
  chartContainer: {
    backgroundColor: 'transparent',
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing[4],
  },
} as const;

export default EventsAnalytics;