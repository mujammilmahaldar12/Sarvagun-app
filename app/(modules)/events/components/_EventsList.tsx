import React, { useMemo } from 'react';
import { View, RefreshControl, FlatList, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useEvents } from '@/store/eventsStore';
import { usePermissions } from '@/store/permissionStore';
import { designSystem, spacing } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { AppEvent } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface EventsListProps {
  searchQuery?: string;
  selectedStatus?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const COLUMN_WIDTHS = {
  id: 60,
  type: 150,
  client: 150,
  venue: 150,
  date: 120,
  status: 100,
  actions: 80,
};

const EventsList: React.FC<EventsListProps> = ({
  searchQuery = '',
  selectedStatus = 'all',
  refreshing = false,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { canEditEvents, canManageEvents } = usePermissions();

  const {
    events,
    loading,
  } = useEvents();

  // Filter data
  const filteredData = useMemo(() => {
    if (!events) return [];
    let data = [...events];

    if (selectedStatus && selectedStatus !== 'all') {
      data = data.filter(e => e.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(e =>
        e.type_of_event?.toLowerCase().includes(query) ||
        e.client?.name?.toLowerCase().includes(query) ||
        e.venue?.name?.toLowerCase().includes(query)
      );
    }

    return data;
  }, [events, selectedStatus, searchQuery]);

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.id, color: theme.text }]}>ID</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.type, color: theme.text }]}>Event Type</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.client, color: theme.text }]}>Client</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.venue, color: theme.text }]}>Venue</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.date, color: theme.text }]}>Date</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.status, color: theme.text }]}>Status</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.actions, color: theme.text }]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AppEvent }) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.id, color: theme.textSecondary }]}>#{item.id}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.type, color: theme.text }]} numberOfLines={1}>{item.type_of_event}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.client, color: theme.text }]} numberOfLines={1}>{item.client?.name || '-'}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.venue, color: theme.text }]} numberOfLines={1}>{item.venue?.name || '-'}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.date, color: theme.textSecondary }]}>
        {item.event_date ? format(new Date(item.event_date), 'MMM d, yyyy') : '-'}
      </Text>
      <View style={[styles.cell, { width: COLUMN_WIDTHS.status }]}>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: item.status === 'Completed' ? theme.success + '20' :
              item.status === 'Cancelled' ? theme.error + '20' :
                theme.primary + '20'
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'Completed' ? theme.success :
                item.status === 'Cancelled' ? theme.error :
                  theme.primary
            }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={[styles.cell, { width: COLUMN_WIDTHS.actions }]}>
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/events/${item.id}?type=events` as any)}
          style={[styles.actionButton, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="eye-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[getTypographyStyle('base', 'medium'), { color: theme.textSecondary }]}>
        No events found
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {renderHeader()}
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            ListEmptyComponent={!loading ? renderEmptyComponent : null}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  cell: {
    fontSize: 14,
    paddingHorizontal: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: 810, // Match total column width to center properly in scroll view
  },
});

export default EventsList;