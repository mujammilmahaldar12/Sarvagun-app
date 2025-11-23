/**
 * Table Component
 * Enhanced table with Excel-like features
 */
import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList, Alert } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  resizable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  
  // Features
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  virtualized?: boolean;
  stickyHeader?: boolean;
  
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  
  // Actions
  onRowPress?: (item: T, index: number) => void;
  onRowEdit?: (item: T, key: string, value: any) => void;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onExport?: (format: 'csv' | 'excel') => void;
  
  // States
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  
  // Style
  maxHeight?: number;
}

export const Table = <T extends any>({
  columns,
  data,
  keyExtractor,
  searchable = true,
  sortable = true,
  filterable = false,
  selectable = false,
  exportable = true,
  virtualized = false,
  stickyHeader = true,
  paginated = false,
  pageSize = 20,
  onRowPress,
  onRowEdit,
  onSelectionChange,
  onSort,
  onExport,
  loading = false,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  maxHeight = 600,
}: TableProps<T>) => {
  const { colors } = useThemeStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{ rowKey: string | number; columnKey: string } | null>(null);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item as any).some((val) => String(val).toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      const comparison = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable && !sortable) return;

    if (sortColumn === columnKey) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
        onSort?.(columnKey, 'desc');
      } else {
        // Reset to no sort
        setSortColumn(null);
        setSortDirection('asc');
        onSort?.(columnKey, 'asc');
      }
    } else {
      // First click: set to asc
      setSortColumn(columnKey);
      setSortDirection('asc');
      onSort?.(columnKey, 'asc');
    }
  };

  // Handle selection
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.(new Set());
    } else {
      const allKeys = new Set(paginatedData.map((item, idx) => keyExtractor(item, idx)));
      setSelectedRows(allKeys);
      onSelectionChange?.(allKeys);
    }
  };

  const handleSelectRow = (key: string | number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Export to CSV (simplified - shows data in Alert)
  const exportToCSV = async () => {
    const headers = columns.map((col) => col.title).join(',');
    const rows = sortedData.map((item) =>
      columns.map((col) => {
        const value = (item as any)[col.key];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Show preview in Alert (or you can install expo-sharing later)
    Alert.alert(
      'Export CSV',
      'CSV export requires expo-sharing package. Preview:\n\n' + csv.substring(0, 200) + '...',
      [{ text: 'OK' }]
    );
    onExport?.('csv');
  };

  // Render cell
  const renderCell = (item: T, column: TableColumn<T>, rowIndex: number) => {
    const value = (item as any)[column.key];
    const rowKey = keyExtractor(item, rowIndex);
    const isEditing = editingCell?.rowKey === rowKey && editingCell?.columnKey === column.key;

    if (isEditing && column.editable) {
      return (
        <TextInput
          autoFocus
          value={String(value)}
          onChangeText={(text) => onRowEdit?.(item, column.key, text)}
          onBlur={() => setEditingCell(null)}
          style={{
            fontSize: typography.sizes.sm,
            color: colors.text,
            padding: spacing[2],
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: borderRadius.sm,
          }}
        />
      );
    }

    if (column.render) {
      return column.render(value, item, rowIndex);
    }

    return (
      <Pressable
        onLongPress={() => column.editable && setEditingCell({ rowKey, columnKey: column.key })}
      >
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.text,
            textAlign: column.align || 'left',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {String(value ?? '-')}
        </Text>
      </Pressable>
    );
  };

  // Animated row
  const TableRow = ({ item, index }: { item: T; index: number }) => {
    const rowKey = keyExtractor(item, index);
    const isSelected = selectedRows.has(rowKey);

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[3],
          minHeight: 50,
          backgroundColor: isSelected
            ? `${colors.primary}15`
            : index % 2 === 0
            ? colors.background
            : colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {selectable && (
          <View style={{ width: 40, flexShrink: 0, justifyContent: 'center', alignItems: 'center' }}>
            <Pressable onPress={() => handleSelectRow(rowKey)}>
              <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={20} color={colors.primary} />
            </Pressable>
          </View>
        )}
        {columns.map((column) => (
          <Pressable
            key={column.key}
            onPress={() => onRowPress?.(item, index)}
            style={{
              width: column.width || 120,
              flexShrink: 0,
              flexGrow: 0,
              paddingHorizontal: spacing[2],
              justifyContent: 'center',
            }}
          >
            {renderCell(item, column, index)}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={{ maxHeight, flex: 1 }}>
      {/* Toolbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[4], backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {/* Search */}
        {searchable && (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, paddingHorizontal: spacing[3], borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, paddingVertical: spacing[2], paddingHorizontal: spacing[2], color: colors.text, fontSize: typography.sizes.sm }}
            />
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

        {/* Export */}
        {exportable && (
          <Pressable
            onPress={exportToCSV}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              borderRadius: borderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[1],
            }}
          >
            <Ionicons name="download-outline" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>Export</Text>
          </Pressable>
        )}
      </View>

      {/* Selection Info */}
      {selectable && selectedRows.size > 0 && (
        <View style={{ backgroundColor: `${colors.primary}20`, padding: spacing[2], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold }}>
            {selectedRows.size} selected
          </Text>
          <Pressable onPress={() => { setSelectedRows(new Set()); onSelectionChange?.(new Set()); }}>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.sm }}>Clear</Text>
          </Pressable>
        </View>
      )}

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} bounces={false}>
        <View>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[3],
              minHeight: 50,
              backgroundColor: colors.surfaceElevated,
              borderBottomWidth: 2,
              borderBottomColor: colors.primary,
            }}
          >
            {selectable && (
              <View style={{ width: 40, flexShrink: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Pressable onPress={handleSelectAll}>
                  <Ionicons
                    name={selectedRows.size === paginatedData.length ? 'checkbox' : selectedRows.size > 0 ? 'remove' : 'square-outline'}
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            )}
            {columns.map((column) => (
              <Pressable
                key={column.key}
                onPress={() => handleSort(column.key)}
                style={{
                  width: column.width || 120,
                  flexShrink: 0,
                  flexGrow: 0,
                  paddingHorizontal: spacing[2],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[1],
                }}
              >
                <Text 
                  style={{ 
                    fontSize: typography.sizes.xs, 
                    fontWeight: typography.weights.bold, 
                    color: colors.text,
                    flex: 1,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {column.title}
                </Text>
                {(column.sortable || sortable) && (
                  <Ionicons
                    name={sortColumn === column.key ? (sortDirection === 'asc' ? 'chevron-up' : 'chevron-down') : 'swap-vertical'}
                    size={14}
                    color={sortColumn === column.key ? colors.primary : colors.textSecondary}
                  />
                )}
              </Pressable>
            ))}
          </View>

          {/* Body */}
          {loading ? (
            <View style={{ padding: spacing[8], alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }}>Loading...</Text>
            </View>
          ) : paginatedData.length === 0 ? (
            <View style={{ padding: spacing[8], alignItems: 'center' }}>
              <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing[2] }}>{emptyMessage}</Text>
            </View>
          ) : virtualized ? (
            <FlatList
              data={paginatedData}
              keyExtractor={(item, idx) => String(keyExtractor(item, idx))}
              renderItem={({ item, index }) => <TableRow item={item} index={index} />}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {paginatedData.map((item, index) => (
                <TableRow key={String(keyExtractor(item, index))} item={item} index={index} />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: spacing[3], gap: spacing[2], backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable onPress={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? colors.textSecondary : colors.primary} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: typography.sizes.sm }}>
            Page {currentPage} of {totalPages}
          </Text>
          <Pressable onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? colors.textSecondary : colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Table;
