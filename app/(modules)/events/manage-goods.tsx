import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import eventsService from '@/services/events.service';
import { useTheme } from '@/hooks/useTheme';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { Table, EmptyState, LoadingState, ActionSheet, StatusBadge } from '@/components';
import type { GoodsList, Event } from '../../../types/events';

export default function ManageGoodsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(id as string, 10);
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoods, setEditingGoods] = useState<GoodsList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedGoods, setSelectedGoods] = useState<GoodsList | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sender: 0,
    receiver: 0,
    venue: 0,
    type_of_event: '',
    event_date: '',
    event_start_at: '',
    event_end_at: '',
    day_of_event: '',
    list_of_good: '',
  });

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEvent(eventId),
    enabled: !!eventId,
  });

  // Fetch goods lists for this event
  const {
    data: goodsLists = [],
    isLoading: goodsLoading,
    error: goodsError,
  } = useQuery({
    queryKey: ['goodsLists', eventId],
    queryFn: () => eventsService.getGoodsLists({ event_id: eventId }),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch users for sender/receiver selection
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // This would need to be implemented in a user service
      // For now, we'll use a placeholder
      return [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Create goods list mutation with optimistic update
  const createGoodsMutation = useMutation({
    mutationFn: (data: any) => eventsService.createGoodsList(data),
    onMutate: async (newGoods) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goodsLists', eventId] });
      
      // Snapshot previous value
      const previousGoodsList = queryClient.getQueryData(['goodsLists', eventId]);
      
      // Optimistically add new goods (with temporary ID)
      queryClient.setQueryData(['goodsLists', eventId], (old: any) => {
        const tempGoods = {
          ...newGoods,
          id: Date.now(), // Temporary ID
          created_at: new Date().toISOString(),
        };
        return Array.isArray(old) ? [...old, tempGoods] : [tempGoods];
      });
      
      return { previousGoodsList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsLists', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Goods list created successfully');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousGoodsList) {
        queryClient.setQueryData(['goodsLists', eventId], context.previousGoodsList);
      }
      Alert.alert('Error', error.message || 'Failed to create goods list');
    },
  });

  // Update goods list mutation with optimistic update
  const updateGoodsMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      eventsService.updateGoodsList(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goodsLists', eventId] });
      
      // Snapshot previous value
      const previousGoodsList = queryClient.getQueryData(['goodsLists', eventId]);
      
      // Optimistically update
      queryClient.setQueryData(['goodsLists', eventId], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((goods: any) =>
          goods.id === id ? { ...goods, ...data } : goods
        );
      });
      
      return { previousGoodsList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsLists', eventId] });
      setShowAddModal(false);
      setEditingGoods(null);
      resetForm();
      Alert.alert('Success', 'Goods list updated successfully');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousGoodsList) {
        queryClient.setQueryData(['goodsLists', eventId], context.previousGoodsList);
      }
      Alert.alert('Error', error.message || 'Failed to update goods list');
    },
  });

  // Delete goods list mutation with optimistic update
  const deleteGoodsMutation = useMutation({
    mutationFn: (id: number) => eventsService.deleteGoodsList(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goodsLists', eventId] });
      
      // Snapshot previous value
      const previousGoodsList = queryClient.getQueryData(['goodsLists', eventId]);
      
      // Optimistically remove
      queryClient.setQueryData(['goodsLists', eventId], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((goods: any) => goods.id !== id);
      });
      
      return { previousGoodsList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsLists', eventId] });
      setShowActionSheet(false);
      setSelectedGoods(null);
      Alert.alert('Success', 'Goods list deleted successfully');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousGoodsList) {
        queryClient.setQueryData(['goodsLists', eventId], context.previousGoodsList);
      }
      Alert.alert('Error', error.message || 'Failed to delete goods list');
    },
  });

  // Filter goods lists by search query
  const filteredGoodsLists = useMemo(() => {
    if (!searchQuery.trim()) return goodsLists;

    const query = searchQuery.toLowerCase();
    return goodsLists.filter(
      (goods) =>
        goods.type_of_event.toLowerCase().includes(query) ||
        goods.list_of_good.toLowerCase().includes(query) ||
        goods.day_of_event.toLowerCase().includes(query)
    );
  }, [goodsLists, searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormData({
      sender: 0,
      receiver: 0,
      venue: event?.venue?.id || 0,
      type_of_event: event?.type_of_event || '',
      event_date: '',
      event_start_at: event?.start_date || '',
      event_end_at: event?.end_date || '',
      day_of_event: '',
      list_of_good: '',
    });
  };

  // Handle edit goods
  const handleEdit = (goods: GoodsList) => {
    setEditingGoods(goods);
    setFormData({
      sender: typeof goods.sender === 'number' ? goods.sender : 0,
      receiver: typeof goods.receiver === 'number' ? goods.receiver : 0,
      venue: typeof goods.venue === 'number' ? goods.venue : 0,
      type_of_event: goods.type_of_event,
      event_date: goods.event_date,
      event_start_at: goods.event_start_at,
      event_end_at: goods.event_end_at,
      day_of_event: goods.day_of_event,
      list_of_good: goods.list_of_good,
    });
    setShowAddModal(true);
  };

  // Handle delete goods
  const handleDelete = (goods: GoodsList) => {
    Alert.alert('Delete Goods List', 'Are you sure you want to delete this goods list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGoodsMutation.mutate(goods.id),
      },
    ]);
  };

  // Handle save goods
  const handleSave = () => {
    // Validation
    if (!formData.sender || !formData.receiver) {
      Alert.alert('Error', 'Please select sender and receiver');
      return;
    }
    if (!formData.event_date || !formData.list_of_good.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const payload = {
      ...formData,
      event: eventId,
      venue: formData.venue || event?.venue?.id || 0,
    };

    if (editingGoods) {
      updateGoodsMutation.mutate({ id: editingGoods.id, data: payload });
    } else {
      createGoodsMutation.mutate(payload);
    }
  };

  if (eventLoading) {
    return <LoadingState message="Loading event details..." variant="spinner" size="large" />;
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Event Not Found"
          subtitle="The event you're looking for doesn't exist"
          action={{
            label: 'Go Back',
            icon: 'arrow-back',
            onPress: () => router.back(),
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Goods Management</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {event.client?.name || 'Event'} - {event.venue?.name || 'Venue'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setEditingGoods(null);
            setShowAddModal(true);
          }}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by type, goods, or day..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Goods List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {goodsLoading ? (
          <LoadingState variant="skeleton" skeletonCount={3} />
        ) : goodsError ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Goods"
            subtitle="Failed to load goods lists. Please try again."
            action={{
              label: 'Retry',
              icon: 'refresh',
              onPress: () => queryClient.invalidateQueries({ queryKey: ['goodsLists', eventId] }),
            }}
          />
        ) : filteredGoodsLists.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title={searchQuery ? 'No Matching Goods' : 'No Goods Lists'}
            subtitle={
              searchQuery
                ? 'Try adjusting your search'
                : 'Add goods lists to track logistics for this event'
            }
            action={
              !searchQuery
                ? {
                    label: 'Add Goods List',
                    icon: 'add-circle',
                    onPress: () => setShowAddModal(true),
                  }
                : undefined
            }
          />
        ) : (
          <View style={styles.goodsListContainer}>
            {filteredGoodsLists.map((goods, index) => (
              <Animated.View
                key={goods.id}
                entering={FadeIn.delay(index * 100)}
                style={[styles.goodsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.goodsCardHeader}>
                  <View style={styles.goodsCardTitleContainer}>
                    <Ionicons name="cube" size={20} color={theme.primary} />
                    <Text style={[styles.goodsCardTitle, { color: theme.text }]}>
                      {goods.type_of_event}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedGoods(goods);
                      setShowActionSheet(true);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.goodsCardBody}>
                  <View style={styles.goodsRow}>
                    <Ionicons name="calendar" size={16} color={theme.textSecondary} />
                    <Text style={[styles.goodsLabel, { color: theme.textSecondary }]}>
                      Event Date:
                    </Text>
                    <Text style={[styles.goodsValue, { color: theme.text }]}>
                      {formatDate(goods.event_date, 'short')}
                    </Text>
                  </View>

                  <View style={styles.goodsRow}>
                    <Ionicons name="time" size={16} color={theme.textSecondary} />
                    <Text style={[styles.goodsLabel, { color: theme.textSecondary }]}>Duration:</Text>
                    <Text style={[styles.goodsValue, { color: theme.text }]}>
                      {formatDate(goods.event_start_at, 'short')} -{' '}
                      {formatDate(goods.event_end_at, 'short')}
                    </Text>
                  </View>

                  <View style={styles.goodsRow}>
                    <Ionicons name="sunny" size={16} color={theme.textSecondary} />
                    <Text style={[styles.goodsLabel, { color: theme.textSecondary }]}>Day:</Text>
                    <Text style={[styles.goodsValue, { color: theme.text }]}>
                      {goods.day_of_event}
                    </Text>
                  </View>

                  <View style={styles.goodsRow}>
                    <Ionicons name="person" size={16} color={theme.textSecondary} />
                    <Text style={[styles.goodsLabel, { color: theme.textSecondary }]}>Sender:</Text>
                    <Text style={[styles.goodsValue, { color: theme.text }]}>
                      {goods.sender_name || `User ${goods.sender}`}
                    </Text>
                  </View>

                  <View style={styles.goodsRow}>
                    <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.goodsLabel, { color: theme.textSecondary }]}>
                      Receiver:
                    </Text>
                    <Text style={[styles.goodsValue, { color: theme.text }]}>
                      {goods.receiver_name || `User ${goods.receiver}`}
                    </Text>
                  </View>

                  <View style={styles.goodsDivider} />

                  <View style={styles.goodsListSection}>
                    <Text style={[styles.goodsListTitle, { color: theme.text }]}>Goods List:</Text>
                    <Text style={[styles.goodsListText, { color: theme.textSecondary }]}>
                      {goods.list_of_good}
                    </Text>
                  </View>
                </View>

                <View style={styles.goodsCardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => handleEdit(goods)}
                  >
                    <Ionicons name="pencil" size={16} color={theme.primary} />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                    onPress={() => handleDelete(goods)}
                  >
                    <Ionicons name="trash" size={16} color={theme.error} />
                    <Text style={[styles.actionButtonText, { color: theme.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingGoods(null);
          resetForm();
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setEditingGoods(null);
                resetForm();
              }}
            >
              <Text style={[styles.modalCancelButton, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingGoods ? 'Edit Goods List' : 'Add Goods List'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={
                createGoodsMutation.isPending || updateGoodsMutation.isPending
              }
            >
              {createGoodsMutation.isPending || updateGoodsMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.modalSaveButton, { color: theme.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Form fields would go here - simplified for space */}
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
              Type of Event *
            </Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter event type"
              placeholderTextColor={theme.textSecondary}
              value={formData.type_of_event}
              onChangeText={(text) => setFormData({ ...formData, type_of_event: text })}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Event Date *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              value={formData.event_date}
              onChangeText={(text) => setFormData({ ...formData, event_date: text })}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Day of Event *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., Day 1, Monday, etc."
              placeholderTextColor={theme.textSecondary}
              value={formData.day_of_event}
              onChangeText={(text) => setFormData({ ...formData, day_of_event: text })}
            />

            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Goods List *</Text>
            <TextInput
              style={[
                styles.formInput,
                styles.formTextArea,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Enter list of goods (one per line)"
              placeholderTextColor={theme.textSecondary}
              value={formData.list_of_good}
              onChangeText={(text) => setFormData({ ...formData, list_of_good: text })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Action Sheet */}
      {selectedGoods && (
        <ActionSheet
          visible={showActionSheet}
          onClose={() => {
            setShowActionSheet(false);
            setSelectedGoods(null);
          }}
          title="Goods List Actions"
          subtitle={selectedGoods.type_of_event}
          actions={[
            {
              label: 'Edit Goods List',
              icon: 'pencil',
              onPress: () => {
                setShowActionSheet(false);
                handleEdit(selectedGoods);
              },
            },
            {
              label: 'Delete Goods List',
              icon: 'trash',
              onPress: () => {
                setShowActionSheet(false);
                handleDelete(selectedGoods);
              },
              destructive: true,
            },
          ]}
        />
      )}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  goodsListContainer: {
    padding: 16,
  },
  goodsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  goodsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goodsCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goodsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goodsCardBody: {
    gap: 8,
  },
  goodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goodsLabel: {
    fontSize: 14,
  },
  goodsValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  goodsDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  goodsListSection: {
    marginTop: 4,
  },
  goodsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  goodsListText: {
    fontSize: 14,
    lineHeight: 20,
  },
  goodsCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  modalCancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  formTextArea: {
    height: 120,
    paddingVertical: 12,
  },
});

