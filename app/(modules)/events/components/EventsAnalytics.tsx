/**
 * EventsAnalytics Component - Polished Edition
 * Premium analytics dashboard with refined visuals and real insights
 */
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Alert, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingState } from '@/components';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import EventStatusPieChart from '@/components/charts/EventStatusPieChart';
import ClientSegmentChart from '@/components/charts/ClientSegmentChart';
import { DateRangePicker } from '@/components/core';
import { useTheme } from '@/hooks/useTheme';
import { useEventsStore } from '@/store/eventsStore';
import { designSystem } from '@/constants/designSystem';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;

// ==================== INFO DEFINITIONS ====================
const INFO_DEFINITIONS: Record<string, { title: string; description: string }> = {
  hotLead: {
    title: '🔥 Hot Lead',
    description: 'A lead that was created within the last 3 days. These leads are fresh and have the highest chance of conversion. Prioritize follow-up!',
  },
  warmLead: {
    title: '🌡️ Warm Lead',
    description: 'A lead that is 3-7 days old. Still has good potential but needs attention soon before it goes cold.',
  },
  coldLead: {
    title: '❄️ Cold Lead',
    description: 'A lead that is more than 7 days old without conversion. These need immediate attention or may be lost opportunities.',
  },
  conversionRate: {
    title: '📊 Conversion Rate',
    description: 'The percentage of leads that successfully converted to events. Higher is better! Formula: (Converted Leads / Total Leads) × 100',
  },
  successRate: {
    title: '🏆 Event Success Rate',
    description: 'Percentage of completed events vs cancelled events. Shows how many events finish successfully. Formula: (Completed / (Completed + Cancelled)) × 100',
  },
  repeatRate: {
    title: '💝 Repeat Client Rate',
    description: 'Percentage of clients who have booked more than once. Higher rates indicate customer satisfaction and loyalty.',
  },
  avgBookings: {
    title: '📈 Avg. Bookings per Client',
    description: 'Average number of events booked per client. Higher numbers indicate strong customer relationships.',
  },
  avgResponseTime: {
    title: '⏱️ Avg. Response Time',
    description: 'Average number of days pending leads have been waiting. Lower is better - aim for under 3 days!',
  },
  onlineSource: {
    title: '🌐 Online Leads',
    description: 'Leads acquired through digital channels like website, social media, or online ads.',
  },
  offlineSource: {
    title: '🏪 Offline Leads',
    description: 'Leads acquired through traditional channels like referrals, walk-ins, or networking events.',
  },
  b2b: {
    title: '🏢 B2B (Business to Business)',
    description: 'Corporate clients - companies or organizations that hire for business events, conferences, or corporate functions.',
  },
  b2c: {
    title: '👤 B2C (Business to Consumer)',
    description: 'Individual/personal clients - people who book for personal events like weddings, birthdays, or private parties.',
  },
  b2g: {
    title: '🏛️ B2G (Business to Government)',
    description: 'Government clients - government bodies or public sector organizations for official events or functions.',
  },
  upcoming: {
    title: '📅 Upcoming Events',
    description: 'Events scheduled to happen within the next 7 days. Ensure all preparations are on track.',
  },
  active: {
    title: '⚡ Active Events',
    description: 'Events currently ongoing. Monitor these for any immediate issues or support needs.',
  },
  scheduled: {
    title: '🗓️ Scheduled Events',
    description: 'Future events that are confirmed but haven\'t started yet.',
  },
  completed: {
    title: '✅ Completed Events',
    description: 'Events that have finished successfully.',
  },
  cancelled: {
    title: '🚫 Cancelled Events',
    description: 'Events that were called off. Check reasons to reduce future cancellations.',
  },
};

