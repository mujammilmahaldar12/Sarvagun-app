import React, { useMemo } from 'react';
import { View, RefreshControl, FlatList, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useClients } from '@/store/eventsStore';
import { designSystem, spacing } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { Client } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';

interface ClientsListProps {
  searchQuery?: string;
  selectedCategory?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const COLUMN_WIDTHS = {
  id: 60,
  name: 150,
  email: 200,
  phone: 120,
  actions: 80,
};

const ClientsList: React.FC<ClientsListProps> = ({
  searchQuery = '',
  selectedCategory,
  refreshing = false,
  onRefresh,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const {
    clients,
    loading,
  } = useClients();

  // Filter data
  const filteredData = useMemo(() => {
    if (!clients) return [];
    let data = [...clients];

    if (selectedCategory) {
      data = data.filter(c => c.category?.some(cat => cat.id === selectedCategory));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(c =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.leadperson?.toLowerCase().includes(query)
      );
    }
    return data;
  }, [clients, selectedCategory, searchQuery]);

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.id, color: theme.text }]}>ID</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.name, color: theme.text }]}>Name</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.email, color: theme.text }]}>Email</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.phone, color: theme.text }]}>Phone</Text>
      <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.actions, color: theme.text }]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Client }) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.id, color: theme.textSecondary }]}>#{item.id}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.name, color: theme.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.email, color: theme.text }]} numberOfLines={1}>{item.email || '-'}</Text>
      <Text style={[styles.cell, { width: COLUMN_WIDTHS.phone, color: theme.text }]} numberOfLines={1}>{item.phone || '-'}</Text>
      <View style={[styles.cell, { width: COLUMN_WIDTHS.actions }]}>
        <TouchableOpacity
          onPress={() => router.push(`/(modules)/events/${item.id}?type=clients` as any)}
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
        No clients found
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
    width: 610,
  },
});

export default ClientsList;