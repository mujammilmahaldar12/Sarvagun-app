import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsService from '@/services/events.service';
import { EventActiveDay } from '@/types/events';
import { formatDate, daysBetween } from '@/utils/formatters';
import { MultiDatePicker } from '@/components/core';

/**
 * Manage Active Days Screen
 * Configure multi-day events and active day schedules
 */
export default function ManageActiveDaysScreen() {
  const { eventId, eventName, startDate, endDate } = useLocalSearchParams<{
    eventId: string;
    eventName: string;
    startDate: string;
    endDate: string;
  }>();
  const queryClient = useQueryClient();

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isModified, setIsModified] = useState(false);

  // Fetch event details to get current active days
  const {
    data: event,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEvent(Number(eventId)),
    enabled: !!eventId,
  });

  // Initialize selected dates from event active days
  useEffect(() => {
    if (event?.active_days && event.active_days.length > 0) {
      const dates = event.active_days.map((ad: EventActiveDay) => new Date(ad.date));
      setSelectedDates(dates);
    }
  }, [event]);

  // Update active days mutation
  const updateActiveDaysMutation = useMutation({
    mutationFn: async (dates: Date[]) => {
      const activeDays = dates.map((date) => ({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      }));

      return await eventsService.updateEvent(Number(eventId), {
        active_days: activeDays as any,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Active days updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsModified(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update active days');
    },
  });

  const handleDatesChange = (dates: Date[]) => {
    setSelectedDates(dates);
    setIsModified(true);
  };

  const handleSave = () => {
    if (selectedDates.length === 0) {
      Alert.alert(
        'Confirm',
        'No active days selected. This will clear all active days for this event. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => updateActiveDaysMutation.mutate(selectedDates) },
        ]
      );
      return;
    }

    updateActiveDaysMutation.mutate(selectedDates);
  };

  const handleReset = () => {
    if (event?.active_days) {
      const dates = event.active_days.map((ad: EventActiveDay) => new Date(ad.date));
      setSelectedDates(dates);
      setIsModified(false);
    }
  };

  const generateAllDays = () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Event start and end dates are required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Date[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    setSelectedDates(dates);
    setIsModified(true);
    Alert.alert('Success', `Generated ${dates.length} days from ${formatDate(start)} to ${formatDate(end)}`);
  };

  const clearAllDays = () => {
    Alert.alert('Confirm', 'Clear all selected active days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setSelectedDates([]);
          setIsModified(true);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  const eventStart = startDate ? new Date(startDate) : null;
  const eventEnd = endDate ? new Date(endDate) : null;
  const eventDuration = eventStart && eventEnd ? daysBetween(eventStart, eventEnd) + 1 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manage Active Days</Text>
          <Text style={styles.headerSubtitle}>{eventName || `Event #${eventId}`}</Text>
        </View>
        <View style={styles.headerActions}>
          {isModified && (
            <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
              <Ionicons name="refresh" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Event Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Event Duration</Text>
              <Text style={styles.infoValue}>
                {eventStart && eventEnd
                  ? `${formatDate(eventStart)} - ${formatDate(eventEnd)} (${eventDuration} days)`
                  : 'No dates set'}
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Active Days Selected</Text>
              <Text style={[styles.infoValue, { color: '#10b981', fontWeight: '600' }]}>
                {selectedDates.length} days
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={generateAllDays}
            disabled={!eventStart || !eventEnd}
          >
            <Ionicons name="duplicate-outline" size={20} color="#6366f1" />
            <Text style={styles.quickActionText}>Fill All Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionButtonDanger]}
            onPress={clearAllDays}
            disabled={selectedDates.length === 0}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.quickActionText, styles.quickActionTextDanger]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-Date Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.sectionTitle}>Select Active Days</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which days this event will be active. These days will be used for scheduling and tracking.
          </Text>
          <MultiDatePicker
            selectedDates={selectedDates}
            onChange={handleDatesChange}
            minDate={eventStart || undefined}
            maxDate={eventEnd || undefined}
            placeholder="Tap dates to select"
          />
        </View>

        {/* Selected Dates List */}
        {selectedDates.length > 0 && (
          <View style={styles.selectedDatesContainer}>
            <Text style={styles.sectionTitle}>
              Selected Days ({selectedDates.length})
            </Text>
            <View style={styles.datesList}>
              {selectedDates
                .sort((a, b) => a.getTime() - b.getTime())
                .map((date, index) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dateChip,
                        isWeekend && styles.dateChipWeekend,
                      ]}
                    >
                      <View style={styles.dateChipContent}>
                        <Text style={styles.dateChipDay}>
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </Text>
                        <Text style={styles.dateChipDate}>{formatDate(date)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDates(
                            selectedDates.filter((d) => d.getTime() !== date.getTime())
                          );
                          setIsModified(true);
                        }}
                        style={styles.dateChipRemove}
                      >
                        <Ionicons name="close-circle" size={20} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {selectedDates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No active days selected</Text>
            <Text style={styles.emptyStateSubtext}>
              Use the calendar above to select days when this event will be active
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button (Fixed at bottom) */}
      {isModified && (
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleReset}
            disabled={updateActiveDaysMutation.isPending}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              updateActiveDaysMutation.isPending && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={updateActiveDaysMutation.isPending}
          >
            {updateActiveDaysMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  quickActionButtonDanger: {
    borderColor: '#ef4444',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  quickActionTextDanger: {
    color: '#ef4444',
  },
  pickerContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  selectedDatesContainer: {
    marginTop: 24,
  },
  datesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  dateChipWeekend: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  dateChipContent: {
    gap: 2,
  },
  dateChipDay: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateChipDate: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
  dateChipRemove: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