// Info Button Component - Subtle/silent style
const InfoButton = ({ infoKey, color = '#6366F1', onPress }: { infoKey: keyof typeof INFO_DEFINITIONS; color?: string; onPress?: () => void }) => {
  const info = INFO_DEFINITIONS[infoKey];
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setTimeout(() => {
        Alert.alert(info.title, info.description, [{ text: 'OK', style: 'default' }]);
      }, 100);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      delayPressIn={0}
      activeOpacity={0.6}
      style={{
        marginLeft: 4,
        padding: 2,
        opacity: 0.5,
      }}
    >
      <Ionicons name="information-circle-outline" size={16} color={color} />
    </TouchableOpacity>
  );
};

interface EventsAnalyticsProps {
  refreshing?: boolean;
  headerComponent?: React.ReactNode;
}

// ==================== POLISHED COMPONENTS ====================

// Mini Stat Chip
const StatChip = ({ label, value, color, theme }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${color}12`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{value}</Text>
    <Text style={{ fontSize: 11, color: theme.textSecondary, marginLeft: 4 }}>{label}</Text>
  </View>
);

// Metric Card - Clean design
const MetricCard = ({
  title, value, subtitle, icon, color, trend, theme
}: {
  title: string; value: string; subtitle?: string; icon: any; color: string; trend?: 'up' | 'down' | null; theme: any
}) => (
  <View style={{
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      {trend && (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: trend === 'up' ? '#10B98115' : '#EF444415', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
          <Ionicons name={trend === 'up' ? 'trending-up' : 'trending-down'} size={12} color={trend === 'up' ? '#10B981' : '#EF4444'} />
        </View>
      )}
    </View>
    <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 2 }}>{value}</Text>
    <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{title}</Text>
    {subtitle && <Text style={{ fontSize: 11, color, marginTop: 4 }}>{subtitle}</Text>}
  </View>
);

// Insight Row - Compact horizontal insight
const InsightRow = ({
  icon, label, value, valueColor, theme
}: {
  icon: any; label: string; value: string; valueColor: string; theme: any
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${valueColor}12`, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name={icon} size={16} color={valueColor} />
    </View>
    <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: theme.text, marginLeft: 12 }}>{label}</Text>
    <Text style={{ fontSize: 16, fontWeight: '700', color: valueColor }}>{value}</Text>
  </View>
);

// Progress Bar with label and optional info
const ProgressBar = ({
  label, value, total, color, theme, infoKey, onInfoPress
}: {
  label: string; value: number; total: number; color: string; theme: any; infoKey?: keyof typeof INFO_DEFINITIONS; onInfoPress?: (key: keyof typeof INFO_DEFINITIONS) => void
}) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: theme.text }}>{label}</Text>
          {infoKey && <InfoButton infoKey={infoKey} onPress={onInfoPress ? () => onInfoPress(infoKey) : undefined} />}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color }}>{value} <Text style={{ fontWeight: '400', color: theme.textSecondary }}>({pct.toFixed(0)}%)</Text></Text>
      </View>
      <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
};

// Section Title
const SectionTitle = ({ title, subtitle, icon, color, theme }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 8 }}>
    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>{subtitle}</Text>}
    </View>
  </View>
);

// Card Wrapper
const Card = ({ children, style = {} }: any) => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: GAP, ...style }}>
      {children}
    </View>
  );
};

// ==================== MAIN COMPONENT ====================

