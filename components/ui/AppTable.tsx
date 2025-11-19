import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface AppTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowPress?: (item: T) => void;
  onRefresh?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  selectable?: boolean;
  selectedItems?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
}

export default function AppTable<T = any>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  onRefresh,
  loading = false,
  emptyMessage = 'No data available',
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
}: AppTableProps<T>) {
  const { theme, isDark } = useTheme();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedItems.size === data.length) {
      onSelectionChange(new Set());
    } else {
      const allIds = new Set(data.map(item => keyExtractor(item)));
      onSelectionChange(allIds);
    }
  };

  const handleSelectItem = (itemId: string | number) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = data.length > 0 && selectedItems.size === data.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < data.length;

  return (
    <View className="flex-1">
      {/* Search Bar */}
      {searchable && (
        <View
          className="px-4 py-3 flex-row items-center rounded-xl mx-4 mt-4 mb-3"
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#E5E7EB',
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            className="flex-1 text-base"
            style={{ color: theme.colors.text }}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      )}

      {/* Selection Info */}
      {selectable && selectedItems.size > 0 && (
        <View
          className="px-4 py-2 mx-4 mb-2 rounded-lg flex-row items-center justify-between"
          style={{
            backgroundColor: `${theme.colors.primary}20`,
          }}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.colors.primary }}
          >
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </Text>
          <Pressable onPress={() => onSelectionChange?.(new Set())}>
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.colors.primary }}
            >
              Clear
            </Text>
          </Pressable>
        </View>
      )}

      {/* Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-1">
          {/* Header Row */}
          <View
            className="flex-row px-4 py-3"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
              borderBottomWidth: 2,
              borderBottomColor: isDark ? '#374151' : '#E5E7EB',
            }}
          >
            {selectable && (
              <Pressable
                onPress={handleSelectAll}
                className="w-10 items-center justify-center"
              >
                <Ionicons
                  name={
                    allSelected
                      ? 'checkbox'
                      : someSelected
                      ? 'square'
                      : 'square-outline'
                  }
                  size={24}
                  color={theme.colors.primary}
                />
              </Pressable>
            )}
            {columns.map((column) => (
              <Pressable
                key={column.key}
                onPress={() => handleSort(column.key)}
                className="flex-row items-center px-2"
                style={{
                  width: column.width || 120,
                }}
              >
                <Text
                  className="text-sm font-bold flex-1"
                  style={{ color: theme.colors.text }}
                >
                  {column.title}
                </Text>
                {column.sortable && (
                  <Ionicons
                    name={
                      sortColumn === column.key
                        ? sortDirection === 'asc'
                          ? 'chevron-up'
                          : 'chevron-down'
                        : 'swap-vertical'
                    }
                    size={16}
                    color={
                      sortColumn === column.key
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                )}
              </Pressable>
            ))}
          </View>

          {/* Data Rows */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={theme.colors.primary}
                />
              ) : undefined
            }
          >
            {loading ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : data.length === 0 ? (
              <View className="py-20 items-center justify-center">
                <Ionicons
                  name="folder-open-outline"
                  size={64}
                  color={theme.colors.textSecondary}
                />
                <Text
                  className="text-base mt-4"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {emptyMessage}
                </Text>
              </View>
            ) : (
              data.map((item, index) => {
                const itemId = keyExtractor(item);
                const isSelected = selectedItems.has(itemId);
                
                return (
                  <Pressable
                    key={itemId}
                    onPress={() => {
                      if (selectable) {
                        handleSelectItem(itemId);
                      } else {
                        onRowPress?.(item);
                      }
                    }}
                    className="flex-row px-4 py-3"
                    style={{
                      backgroundColor: isSelected
                        ? `${theme.colors.primary}10`
                        : index % 2 === 0
                        ? theme.colors.background
                        : theme.colors.surface,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                    }}
                  >
                    {selectable && (
                      <View className="w-10 items-center justify-center">
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                    {columns.map((column) => (
                      <View
                        key={column.key}
                        className="px-2 justify-center"
                        style={{
                          width: column.width || 120,
                        }}
                      >
                        {column.render ? (
                          column.render((item as any)[column.key], item)
                        ) : (
                          <Text
                            className="text-sm"
                            style={{ color: theme.colors.text }}
                            numberOfLines={2}
                          >
                            {String((item as any)[column.key] ?? '-')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
