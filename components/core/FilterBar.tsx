import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';

export interface FilterOption {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  type: 'select' | 'multiselect' | 'daterange' | 'toggle';
  options?: FilterOption[];
  placeholder?: string;
}

export interface ActiveFilters {
  [key: string]: string | number | (string | number)[] | { start?: string; end?: string } | boolean;
}

interface FilterBarProps {
  configs: FilterConfig[];
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
}

export function FilterBar({
  configs,
  activeFilters,
  onFiltersChange,
  onClearAll,
  showClearAll = true,
}: FilterBarProps) {
  const { theme } = useTheme();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Count active filters
  const activeFilterCount = Object.entries(activeFilters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Boolean((value as any).start || (value as any).end);
    }
    return Boolean(value);
  }).length;

  // Handle filter selection
  const handleFilterSelect = (config: FilterConfig) => {
    setSelectedFilter(config);
    setShowFilterModal(true);
  };

  // Handle single select option
  const handleSingleSelect = (key: string, value: string | number) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value,
    });
    setShowFilterModal(false);
  };

  // Handle multi-select option
  const handleMultiSelect = (key: string, value: string | number) => {
    const currentValues = (activeFilters[key] as string[]) || [];
    const newValues = currentValues.includes(value as string)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...activeFilters,
      [key]: newValues,
    });
  };

  // Handle date range
  const handleDateChange = (key: string, type: 'start' | 'end', date: Date) => {
    const currentRange = (activeFilters[key] as { start?: string; end?: string }) || {};
    onFiltersChange({
      ...activeFilters,
      [key]: {
        ...currentRange,
        [type]: date.toISOString().split('T')[0],
      },
    });
    setShowDatePicker(null);
  };

  // Handle toggle
  const handleToggle = (key: string) => {
    onFiltersChange({
      ...activeFilters,
      [key]: !activeFilters[key],
    });
    setShowFilterModal(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      onFiltersChange({});
    }
  };

  // Get active filter display text
  const getActiveFilterText = (config: FilterConfig): string | null => {
    const value = activeFilters[config.key];

    if (!value) return null;

    if (config.type === 'select') {
      const option = config.options?.find((opt) => opt.value === value);
      return option?.label || null;
    }

    if (config.type === 'multiselect') {
      const values = value as string[];
      if (values.length === 0) return null;
      if (values.length === 1) {
        const option = config.options?.find((opt) => opt.value === values[0]);
        return option?.label || null;
      }
      return `${values.length} selected`;
    }

    if (config.type === 'daterange') {
      const range = value as { start?: string; end?: string };
      if (!range.start && !range.end) return null;
      if (range.start && range.end) return `${range.start} - ${range.end}`;
      if (range.start) return `From ${range.start}`;
      if (range.end) return `Until ${range.end}`;
    }

    if (config.type === 'toggle') {
      return value ? 'On' : null;
    }

    return null;
  };

  // Render filter modal content
  const renderFilterModalContent = () => {
    if (!selectedFilter) return null;

    if (selectedFilter.type === 'select' || selectedFilter.type === 'multiselect') {
      const isMulti = selectedFilter.type === 'multiselect';
      const selectedValues = isMulti
        ? (activeFilters[selectedFilter.key] as string[]) || []
        : [];

      return (
        <ScrollView style={styles.modalContent}>
          {selectedFilter.options?.map((option, index) => {
            const isSelected = isMulti
              ? selectedValues.includes(option.value as string)
              : activeFilters[selectedFilter.key] === option.value;

            return (
              <Animated.View key={option.value} entering={FadeIn.delay(index * 50)}>
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
                  ]}
                  onPress={() => {
                    if (isMulti) {
                      handleMultiSelect(selectedFilter.key, option.value);
                    } else {
                      handleSingleSelect(selectedFilter.key, option.value);
                    }
                  }}
                >
                  {option.icon && (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={option.color || (isSelected ? theme.primary : theme.textSecondary)}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      );
    }

    if (selectedFilter.type === 'daterange') {
      const range = (activeFilters[selectedFilter.key] as { start?: string; end?: string }) || {};

      return (
        <View style={styles.modalContent}>
          <DateRangePicker
            label="Date Range"
            value={{
              startDate: range.start ? new Date(range.start) : undefined,
              endDate: range.end ? new Date(range.end) : undefined
            }}
            onChange={(range) => {
              onFiltersChange({
                ...activeFilters,
                [selectedFilter.key]: {
                  start: range.startDate?.toISOString().split('T')[0],
                  end: range.endDate?.toISOString().split('T')[0],
                },
              });
            }}
            placeholder="Select start and end date"
          />
        </View>
      );
    }

    if (selectedFilter.type === 'toggle') {
      return (
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleToggle(selectedFilter.key)}
          >
            <Text style={[styles.toggleLabel, { color: theme.text }]}>
              {selectedFilter.label}
            </Text>
            <View
              style={[
                styles.toggleSwitch,
                activeFilters[selectedFilter.key]
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: '#fff' },
                  activeFilters[selectedFilter.key] ? styles.toggleThumbActive : null,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {configs.map((config, index) => {
          const activeText = getActiveFilterText(config);
          const isActive = Boolean(activeText);

          return (
            <TouchableOpacity
              key={config.key}
              style={[
                styles.filterChip,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isActive && { borderColor: theme.primary, backgroundColor: theme.primary + '15' },
              ]}
              onPress={() => handleFilterSelect(config)}
            >
              {config.icon && (
                <Ionicons
                  name={config.icon}
                  size={16}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? theme.primary : theme.text },
                ]}
              >
                {activeText || config.label}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={isActive ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>
          );
        })}

        {showClearAll && activeFilterCount > 0 && (
          <TouchableOpacity
            style={[styles.clearAllButton, { backgroundColor: theme.error + '15' }]}
            onPress={handleClearAll}
          >
            <Ionicons name="close-circle" size={16} color={theme.error} />
            <Text style={[styles.clearAllText, { color: theme.error }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Animated.View
          entering={SlideInDown}
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.primary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedFilter?.label}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {renderFilterModalContent()}

          {selectedFilter?.type === 'multiselect' && (
            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 60,
  },
  contentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '500',
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dateRangeLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  dateRangeValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

