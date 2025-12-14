/**
 * Add/Edit Expense Screen - Refactored per User Specifications
 * Event Expense (linked to event) vs Company Expense (not linked)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, Image, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { Select } from '@/components/core/Select';
import { Button } from '@/components/core/Button';
import { DatePicker } from '@/components/core/DatePicker';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import {
  useExpense,
  useCreateExpense,
  useUpdateExpense,
  useVendors
} from '@/hooks/useFinanceQueries';
import { useEvents } from '@/hooks/useEventsQueries';
import FinanceService from '@/services/finance.service';
import type { Vendor } from '@/types/finance';
import type { SelectOption } from '@/components/core/Select';

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Not Paid', value: 'not_paid' },
  { label: 'Partial Paid', value: 'partial_paid' },
];

const PAYMENT_MODE_OPTIONS: SelectOption[] = [
  { label: 'Cash', value: 'Cash' },
  { label: 'GPay', value: 'Gpay' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Cheque', value: 'Cheque' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Other', value: 'Other' },
];

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ id?: string; eventId?: string }>();
  const { id, eventId: eventIdParam } = params;
  const { theme } = useTheme();
  const isEditMode = !!id;
  const eventIdFromParam = eventIdParam ? Number(eventIdParam) : null;

  // Fetch data
  const { data: expense, isLoading: expenseLoading } = useExpense(isEditMode ? Number(id) : 0);
  const { data: vendorsData } = useVendors();
  const { data: eventsData } = useEvents();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  // Extract arrays from paginated responses
  const vendors = useMemo(() => {
    if (!vendorsData) return [];
    if (Array.isArray(vendorsData)) return vendorsData;
    return (vendorsData as any)?.results || [];
  }, [vendorsData]);

  const events = useMemo(() => {
    if (!eventsData) return [];
    if (Array.isArray(eventsData)) return eventsData;
    return (eventsData as any)?.results || [];
  }, [eventsData]);

  // Convert to select options
  const vendorOptions = useMemo(() =>
    vendors.map((v: Vendor) => ({ label: v.name, value: String(v.id) })),
    [vendors]
  );

  const eventOptions = useMemo(() =>
    (events as any[]).map((e: any) => ({
      label: `${e.name}${e.client?.name ? ` - ${e.client.name}` : ''}`,
      value: String(e.id)
    })),
    [events]
  );

  // Form state - per user specification
  const [formData, setFormData] = useState({
    event: '', // Optional - if set, it's an Event Expense
    vendor: '', // Required
    expense_date: new Date().toISOString().split('T')[0], // Required
    particulars: '', // Expense For - Required
    amount: '', // Required
    payment_status: 'not_paid' as 'paid' | 'not_paid' | 'partial_paid', // Required
    mode_of_payment: 'Cash', // Required
    payment_made_by: '', // Required
    booked_by: '', // Required
    paid_to: '', // Required
    details: '', // Required
    bill_evidence: 'no' as 'yes' | 'no', // Required
    bill_no: '',
  });

  const [photos, setPhotos] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-select event if eventId param is provided
  useEffect(() => {
    if (eventIdFromParam && !isEditMode && events.length > 0) {
      const event = events.find((e: any) => e.id === eventIdFromParam);
      if (event) {
        updateField('event', String(event.id));
      }
    }
  }, [eventIdFromParam, events, isEditMode]);

  // Load existing expense data
  useEffect(() => {
    if (expense && isEditMode) {
      const eventId = typeof expense.event === 'object' ? expense.event?.id : expense.event;
      const vendorId = typeof expense.vendor === 'object' ? expense.vendor?.id : expense.vendor;

      setFormData({
        event: eventId ? String(eventId) : '',
        vendor: vendorId ? String(vendorId) : '',
        expense_date: expense.expense_date || '',
        particulars: expense.particulars || '',
        amount: String(expense.amount || ''),
        payment_status: expense.payment_status || 'not_paid',
        mode_of_payment: expense.mode_of_payment || 'Cash',
        payment_made_by: expense.payment_made_by || '',
        booked_by: expense.booked_by || '',
        paid_to: expense.paid_to || '',
        details: expense.details || '',
        bill_evidence: expense.bill_evidence || 'no',
        bill_no: expense.bill_no || '',
      });
    }
  }, [expense, isEditMode]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Photo handling
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `expense_photo_${Date.now()}_${index}.jpg`,
        }));
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `expense_photo_${Date.now()}.jpg`,
        };
        setPhotos([...photos, photo]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.vendor) {
      Alert.alert('Error', 'Please select a vendor');
      return;
    }
    if (!formData.expense_date) {
      Alert.alert('Error', 'Please select expense date');
      return;
    }
    if (!formData.particulars.trim()) {
      Alert.alert('Error', 'Please enter what the expense is for');
      return;
    }
    if (!formData.amount.trim() || Number(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!formData.payment_made_by.trim()) {
      Alert.alert('Error', 'Please enter who made the payment');
      return;
    }
    if (!formData.booked_by.trim()) {
      Alert.alert('Error', 'Please enter who booked this expense');
      return;
    }
    if (!formData.paid_to.trim()) {
      Alert.alert('Error', 'Please enter who was paid');
      return;
    }
    if (!formData.details.trim()) {
      Alert.alert('Error', 'Please enter expense details');
      return;
    }
    if (formData.bill_evidence === 'yes' && photos.length === 0) {
      Alert.alert('Error', 'Please upload bill evidence');
      return;
    }

    setLoading(true);

    try {
      const expenseData: any = {
        particulars: formData.particulars,
        details: formData.details,
        amount: Number(formData.amount),
        expense_date: formData.expense_date,
        date: formData.expense_date, // API might need both
        payment_status: formData.payment_status,
        mode_of_payment: formData.mode_of_payment,
        payment_made_by: formData.payment_made_by,
        booked_by: formData.booked_by,
        paid_to: formData.paid_to,
        bill_evidence: formData.bill_evidence,
        vendor: formData.vendor ? Number(formData.vendor) : null,
      };

      // Only include event if selected (Event Expense vs Company Expense)
      if (formData.event) {
        expenseData.event = Number(formData.event);
      }

      let savedExpenseId: number;

      if (isEditMode) {
        await updateExpense.mutateAsync({ id: Number(id), data: expenseData });
        savedExpenseId = Number(id);
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        const result = await createExpense.mutateAsync(expenseData);
        savedExpenseId = result.id;

        // Upload photos if any
        if (photos.length > 0 && result.id) {
          try {
            for (const photo of photos) {
              const photoFile = {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || `expense_photo_${Date.now()}.jpg`,
              } as any;
              await FinanceService.uploadExpensePhoto(result.id, { photo: photoFile });
            }
          } catch (photoError) {
            console.error('Error uploading photos:', photoError);
            Alert.alert('Warning', 'Expense created but some photos failed to upload');
          }
        }

        Alert.alert('Success', 'Expense created successfully');
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (expenseLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
          Loading expense...
        </Text>
      </View>
    );
  }

  // Section Header Component
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={{ gap: 4 }}>
      <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  // Expense Type Indicator
  const isEventExpense = !!formData.event;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={isEditMode ? 'Edit Expense' : 'Add Expense'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Expense Type Indicator */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 8,
          backgroundColor: isEventExpense ? theme.primary + '15' : theme.warning + '15',
          gap: 8,
        }}>
          <Ionicons
            name={isEventExpense ? 'calendar' : 'business'}
            size={20}
            color={isEventExpense ? theme.primary : theme.warning}
          />
          <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text, flex: 1 }}>
            {isEventExpense ? 'Event Expense' : 'Company Expense'}
          </Text>
          <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
            {isEventExpense ? 'Linked to event' : 'Not linked to any event'}
          </Text>
        </View>

        {/* Event Selection (Optional) */}
        <View style={{ gap: 16 }}>
          <SectionHeader
            title="Event (Optional)"
            subtitle="Link to an event for Event Expense, leave empty for Company Expense"
          />
          <Select
            label="Event"
            placeholder="Select event (optional)"
            value={formData.event}
            onChange={(value) => updateField('event', value)}
            options={eventOptions}
            searchable
            clearable
          />
        </View>

        {/* Vendor Selection (Required) */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Vendor Details" />
          <Select
            label="Vendor"
            placeholder="Select vendor"
            value={formData.vendor}
            onChange={(value) => updateField('vendor', value)}
            options={vendorOptions}
            searchable
            required
          />
        </View>

        {/* Expense Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Expense Details" />

          <DatePicker
            label="Expense Date"
            value={formData.expense_date ? new Date(formData.expense_date) : new Date()}
            onChange={(date) => date && updateField('expense_date', date.toISOString().split('T')[0])}
          />

          <Input
            label="Expense For"
            value={formData.particulars}
            onChangeText={(text: string) => updateField('particulars', text)}
            placeholder="e.g., Travel Expenses, Catering, Decorations"
            leftIcon="document-text-outline"
            required
          />

          <Input
            label="Amount"
            value={formData.amount}
            onChangeText={(text: string) => updateField('amount', text)}
            placeholder="0"
            keyboardType="numeric"
            leftIcon="cash-outline"
            required
          />
        </View>

        {/* Payment Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Payment Details" />

          <Select
            label="Payment Status"
            value={formData.payment_status}
            onChange={(value) => updateField('payment_status', value)}
            options={PAYMENT_STATUS_OPTIONS}
            required
          />

          <Select
            label="Mode of Payment"
            value={formData.mode_of_payment}
            onChange={(value) => updateField('mode_of_payment', value)}
            options={PAYMENT_MODE_OPTIONS}
            required
          />

          <Input
            label="Payment Made By"
            value={formData.payment_made_by}
            onChangeText={(text: string) => updateField('payment_made_by', text)}
            placeholder="e.g., John Doe"
            leftIcon="person-outline"
            required
          />

          <Input
            label="Booked By"
            value={formData.booked_by}
            onChangeText={(text: string) => updateField('booked_by', text)}
            placeholder="Who booked this expense"
            leftIcon="person-circle-outline"
            required
          />

          <Input
            label="Paid To"
            value={formData.paid_to}
            onChangeText={(text: string) => updateField('paid_to', text)}
            placeholder="Recipient name"
            leftIcon="person-add-outline"
            required
          />
        </View>

        {/* Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Information" />

          <Input
            label="Details"
            value={formData.details}
            onChangeText={(text: string) => updateField('details', text)}
            placeholder="Enter detailed expense description"
            multiline
            leftIcon="reader-outline"
            required
          />
        </View>

        {/* Bill Evidence */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Bill/Evidence" />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => updateField('bill_evidence', 'yes')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: formData.bill_evidence === 'yes' ? theme.primary : theme.border,
                backgroundColor: formData.bill_evidence === 'yes' ? theme.primary + '15' : theme.surface,
                gap: 8,
              }}
            >
              <Ionicons
                name={formData.bill_evidence === 'yes' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.bill_evidence === 'yes' ? theme.primary : theme.textSecondary}
              />
              <Text style={{
                ...getTypographyStyle('sm', formData.bill_evidence === 'yes' ? 'semibold' : 'regular'),
                color: formData.bill_evidence === 'yes' ? theme.primary : theme.text
              }}>
                Yes, I have evidence
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateField('bill_evidence', 'no')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 14,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: formData.bill_evidence === 'no' ? theme.warning : theme.border,
                backgroundColor: formData.bill_evidence === 'no' ? theme.warning + '15' : theme.surface,
                gap: 8,
              }}
            >
              <Ionicons
                name={formData.bill_evidence === 'no' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={formData.bill_evidence === 'no' ? theme.warning : theme.textSecondary}
              />
              <Text style={{
                ...getTypographyStyle('sm', formData.bill_evidence === 'no' ? 'semibold' : 'regular'),
                color: formData.bill_evidence === 'no' ? theme.warning : theme.text
              }}>
                No evidence
              </Text>
            </TouchableOpacity>
          </View>

          {/* Photo Upload - Only show if bill_evidence is Yes */}
          {formData.bill_evidence === 'yes' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  title="Take Photo"
                  onPress={takePhoto}
                  variant="secondary"
                  leftIcon="camera-outline"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Choose Photo"
                  onPress={pickImage}
                  variant="secondary"
                  leftIcon="images-outline"
                  style={{ flex: 1 }}
                />
              </View>

              {photos.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {photos.map((photo, index) => (
                    <View
                      key={index}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => removePhoto(index)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          borderRadius: 12,
                          width: 24,
                          height: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {photos.length > 0 && (
                <View style={{
                  padding: 12,
                  backgroundColor: '#10B98120',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: '#10B981' }}>
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'} added
                  </Text>
                </View>
              )}

              {photos.length === 0 && (
                <View style={{
                  padding: 12,
                  backgroundColor: theme.warning + '15',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Ionicons name="warning" size={20} color={theme.warning} />
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.warning }}>
                    Please upload bill evidence
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <Button
            title={isEditMode ? 'Update Expense' : 'Create Expense'}
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
            leftIcon={isEditMode ? 'checkmark-circle' : 'add-circle'}
          />
        </View>
      </ScrollView>
    </View>
  );
}