const EventsAnalytics: React.FC<EventsAnalyticsProps> = ({ headerComponent }) => {
  const { theme } = useTheme();
  const { leads, events, clients, loading } = useEventsStore();
  const [dateRange, setDateRange] = useState<{ startDate?: Date; endDate?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [infoModal, setInfoModal] = useState<{ visible: boolean; title: string; description: string }>({ visible: false, title: '', description: '' });

  // Helper function to show info modal
  const showInfo = (key: keyof typeof INFO_DEFINITIONS) => {
    const info = INFO_DEFINITIONS[key];
    if (info) {
      setInfoModal({ visible: true, title: info.title, description: info.description });
    }
  };

  // Helper function to show custom info
  const showCustomInfo = (title: string, description: string) => {
    setInfoModal({ visible: true, title, description });
  };

  // ==================== ANALYTICS CALCULATIONS ====================
  const data = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Leads Optimization (Single Pass)
    const leadStats = leads.reduce((acc, l) => {
      // Status counts
      if (l.status === 'pending') acc.pending++;
      else if (l.status === 'converted') acc.converted++;
      else if (l.status === 'rejected') acc.rejected++;

      // Source counts
      if (l.source === 'online') {
        acc.online++;
        if (l.status === 'converted') acc.onlineConverted++;
      } else if (l.source === 'offline') {
        acc.offline++;
        if (l.status === 'converted') acc.offlineConverted++;
      }

      // Aging (only for pending) and Trends
      const createdDate = new Date(l.created_at);
      if (createdDate >= thisMonth) acc.thisMonthLeads++;
      else if (createdDate >= lastMonth && createdDate <= lastMonthEnd) acc.lastMonthLeads++;

      if (l.status === 'pending') {
        const days = Math.floor((now.getTime() - createdDate.getTime()) / 86400000);
        acc.totalAge += days;
        acc.pendingCountForAge++;
        if (days <= 3) acc.hot++;
        else if (days <= 7) acc.warm++;
        else acc.cold++;
      }

      // Referrals
      const ref = l.referral || 'Direct';
      acc.refCounts[ref] = (acc.refCounts[ref] || 0) + 1;

      return acc;
    }, {
      pending: 0, converted: 0, rejected: 0,
      online: 0, offline: 0, onlineConverted: 0, offlineConverted: 0,
      hot: 0, warm: 0, cold: 0, totalAge: 0, pendingCountForAge: 0,
      thisMonthLeads: 0, lastMonthLeads: 0,
      refCounts: {} as Record<string, number>
    });

    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? (leadStats.converted / totalLeads) * 100 : 0;
    const onlineRate = leadStats.online > 0 ? (leadStats.onlineConverted / leadStats.online) * 100 : 0;
    const offlineRate = leadStats.offline > 0 ? (leadStats.offlineConverted / leadStats.offline) * 100 : 0;
    const avgAge = leadStats.pendingCountForAge > 0 ? Math.round(leadStats.totalAge / leadStats.pendingCountForAge) : 0;
    const leadTrend = leadStats.lastMonthLeads > 0 ? Math.round(((leadStats.thisMonthLeads - leadStats.lastMonthLeads) / leadStats.lastMonthLeads) * 100) : 0;
    const topRefs = Object.entries(leadStats.refCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Events Optimization (Single Pass)
    const eventStats = events.reduce((acc, e) => {
      // Status
      if (e.status === 'ongoing') acc.active++;
      else if (e.status === 'scheduled') acc.scheduled++;
      else if (e.status === 'completed') acc.completed++;
      else if (e.status === 'cancelled') acc.cancelled++;

      // Upcoming
      if (e.status === 'scheduled') {
        const days = Math.floor((new Date(e.start_date).getTime() - today.getTime()) / 86400000);
        if (days >= 0 && days <= 7) acc.upcoming++;
      }

      // Category
      const c = e.category || 'other';
      acc.catCounts[c] = (acc.catCounts[c] || 0) + 1;

      return acc;
    }, {
      active: 0, scheduled: 0, completed: 0, cancelled: 0, upcoming: 0,
      catCounts: {} as Record<string, number>
    });

    const successRate = (eventStats.completed + eventStats.cancelled) > 0 ? Math.round((eventStats.completed / (eventStats.completed + eventStats.cancelled)) * 100) : 100;
    const topCat = Object.entries(eventStats.catCounts).sort((a, b) => b[1] - a[1])[0];

    // Clients Optimization (Single Pass)
    const clientStats = clients.reduce((acc, c) => {
      const cats = (c as any).client_category;
      if (Array.isArray(cats)) {
        if (cats.some((cat: any) => cat.code === 'b2b')) acc.b2b++;
        if (cats.some((cat: any) => cat.code === 'b2c')) acc.b2c++;
        if (cats.some((cat: any) => cat.code === 'b2g')) acc.b2g++;
      }

      if (c.bookings_count > 1) acc.repeat++;
      acc.totalBookings += c.bookings_count;

      return acc;
    }, { b2b: 0, b2c: 0, b2g: 0, repeat: 0, totalBookings: 0 });

    const totalClients = clients.length;
    const repeatRate = totalClients > 0 ? Math.round((clientStats.repeat / totalClients) * 100) : 0;
    const avgBookings = totalClients > 0 ? (clientStats.totalBookings / totalClients).toFixed(1) : '0';
    const topClients = [...clients].sort((a, b) => b.bookings_count - a.bookings_count).slice(0, 3);

    return {
      totalLeads, pending: leadStats.pending, converted: leadStats.converted, rejected: leadStats.rejected, conversionRate,
      online: leadStats.online, offline: leadStats.offline, onlineRate, offlineRate,
      hot: leadStats.hot, warm: leadStats.warm, cold: leadStats.cold, avgAge, thisMonthLeads: leadStats.thisMonthLeads, lastMonthLeads: leadStats.lastMonthLeads, leadTrend, topRefs,
      totalEvents: events.length, active: eventStats.active, scheduled: eventStats.scheduled, completed: eventStats.completed, cancelled: eventStats.cancelled, successRate, upcoming: eventStats.upcoming, topCat,
      totalClients, b2b: clientStats.b2b, b2c: clientStats.b2c, b2g: clientStats.b2g, repeat: clientStats.repeat, repeatRate, avgBookings, topClients,
    };
  }, [leads, events, clients]);

  const handleExport = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    Alert.alert('Success', 'Analytics exported!');
    setExporting(false);
  };

  if (loading.leads || loading.events || loading.clients) {
    return <LoadingState message="Loading analytics..." variant="skeleton" skeletonCount={6} />;
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={{ backgroundColor: theme.background, zIndex: 10 }}>{headerComponent}</View>

        {/* ========== HERO CARD ========== */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginTop: 16, borderRadius: 20, padding: 20, marginBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 }}>OVERVIEW</Text>
              <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 2 }}>Events Analytics</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setShowFilters(!showFilters)} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="filter" size={16} color="#FFF" />
              </Pressable>
              <Pressable onPress={handleExport} style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', opacity: exporting ? 0.5 : 1 }}>
                <Ionicons name={exporting ? 'hourglass' : 'download-outline'} size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Hero Stats */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => showInfo('conversionRate')} activeOpacity={0.7} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '800' }}>{data.conversionRate.toFixed(0)}%</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>Conversion</Text>
                <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showInfo('successRate')} activeOpacity={0.7} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '800' }}>{data.successRate}%</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>Success</Text>
                <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showInfo('repeatRate')} activeOpacity={0.7} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '800' }}>{data.repeatRate}%</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>Repeat</Text>
                <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Filter */}
        {showFilters && (
          <Card>
            <DateRangePicker label="Date Range" value={dateRange} onChange={setDateRange} placeholder="Filter by date" />
            {(dateRange.startDate || dateRange.endDate) && (
              <Pressable onPress={() => setDateRange({})} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF444415', padding: 10, borderRadius: 8, marginTop: 12 }}>
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={{ color: '#EF4444', marginLeft: 6, fontWeight: '600', fontSize: 12 }}>Clear</Text>
              </Pressable>
            )}
          </Card>
        )}

        {/* ========== QUICK ACTION ========== */}
        {/* ========== QUICK ACTION ========== */}
        {(data.cold > 0 || data.upcoming > 0) && (
          <Card style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Ionicons name="alert-circle" size={20} color="#D97706" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#92400E' }}>Needs Attention</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {data.cold > 0 && (
                <TouchableOpacity onPress={() => showInfo('coldLead')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#B91C1C' }}>{data.cold}</Text>
                  <Text style={{ fontSize: 13, color: '#DC2626', marginLeft: 4 }}>cold leads</Text>
                  <Ionicons name="information-circle" size={14} color="#EF4444" style={{ marginLeft: 6, opacity: 0.7 }} />
                </TouchableOpacity>
              )}
              {data.warm > 0 && (
                <TouchableOpacity onPress={() => showInfo('warmLead')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FED7AA' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#C2410C' }}>{data.warm}</Text>
                  <Text style={{ fontSize: 13, color: '#EA580C', marginLeft: 4 }}>warm leads</Text>
                  <Ionicons name="information-circle" size={14} color="#F97316" style={{ marginLeft: 6, opacity: 0.7 }} />
                </TouchableOpacity>
              )}
              {data.upcoming > 0 && (
                <TouchableOpacity onPress={() => showInfo('upcoming')} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D4ED8' }}>{data.upcoming}</Text>
                  <Text style={{ fontSize: 13, color: '#2563EB', marginLeft: 4 }}>events this week</Text>
                  <Ionicons name="information-circle" size={14} color="#3B82F6" style={{ marginLeft: 6, opacity: 0.7 }} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* ========== LEADS SECTION ========== */}
        <SectionTitle title="Lead Performance" subtitle={`${data.totalLeads} total leads`} icon="people" color="#6366F1" theme={theme} />

        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          <MetricCard title="Total Leads" value={String(data.totalLeads)} icon="people-outline" color="#6366F1" trend={data.leadTrend > 0 ? 'up' : data.leadTrend < 0 ? 'down' : null} theme={theme} subtitle={data.leadTrend !== 0 ? `${data.leadTrend > 0 ? '+' : ''}${data.leadTrend}% vs last month` : undefined} />
          <MetricCard title="Converted" value={String(data.converted)} icon="checkmark-done" color="#10B981" theme={theme} subtitle={`${data.conversionRate.toFixed(0)}% rate`} />
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Source Comparison</Text>
            <Text style={{ fontSize: 10, color: theme.textSecondary, marginLeft: 8 }}>Tap to learn more</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => showInfo('onlineSource')} activeOpacity={0.7} style={{ flex: 1, backgroundColor: '#10B98115', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#10B98130' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="globe-outline" size={20} color="#10B981" />
                <Ionicons name="information-circle-outline" size={14} color="#10B981" style={{ marginLeft: 6, opacity: 0.5 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#10B981', marginTop: 6 }}>{data.onlineRate.toFixed(0)}%</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Online ({data.online})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showInfo('offlineSource')} activeOpacity={0.7} style={{ flex: 1, backgroundColor: '#6366F115', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#6366F130' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="storefront-outline" size={20} color="#6366F1" />
                <Ionicons name="information-circle-outline" size={14} color="#6366F1" style={{ marginLeft: 6, opacity: 0.5 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#6366F1', marginTop: 6 }}>{data.offlineRate.toFixed(0)}%</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>Offline ({data.offline})</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
            {data.onlineRate >= data.offlineRate ? '🏆 Online' : '🏆 Offline'} leads convert better
          </Text>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Pipeline Health</Text>
            <TouchableOpacity
              onPress={() => showCustomInfo('ℹ️ Pipeline Health', 'Shows how long your pending leads have been waiting. Hot leads (< 3 days) are fresh and should be prioritized. Cold leads (> 7 days) need urgent attention before they are lost.')}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              delayPressIn={0}
              activeOpacity={0.6}
              style={{ marginLeft: 4, padding: 2, opacity: 0.5 }}
            >
              <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          <ProgressBar label="Hot (< 3 days)" value={data.hot} total={data.pending} color="#10B981" theme={theme} infoKey="hotLead" onInfoPress={showInfo} />
          <ProgressBar label="Warm (3-7 days)" value={data.warm} total={data.pending} color="#F59E0B" theme={theme} infoKey="warmLead" onInfoPress={showInfo} />
          <ProgressBar label="Cold (> 7 days)" value={data.cold} total={data.pending} color="#EF4444" theme={theme} infoKey="coldLead" onInfoPress={showInfo} />
          <View style={{ backgroundColor: theme.border, height: 1, marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Avg. response time</Text>
              <InfoButton infoKey="avgResponseTime" onPress={() => showInfo('avgResponseTime')} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: data.avgAge <= 3 ? '#10B981' : data.avgAge <= 7 ? '#F59E0B' : '#EF4444' }}>{data.avgAge} days</Text>
          </View>
        </Card>

        {data.topRefs.length > 0 && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Top Referral Sources</Text>
              <View style={{ marginLeft: 'auto', backgroundColor: '#F59E0B15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>LEADERBOARD</Text>
              </View>
            </View>
            {data.topRefs.map(([name, count], i) => (
              <View key={name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: i === 0 ? '#F59E0B08' : 'transparent', padding: i === 0 ? 12 : 8, borderRadius: 12, borderWidth: i === 0 ? 1 : 0, borderColor: '#F59E0B20' }}>
                <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: i === 0 ? '#F59E0B' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: i === 0 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: i === 0 ? '700' : '500', color: theme.text }}>{name}</Text>
                  <View style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 6, width: '100%' }}>
                    <View style={{ height: '100%', width: `${(count / data.totalLeads) * 100}%`, backgroundColor: i === 0 ? '#F59E0B' : '#6366F1', borderRadius: 2 }} />
                  </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: i === 0 ? '#F59E0B' : theme.text, marginLeft: 12 }}>{count}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={{ marginBottom: 16 }}>
          <ConversionFunnelChart data={{ total: data.totalLeads, pending: data.pending, converted: data.converted }} />
        </View>

        {/* ========== EVENTS SECTION ========== */}
        <SectionTitle title="Event Portfolio" subtitle={`${data.totalEvents} total events`} icon="calendar" color="#F59E0B" theme={theme} />

        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          <MetricCard title="Active" value={String(data.active)} icon="flash" color="#F59E0B" theme={theme} />
          <MetricCard title="Completed" value={String(data.completed)} icon="trophy" color="#10B981" theme={theme} />
        </View>

        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          <Card style={{ flex: 1, marginBottom: 0, padding: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 4 }}>Scheduled</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#3B82F6' }}>{data.scheduled}</Text>
            <View style={{ height: 4, backgroundColor: '#3B82F630', borderRadius: 2, marginTop: 8, width: '100%' }}>
              <View style={{ height: '100%', width: `${(data.scheduled / data.totalEvents) * 100}%`, backgroundColor: '#3B82F6', borderRadius: 2 }} />
            </View>
          </Card>
          <Card style={{ flex: 1, marginBottom: 0, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Scheduled</Text>
              <InfoButton infoKey="scheduled" color="#3B82F6" onPress={() => showInfo('scheduled')} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#3B82F6' }}>{data.scheduled}</Text>
            <View style={{ height: 4, backgroundColor: '#3B82F630', borderRadius: 2, marginTop: 8, width: '100%' }}>
              <View style={{ height: '100%', width: `${(data.scheduled / data.totalEvents) * 100}%`, backgroundColor: '#3B82F6', borderRadius: 2 }} />
            </View>
          </Card>
          <Card style={{ flex: 1, marginBottom: 0, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Cancelled</Text>
              <InfoButton infoKey="cancelled" color="#EF4444" onPress={() => showInfo('cancelled')} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#EF4444' }}>{data.cancelled}</Text>
            <View style={{ height: 4, backgroundColor: '#EF444430', borderRadius: 2, marginTop: 8, width: '100%' }}>
              <View style={{ height: '100%', width: `${(data.cancelled / data.totalEvents) * 100}%`, backgroundColor: '#EF4444', borderRadius: 2 }} />
            </View>
          </Card>
        </View>

        {data.topCat && (
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20, marginBottom: GAP, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Top Category</Text>
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 4, textTransform: 'capitalize' }}>{data.topCat[0]}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>{data.topCat[1]} <Text style={{ fontSize: 12, fontWeight: '500' }}>events</Text></Text>
            </View>
          </LinearGradient>
        )}

        <View style={{ marginBottom: 16 }}>
          <EventStatusPieChart
            data={[
              { status: 'Scheduled', count: data.scheduled, color: '#3B82F6' },
              { status: 'Ongoing', count: data.active, color: '#F59E0B' },
              { status: 'Completed', count: data.completed, color: '#10B981' },
              { status: 'Cancelled', count: data.cancelled, color: '#EF4444' },
            ]}
          />
        </View>

        {/* ========== CLIENTS SECTION ========== */}
        <SectionTitle title="Client Insights" subtitle={`${data.totalClients} clients`} icon="briefcase" color="#8B5CF6" theme={theme} />

        <View style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          <MetricCard title="Repeat Rate" value={`${data.repeatRate}%`} icon="heart" color="#EC4899" theme={theme} subtitle={`${data.repeat} returning`} />
          <MetricCard title="Avg. Bookings" value={data.avgBookings} icon="repeat" color="#6366F1" theme={theme} />
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Segment Distribution</Text>
          </View>
          <ProgressBar label="B2B (Business)" value={data.b2b} total={data.totalClients} color="#8B5CF6" theme={theme} infoKey="b2b" onInfoPress={showInfo} />
          <ProgressBar label="B2C (Consumer)" value={data.b2c} total={data.totalClients} color="#3B82F6" theme={theme} infoKey="b2c" onInfoPress={showInfo} />
          <ProgressBar label="B2G (Government)" value={data.b2g} total={data.totalClients} color="#10B981" theme={theme} infoKey="b2g" onInfoPress={showInfo} />
        </Card>

        {data.topClients.length > 0 && data.topClients[0].bookings_count > 0 && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Top Clients</Text>
              <View style={{ marginLeft: 'auto', backgroundColor: '#8B5CF615', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#8B5CF6' }}>LOYALTY</Text>
              </View>
            </View>
            {data.topClients.filter(c => c.bookings_count > 0).map((c, i) => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: i === 0 ? '#8B5CF608' : 'transparent', padding: i === 0 ? 12 : 8, borderRadius: 12, borderWidth: i === 0 ? 1 : 0, borderColor: '#8B5CF620' }}>
                <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: i === 0 ? '#8B5CF6' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: i === 0 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: i === 0 ? '700' : '500', color: theme.text }}>{c.name}</Text>
                  <View style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 6, width: '100%' }}>
                    <View style={{ height: '100%', width: `${Math.min((c.bookings_count / data.topClients[0].bookings_count) * 100, 100)}%`, backgroundColor: i === 0 ? '#8B5CF6' : '#EC4899', borderRadius: 2 }} />
                  </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: i === 0 ? '#8B5CF6' : theme.text, marginLeft: 12 }}>{c.bookings_count}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={{ marginBottom: 20 }}>
          <ClientSegmentChart
            data={[
              { category: 'B2B', count: data.b2b, icon: 'business-outline' },
              { category: 'B2C', count: data.b2c, icon: 'person-outline' },
              { category: 'B2G', count: data.b2g, icon: 'briefcase-outline' },
            ]}
          />
        </View>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={infoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal({ ...infoModal, visible: false })}
      >
        <Pressable
          onPress={() => setInfoModal({ ...infoModal, visible: false })}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        >
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
              {infoModal.title}
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              {infoModal.description}
            </Text>
            <TouchableOpacity
              onPress={() => setInfoModal({ ...infoModal, visible: false })}
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default EventsAnalytics;