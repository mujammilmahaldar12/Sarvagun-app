/**
 * Add/Edit Expense Screen - Refactored per User Specifications
 * Matches exact field list provided by user
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { Select } from '@/components/core/Select';
import { Button } from '@/components/core/Button';
import { DatePicker } from '@/components/core/DatePicker';
import { useTheme } from '@/hooks/useTheme';
import { useExpense, useCreateExpense, useUpdateExpense, useVendors } from '@/hooks/useFinanceQueries';
import { useEvents } from '@/hooks/useEventsQueries';
import { getTypographyStyle } from '@/utils/styleHelpers';
import type { Vendor } from '@/types/finance';

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Paid', value: 'paid' },
  { label: 'Not Paid', value: 'not_paid' },
  { label: 'Partial Paid', value: 'partial_paid' },
];

const PAYMENT_MODE_OPTIONS = [
  { label: 'Cash', value: 'Cash' },
  { label: 'GPay', value: 'Gpay' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Cheque', value: 'Cheque' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Other', value: 'Other' },
];

const BILL_EVIDENCE_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; eventId?: string }>();
  const { id, eventId: eventIdParam } = params;
  const { theme } = useTheme();

  const isEditMode = !!id;
  const expenseId = id ? Number(id) : 0;
  const eventIdFromParam = eventIdParam ? Number(eventIdParam) : null;

  // Fetch data
  const { data: expense, isLoading: expenseLoading } = useExpense(expenseId);
  const { data: vendorsData } = useVendors();
  const { data: eventsData } = useEvents();

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();

  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    event: eventIdParam || '', // Required: Event ID
    vendor: '', // Required: Vendor ID
    expense_date: new Date().toISOString().split('T')[0],
    particulars: '', // "Expense For"
    amount: '',
    payment_status: 'not_paid',
    mode_of_payment: 'Cash',
    payment_made_by: '',
    booked_by: '',
    paid_to: '',
    details: '',
    bill_evidence: 'no',
  });

  // Extract vendors and events
  const vendors = useMemo(() => {
    if (!vendorsData) return [];
    return Array.isArray(vendorsData) ? vendorsData : (vendorsData as any)?.results || [];
  }, [vendorsData]);

  const events = useMemo(() => {
    if (!eventsData) return [];
    return Array.isArray(eventsData) ? eventsData : (eventsData as any)?.results || [];
  }, [eventsData]);

  const vendorOptions = useMemo(() =>
    vendors.map((v: Vendor) => ({ label: v.name, value: String(v.id) })),
    [vendors]
  );

  const eventOptions = useMemo(() =>
    (events as any[]).map((e: any) => {
      const clientName = e.client?.name || 'Unknown Client';
      const venueName = e.venue?.name || 'Unknown Venue';
      const label = `${clientName} - ${venueName}`;
      return { label, value: String(e.id) };
    }),
    [events]
  );

  // Load existing data
  useEffect(() => {
    if (isEditMode && expense) {
      setFormData({
        event: typeof expense.event === 'object' ? String(expense.event.id) : String(expense.event || ''),
        vendor: typeof expense.vendor === 'object' ? String(expense.vendor.id) : String(expense.vendor || ''),
        expense_date: expense.expense_date || expense.date || new Date().toISOString().split('T')[0],
        particulars: expense.particulars || '',
        amount: String(expense.amount || ''),
        payment_status: expense.payment_status || 'not_paid',
        mode_of_payment: expense.mode_of_payment || 'Cash',
        payment_made_by: expense.payment_made_by || '',
        booked_by: expense.booked_by || '',
        paid_to: expense.paid_to || '',
        details: expense.details || '',
        bill_evidence: expense.bill_evidence || 'no',
      });
      // Handle photos if available in a specific structure
    } else if (eventIdFromParam && events.length > 0) {
      // Auto select event if param passed
      setFormData(prev => ({ ...prev, event: String(eventIdFromParam) }));
    }
  }, [isEditMode, expense, eventIdFromParam, events]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setPhotos(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.event) { Alert.alert('Error', 'Please select an Event'); return; }
    if (!formData.vendor) { Alert.alert('Error', 'Please select a Vendor'); return; }
    if (!formData.expense_date) { Alert.alert('Error', 'Please select Expense Date'); return; }
    if (!formData.particulars.trim()) { Alert.alert('Error', 'Please enter Expense For'); return; }
    if (!formData.amount || Number(formData.amount) <= 0) { Alert.alert('Error', 'Please enter valid Amount'); return; }
    if (!formData.payment_status) { Alert.alert('Error', 'Please select Payment Status'); return; }
    if (!formData.mode_of_payment) { Alert.alert('Error', 'Please select Payment Mode'); return; }
    if (!formData.payment_made_by.trim()) { Alert.alert('Error', 'Please enter Payment Made By'); return; }
    if (!formData.booked_by.trim()) { Alert.alert('Error', 'Please enter Booked By'); return; }
    if (!formData.paid_to.trim()) { Alert.alert('Error', 'Please enter Paid To'); return; }
    if (!formData.details.trim()) { Alert.alert('Error', 'Please enter Details'); return; }
    if (!formData.bill_evidence) { Alert.alert('Error', 'Please select Bill/Evidence'); return; }

    if (formData.bill_evidence === 'yes' && photos.length === 0 && !isEditMode) {
      Alert.alert('Error', 'Please upload Bill/Evidence'); return;
    }

    setLoading(true);
    try {
      // Logic would go here to upload photos first if needed, 
      // but for now we assume backend handles base64 or separate upload

      const payload: any = {
        event_id: Number(formData.event),  // Backend expects event_id for write
        vendor_id: Number(formData.vendor), // Backend expects vendor_id for write
        expense_date: formData.expense_date,
        date: formData.expense_date, // Sync fields
        particulars: formData.particulars,
        amount: Number(formData.amount),
        payment_status: formData.payment_status,
        mode_of_payment: formData.mode_of_payment,
        payment_made_by: formData.payment_made_by,
        booked_by: formData.booked_by,
        paid_to: formData.paid_to,
        details: formData.details,
        bill_evidence: formData.bill_evidence,
      };

      // Find selected event details for logging
      const selectedEvent = events.find((e: any) => String(e.id) === formData.event);
      console.log('💰 EXPENSE CREATION:', {
        eventId: payload.event,
        eventLabel: selectedEvent ? `${selectedEvent.client?.name || 'Unknown'} - ${selectedEvent.venue?.name || 'Unknown'}` : 'NOT FOUND',
        formDataEvent: formData.event,
        vendor: payload.vendor,
        amount: payload.amount,
      });

      if (isEditMode) {
        await updateExpenseMutation.mutateAsync({ id: expenseId, data: payload });
        console.log('Expense updated successfully');
        router.back();
      } else {
        await createExpenseMutation.mutateAsync(payload);
        console.log('✅ Expense created successfully for event:', payload.event);
        router.back();
      }
    } catch (error: any) {
      console.error('Save Error:', error);
      Alert.alert('Error', error.response?.data?.detail || error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  if (expenseLoading && isEditMode) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title="Edit Expense" showBack showNotifications={false} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title={isEditMode ? 'Edit Expense' : 'Add Expense'} showBack showNotifications={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Select
            label="Event *"
            value={formData.event}
            onChange={(val) => updateField('event', val)}
            options={eventOptions}
            placeholder="Select Event"
            searchable
            required
          />

          <Select
            label="Vendor *"
            value={formData.vendor}
            onChange={(val) => updateField('vendor', val)}
            options={vendorOptions}
            placeholder="Select Vendor"
            searchable
            required
          />

          <DatePicker
            label="Expense Date *"
            value={new Date(formData.expense_date)}
            onChange={(date) => updateField('expense_date', date?.toISOString().split('T')[0])}
          />

          <Input
            label="Expense For *"
            value={formData.particulars}
            onChangeText={(text) => updateField('particulars', text)}
            placeholder="e.g., Travel Expenses"
            required
          />

          <Input
            label="Amount *"
            value={formData.amount}
            onChangeText={(text) => updateField('amount', text ? text.replace(/[^0-9.]/g, '') : '')}
            placeholder="0.00"
            keyboardType="numeric"
            leftIcon="cash-outline"
            required
          />

          <Select
            label="Payment Status *"
            value={formData.payment_status}
            onChange={(val) => updateField('payment_status', val)}
            options={PAYMENT_STATUS_OPTIONS}
            required
          />

          <Select
            label="Mode of Payment *"
            value={formData.mode_of_payment}
            onChange={(val) => updateField('mode_of_payment', val)}
            options={PAYMENT_MODE_OPTIONS}
            required
          />

          <Input
            label="Payment Made By *"
            value={formData.payment_made_by}
            onChangeText={(text) => updateField('payment_made_by', text)}
            placeholder="e.g., John Doe"
            required
          />

          <Input
            label="Booked By *"
            value={formData.booked_by}
            onChangeText={(text) => updateField('booked_by', text)}
            placeholder="Name of person who booked"
            required
          />

          <Input
            label="Paid To *"
            value={formData.paid_to}
            onChangeText={(text) => updateField('paid_to', text)}
            placeholder="Name of receiver"
            required
          />

          <Input
            label="Details *"
            value={formData.details}
            onChangeText={(text) => updateField('details', text)}
            placeholder="Enter expense details"
            multiline
            required
          />

          <Select
            label="Bill/Evidence *"
            value={formData.bill_evidence}
            onChange={(val) => updateField('bill_evidence', val)}
            options={BILL_EVIDENCE_OPTIONS}
            required
          />

          {formData.bill_evidence === 'yes' && (
            <View>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text, marginBottom: 8 }}>
                Upload Evidence
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {photos.map((photo, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image source={{ uri: photo.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    <Pressable
                      onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                      style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'white', borderRadius: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.error} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={handleImagePick}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
            </View>
          )}

          <Button
            title={isEditMode ? 'Update Expense' : 'Create Expense'}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 24, marginBottom: 40 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
