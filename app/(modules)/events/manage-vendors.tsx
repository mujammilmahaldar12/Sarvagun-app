import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventsService from '@/services/events.service';
import financeService from '@/services/finance.service';
import { Vendor, EventVendor } from '@/types/events';
import { formatCurrency, formatDate } from '@/utils/formatters';

/**
 * Manage Vendors Screen
 * Assign/manage vendors for a specific event
 */
export default function ManageVendorsScreen() {
  const { eventId, eventName } = useLocalSearchParams<{ eventId: string; eventName: string }>();
  const queryClient = useQueryClient();
  
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [billValue, setBillValue] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVendor, setEditingVendor] = useState<EventVendor | null>(null);

  // Fetch assigned vendors for this event
  const {
    data: assignedVendors = [],
    isLoading: loadingAssigned,
    refetch: refetchAssigned,
  } = useQuery({
    queryKey: ['event-vendors', eventId],
    queryFn: () => eventsService.getEventVendors(Number(eventId)),
    enabled: !!eventId,
  });

  // Fetch all available vendors
  const {
    data: allVendors = [],
    isLoading: loadingVendors,
  } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => financeService.getVendors(),
  });

  // Filter vendors based on search
  const filteredVendors = allVendors.filter((vendor: Vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Assign vendor mutation
  const assignVendorMutation = useMutation({
    mutationFn: (data: { vendor_id: number; bill_value: number; completion_date: string }) =>
      eventsService.assignVendorToEvent(Number(eventId), data),
    onSuccess: () => {
      Alert.alert('Success', 'Vendor assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['event-vendors', eventId] });
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign vendor');
    },
  });

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: number; data: Partial<EventVendor> }) =>
      eventsService.updateEventVendor(Number(eventId), vendorId, data),
    onSuccess: () => {
      Alert.alert('Success', 'Vendor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event-vendors', eventId] });
      setEditingVendor(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update vendor');
    },
  });

  // Remove vendor mutation
  const removeVendorMutation = useMutation({
    mutationFn: (vendorId: number) =>
      eventsService.removeVendorFromEvent(Number(eventId), vendorId),
    onSuccess: () => {
      Alert.alert('Success', 'Vendor removed successfully');
      queryClient.invalidateQueries({ queryKey: ['event-vendors', eventId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove vendor');
    },
  });

  const handleAssignVendor = () => {
    if (!selectedVendor || !billValue || !completionDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    assignVendorMutation.mutate({
      vendor_id: selectedVendor,
      bill_value: parseFloat(billValue),
      completion_date: completionDate,
    });
  };

  const handleUpdateVendor = () => {
    if (!editingVendor || !billValue) {
      Alert.alert('Error', 'Please enter bill value');
      return;
    }

    updateVendorMutation.mutate({
      vendorId: typeof editingVendor.vendor === 'number' ? editingVendor.vendor : editingVendor.vendor.id,
      data: {
        bill_value: parseFloat(billValue),
        completion_date: completionDate || editingVendor.completion_date,
      },
    });
  };

  const handleRemoveVendor = (vendorId: number) => {
    Alert.alert(
      'Confirm Remove',
      'Are you sure you want to remove this vendor from the event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeVendorMutation.mutate(vendorId),
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedVendor(null);
    setBillValue('');
    setCompletionDate('');
    setShowAddVendor(false);
    setEditingVendor(null);
    setSearchQuery('');
  };

  const startEdit = (eventVendor: EventVendor) => {
    setEditingVendor(eventVendor);
    setBillValue(eventVendor.bill_value.toString());
    setCompletionDate(eventVendor.completion_date);
    setShowAddVendor(true);
  };

  if (loadingAssigned || loadingVendors) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading vendors...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manage Vendors</Text>
          <Text style={styles.headerSubtitle}>{eventName || `Event #${eventId}`}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddVendor(!showAddVendor)}
          style={styles.addButton}
        >
          <Ionicons name={showAddVendor ? "close" : "add"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loadingAssigned} onRefresh={refetchAssigned} />
        }
      >
        {/* Add/Edit Vendor Form */}
        {showAddVendor && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {editingVendor ? 'Edit Vendor' : 'Assign New Vendor'}
            </Text>

            {/* Vendor Selection */}
            {!editingVendor && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Vendor *</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={styles.vendorList} nestedScrollEnabled>
                  {filteredVendors.map((vendor: Vendor) => (
                    <TouchableOpacity
                      key={vendor.id}
                      style={[
                        styles.vendorItem,
                        selectedVendor === vendor.id && styles.vendorItemSelected,
                      ]}
                      onPress={() => setSelectedVendor(vendor.id)}
                    >
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>{vendor.name}</Text>
                        <Text style={styles.vendorOrg}>{vendor.organization_name}</Text>
                        <Text style={styles.vendorCategory}>{vendor.category}</Text>
                      </View>
                      {selectedVendor === vendor.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Bill Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bill Value (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bill amount"
                value={billValue}
                onChangeText={setBillValue}
                keyboardType="numeric"
              />
            </View>

            {/* Completion Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Completion Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={completionDate}
                onChangeText={setCompletionDate}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (assignVendorMutation.isPending || updateVendorMutation.isPending) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={editingVendor ? handleUpdateVendor : handleAssignVendor}
                disabled={assignVendorMutation.isPending || updateVendorMutation.isPending}
              >
                {(assignVendorMutation.isPending || updateVendorMutation.isPending) ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingVendor ? 'Update' : 'Assign'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Assigned Vendors List */}
        <View style={styles.assignedContainer}>
          <Text style={styles.sectionTitle}>
            Assigned Vendors ({assignedVendors.length})
          </Text>

          {assignedVendors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No vendors assigned yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to assign vendors to this event
              </Text>
            </View>
          ) : (
            assignedVendors.map((eventVendor: EventVendor) => {
              const vendor = typeof eventVendor.vendor === 'object' 
                ? eventVendor.vendor 
                : eventVendor.vendor_details;
              
              if (!vendor) return null;

              return (
                <View key={eventVendor.id} style={styles.vendorCard}>
                  <View style={styles.vendorCardHeader}>
                    <View style={styles.vendorCardInfo}>
                      <Text style={styles.vendorCardName}>{vendor.name}</Text>
                      <Text style={styles.vendorCardOrg}>{vendor.organization_name}</Text>
                      <Text style={styles.vendorCardCategory}>{vendor.category}</Text>
                    </View>
                    <View style={styles.vendorCardActions}>
                      <TouchableOpacity
                        onPress={() => startEdit(eventVendor)}
                        style={styles.iconButton}
                      >
                        <Ionicons name="create-outline" size={20} color="#6366f1" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveVendor(
                          typeof eventVendor.vendor === 'number' ? eventVendor.vendor : eventVendor.vendor.id
                        )}
                        style={styles.iconButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.vendorCardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bill Value:</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(eventVendor.bill_value)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Completion Date:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(eventVendor.completion_date)}
                      </Text>
                    </View>
                    {eventVendor.work_assigned_name && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Assigned To:</Text>
                        <Text style={styles.detailValue}>
                          {eventVendor.work_assigned_name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  vendorList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  vendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  vendorItemSelected: {
    backgroundColor: '#eff6ff',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  vendorOrg: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  vendorCategory: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  assignedContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vendorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorCardInfo: {
    flex: 1,
  },
  vendorCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  vendorCardOrg: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  vendorCardCategory: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  vendorCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  vendorCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
});
