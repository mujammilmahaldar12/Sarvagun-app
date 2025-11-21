/**
 * EventsFilters Component
 * Professional filtering interface for events management
 * Extracted from monolithic events/index.tsx
 */
import React, { useState, useCallback } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '@/components/ui/SearchBar';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ActionButton from '@/components/ui/ActionButton';
import { useTheme } from '@/hooks/useTheme';
import { useEventsStore } from '@/store/eventsStore';
import { designSystem } from '@/constants/designSystem';

type TabType = 'analytics' | 'leads' | 'events' | 'clients' | 'venues';

interface EventsFiltersProps {
  activeTab: TabType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedCategory?: number;
  onCategoryChange?: (categoryId: number | undefined) => void;
}

const EventsFilters: React.FC<EventsFiltersProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const { theme, spacing } = useTheme();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const { 
    clientCategories,
    fetchClientCategories 
  } = useEventsStore();

  // Load categories when needed
  React.useEffect(() => {
    if ((activeTab === 'clients' || activeTab === 'analytics') && clientCategories.length === 0) {
      fetchClientCategories();
    }
  }, [activeTab, clientCategories.length, fetchClientCategories]);

  // Get available filter options based on active tab
  const getStatusOptions = useCallback(() => {
    const baseOptions = [{ label: 'All', value: 'all' }];
    
    switch (activeTab) {
      case 'leads':
        return [
          ...baseOptions,
          { label: 'Pending', value: 'pending' },
          { label: 'Converted', value: 'converted' },
          { label: 'Rejected', value: 'rejected' },
        ];
      case 'events':
        return [
          ...baseOptions,
          { label: 'Planned', value: 'planned' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ];
      default:
        return baseOptions;
    }
  }, [activeTab]);

  const getCategoryOptions = useCallback(() => {
    return [
      { label: 'All Categories', value: undefined },
      ...clientCategories.map(cat => ({
        label: cat.name,
        value: cat.id,
      })),
    ];
  }, [clientCategories]);

  // Get placeholder text for search
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'leads':
        return 'Search leads by client, email, source...';
      case 'events':
        return 'Search events by name, client, venue...';
      case 'clients':
        return 'Search clients by name, email, contact...';
      case 'venues':
        return 'Search venues by name, location, type...';
      default:
        return 'Search...';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedStatus !== 'all' || 
    (selectedCategory !== undefined);

  // Clear all filters
  const handleClearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange?.(undefined);
  };

  const StatusFilterButton: React.FC<{ option: { label: string; value: string } }> = ({ option }) => (
    <Pressable
      style={[
        styles.filterOption,
        {
          backgroundColor: selectedStatus === option.value ? theme.primary : theme.surface,
          borderColor: selectedStatus === option.value ? theme.primary : theme.border,
        }
      ]}
      onPress={() => onStatusChange(option.value)}
    >
      <Text style={[
        styles.filterOptionText,
        {
          color: selectedStatus === option.value ? theme.textInverse : theme.text,
        }
      ]}>
        {option.label}
      </Text>
    </Pressable>
  );

  const CategoryFilterButton: React.FC<{ option: { label: string; value: number | undefined } }> = ({ option }) => (
    <Pressable
      style={[
        styles.filterOption,
        {
          backgroundColor: selectedCategory === option.value ? theme.primary : theme.surface,
          borderColor: selectedCategory === option.value ? theme.primary : theme.border,
        }
      ]}
      onPress={() => onCategoryChange?.(option.value)}
    >
      <Text style={[
        styles.filterOptionText,
        {
          color: selectedCategory === option.value ? theme.textInverse : theme.text,
        }
      ]}>
        {option.label}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { marginHorizontal: spacing[4] }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={getSearchPlaceholder()}
          style={[styles.searchBar, { backgroundColor: theme.surface }]}
        />
        
        {/* Filter Button */}
        <ActionButton
          icon="filter-outline"
          onPress={() => setFilterModalVisible(true)}
          variant={hasActiveFilters ? 'primary' : 'secondary'}
          size="md"
          style={[styles.filterButton, { backgroundColor: theme.surface }]}
          accessibilityLabel="Open filters"
        />
      </View>

      {/* Quick Status Filters (visible for leads and events) */}
      {(activeTab === 'leads' || activeTab === 'events') && (
        <View style={[styles.quickFilters, { marginHorizontal: spacing[4], marginTop: spacing[2] }]}>
          <View style={styles.quickFiltersRow}>
            {getStatusOptions().map((option) => (
              <StatusFilterButton key={option.value} option={option} />
            ))}
          </View>
        </View>
      )}

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <View style={[styles.activeFilters, { 
          marginHorizontal: spacing[4], 
          marginTop: spacing[2],
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.activeFiltersText, { color: theme.textSecondary }]}>
            Filters applied
          </Text>
          <ActionButton
            icon="close-outline"
            onPress={handleClearFilters}
            variant="ghost"
            size="sm"
            accessibilityLabel="Clear all filters"
          />
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { 
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Filter {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Text>
            <ActionButton
              icon="close-outline"
              onPress={() => setFilterModalVisible(false)}
              variant="ghost"
              size="md"
            />
          </View>

          {/* Modal Content */}
          <View style={[styles.modalContent, { padding: spacing[4] }]}>
            
            {/* Status Filter Section */}
            {(activeTab === 'leads' || activeTab === 'events') && (
              <View style={[styles.filterSection, { marginBottom: spacing[6] }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing[3] }]}>
                  Status
                </Text>
                <View style={styles.filterGrid}>
                  {getStatusOptions().map((option) => (
                    <StatusFilterButton key={option.value} option={option} />
                  ))}
                </View>
              </View>
            )}

            {/* Category Filter Section (for clients) */}
            {activeTab === 'clients' && onCategoryChange && (
              <View style={[styles.filterSection, { marginBottom: spacing[6] }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing[3] }]}>
                  Client Category
                </Text>
                <View style={styles.filterGrid}>
                  {getCategoryOptions().map((option) => (
                    <CategoryFilterButton key={option.value || 'all'} option={option} />
                  ))}
                </View>
              </View>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <View style={[styles.clearSection, { marginTop: spacing[6] }]}>
                <PrimaryButton
                  title="Clear All Filters"
                  onPress={() => {
                    handleClearFilters();
                    setFilterModalVisible(false);
                  }}
                  variant="secondary"
                  icon="refresh-outline"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    // backgroundColor handled dynamically
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designSystem.spacing[2],
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    // backgroundColor handled dynamically
  },
  quickFilters: {
    // margins handled dynamically
  },
  quickFiltersRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: designSystem.spacing[2],
  },
  activeFilters: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: designSystem.spacing[3],
    paddingVertical: designSystem.spacing[2],
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
  },
  activeFiltersText: {
    fontSize: designSystem.typography.sizes.sm,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: designSystem.spacing[4],
    paddingVertical: designSystem.spacing[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: designSystem.typography.sizes.xl,
    fontWeight: designSystem.typography.weights.semibold,
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    // marginBottom handled dynamically
  },
  sectionTitle: {
    fontSize: designSystem.typography.sizes.lg,
    fontWeight: designSystem.typography.weights.medium,
  },
  filterGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: designSystem.spacing[2],
  },
  filterOption: {
    paddingHorizontal: designSystem.spacing[4],
    paddingVertical: designSystem.spacing[2],
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: designSystem.typography.weights.medium,
  },
  clearSection: {
    // marginTop handled dynamically
  },
} as const;

export default EventsFilters;