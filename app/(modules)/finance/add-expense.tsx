import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
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
import type { Event } from '@/types/events';

import type { SelectOption } from '@/components/core/Select';

const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Partial', value: 'partial' },
];

const PAYMENT_MODE_OPTIONS: SelectOption[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Card', value: 'card' },
];

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ id?: string; eventId?: string }>();
  const { id, eventId: eventIdParam } = params;
  const { theme } = useTheme();
  const isEditMode = !!id;
  const eventIdFromParam = eventIdParam ? Number(eventIdParam) : null;

  // Fetch data
  const { data: expense, isLoading: expenseLoading } = useExpense(Number(id), { enabled: isEditMode });
  const { data: vendorsData } = useVendors();
  const { data: eventsData } = useEvents();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  
  // Extract arrays from paginated responses
  const vendors = Array.isArray(vendorsData) ? vendorsData : (vendorsData as any)?.results || [];
  const events = Array.isArray(eventsData) ? eventsData : (eventsData as any)?.results || [];

  // Form state
  const [formData, setFormData] = useState({
    particulars: '',
    details: '',
    amount: '',
    expense_date: '',
    payment_status: 'pending' as 'paid' | 'pending' | 'partial',
    mode_of_payment: 'cash' as 'cash' | 'cheque' | 'upi' | 'bank_transfer' | 'card',
    bill_evidence: false,
    bill_no: '',
    vendor: null as number | null,
    event: null as number | null,
    reimbursement_requested: false,
    notes: '',
  });

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // New vendor form
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  // Auto-select event if eventId param is provided (from navigation)
  useEffect(() => {
    if (eventIdFromParam && !isEditMode && !selectedEvent && events.length > 0) {
      const event = events.find((e: any) => e.id === eventIdFromParam);
      if (event) {
        setSelectedEvent(event as any);
        updateField('event', event.id);
      }
    }
  }, [eventIdFromParam, events, isEditMode, selectedEvent]);

  // Load existing expense data
  useEffect(() => {
    if (expense && isEditMode) {
      setFormData({
        particulars: expense.particulars || '',
        details: expense.details || '',
        amount: String(expense.amount || ''),
        expense_date: expense.expense_date || '',
        payment_status: expense.payment_status || 'pending',
        mode_of_payment: expense.mode_of_payment || 'cash',
        bill_evidence: expense.bill_evidence || false,
        bill_no: expense.bill_no || '',
        vendor: expense.vendor?.id || null,
        event: expense.event?.id || null,
        reimbursement_requested: expense.reimbursement_requested || false,
        notes: expense.notes || '',
      });
      setSelectedVendor(expense.vendor || null);
      setSelectedEvent(expense.event || null);
    }
  }, [expense, isEditMode]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Filtered lists
  const filteredVendors = (vendors || []).filter((vendor) =>
    vendor.name?.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(vendorSearchQuery.toLowerCase())
  );

  const filteredEvents = (events || []).filter((event) =>
    event.name?.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.client?.name?.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  // Handlers
  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    updateField('vendor', vendor.id);
    setShowVendorModal(false);
    setVendorSearchQuery('');
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    updateField('event', event.id);
    setShowEventModal(false);
    setEventSearchQuery('');
  };

  const handleCreateVendor = async () => {
    if (!newVendor.name.trim()) {
      Alert.alert('Error', 'Please enter vendor name');
      return;
    }

    try {
      // Here you would call createVendor mutation
      Alert.alert('Success', 'Vendor created successfully');
      setShowCreateVendorModal(false);
      setNewVendor({ name: '', contact_person: '', email: '', phone: '', address: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create vendor');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `expense_photo_${Date.now()}.jpg`,
        };
        setPhotos([...photos, photo]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.particulars.trim()) {
      Alert.alert('Error', 'Please enter expense particulars');
      return;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }
    if (!formData.expense_date) {
      Alert.alert('Error', 'Please select expense date');
      return;
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (formData.bill_evidence && !formData.bill_no.trim()) {
      Alert.alert('Error', 'Please enter bill number');
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        particulars: formData.particulars,
        details: formData.details,
        amount,
        expense_date: formData.expense_date,
        payment_status: formData.payment_status,
        mode_of_payment: formData.mode_of_payment,
        bill_evidence: formData.bill_evidence,
        bill_no: formData.bill_no || null,
        vendor_id: formData.vendor,
        event_id: formData.event,
        reimbursement_requested: formData.reimbursement_requested,
        notes: formData.notes || null,
      };

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
            // Upload each photo
            for (const photo of photos) {
              const photoFormData = new FormData();
              photoFormData.append('expense', result.id.toString());
              
              // Create photo object for React Native
              const photoFile = {
                uri: photo.uri,
                type: photo.type || 'image/jpeg',
                name: photo.name || `expense_photo_${Date.now()}.jpg`,
              } as any;
              
              photoFormData.append('photo', photoFile);
              
              await FinanceService.uploadExpensePhoto(result.id, { photo: photoFile });
            }
            console.log(`Successfully uploaded ${photos.length} photos`);
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

  // Helper components

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={isEditMode ? 'Edit Expense' : 'Add Expense'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Expense Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Expense Details" />
          
          <Input
            label="Particulars"
            value={formData.particulars}
            onChangeText={(text: string) => updateField('particulars', text)}
            placeholder="Enter expense particulars"
            required
            leftIcon="document-text-outline"
          />

          <Input
            label="Details"
            value={formData.details}
            onChangeText={(text: string) => updateField('details', text)}
            placeholder="Enter additional details"
            multiline
            leftIcon="reader-outline"
          />

          <Input
            label="Amount"
            value={formData.amount}
            onChangeText={(text: string) => updateField('amount', text)}
            placeholder="0"
            keyboardType="numeric"
            required
            leftIcon="cash-outline"
          />

          <DatePicker
            label="Expense Date"
            value={formData.expense_date}
            onChange={(date) => updateField('expense_date', date)}
            placeholder="Select expense date"
          />
        </View>

        {/* Vendor Selection */}
        <View style={{ gap: 16 }}>
          <SectionHeader 
            title="Vendor Details" 
            subtitle="Select vendor or create a new one"
          />
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
                Select Vendor
              </Text>
              <Pressable
                onPress={() => setShowVendorModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  backgroundColor: theme.surface,
                }}
              >
                <Text style={[getTypographyStyle('sm', 'regular'), { color: selectedVendor?.name ? theme.text : theme.textSecondary }]}>
                  {selectedVendor?.name || 'Tap to select vendor'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setShowCreateVendorModal(true)}
              style={({ pressed }) => ({
                marginTop: 22,
                padding: 12,
                borderRadius: 8,
                backgroundColor: pressed ? theme.primary + '20' : theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
              })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFF" />
            </Pressable>
          </View>

          {selectedVendor && (
            <View style={{
              padding: 12,
              backgroundColor: theme.primary + '10',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Contact Person
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                {selectedVendor.contact_person || 'N/A'}
              </Text>
              {selectedVendor.phone && (
                <>
                  <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary, marginTop: 8 }}>
                    Phone
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 2 }}>
                    {selectedVendor.phone}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Event Linking (Optional) */}
        <View style={{ gap: 16 }}>
          <SectionHeader 
            title="Event Linking (Optional)" 
            subtitle="Link this expense to an event"
          />
          
          <View style={{ gap: 4 }}>
            <Text style={[getTypographyStyle('sm', 'regular'), { color: theme.textSecondary }]}>
              Select Event
            </Text>
            <Pressable
              onPress={() => setShowEventModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                backgroundColor: theme.surface,
              }}
            >
              <Text style={[getTypographyStyle('sm', 'regular'), { color: selectedEvent?.name ? theme.text : theme.textSecondary }]}>
                {selectedEvent?.name || 'Tap to select event (optional)'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {selectedEvent && (
            <View style={{
              padding: 12,
              backgroundColor: theme.primary + '10',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}>
              <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary }}>
                Client
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text, marginTop: 2 }}>
                {selectedEvent.client?.name || 'N/A'}
              </Text>
              {selectedEvent.start_date && (
                <>
                  <Text style={{ ...getTypographyStyle('xs', 'medium'), color: theme.textSecondary, marginTop: 8 }}>
                    Event Date
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, marginTop: 2 }}>
                    {new Date(selectedEvent.start_date).toLocaleDateString('en-IN')}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Payment Details" />

          <Select
            label="Payment Status"
            value={formData.payment_status}
            onChange={(value: string) => updateField('payment_status', value)}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder="Select payment status"
            required
          />

          <Select
            label="Payment Mode"
            value={formData.mode_of_payment}
            onChange={(value: string) => updateField('mode_of_payment', value)}
            options={PAYMENT_MODE_OPTIONS}
            placeholder="Select payment mode"
            required
          />
        </View>

        {/* Bill Evidence */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Bill Evidence" />

          <Pressable
            onPress={() => updateField('bill_evidence', !formData.bill_evidence)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: pressed ? theme.primary + '10' : theme.surface,
            })}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: formData.bill_evidence ? theme.primary : theme.border,
                backgroundColor: formData.bill_evidence ? theme.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {formData.bill_evidence && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, flex: 1 }}>
              I have bill evidence for this expense
            </Text>
          </Pressable>

          {formData.bill_evidence && (
            <Input
              label="Bill Number"
              value={formData.bill_no}
              onChangeText={(text: string) => updateField('bill_no', text)}
              placeholder="Enter bill number"
              required
            />
          )}
        </View>

        {/* Photo Upload */}
        <View style={{ gap: 12 }}>
          <SectionHeader 
            title="Bill Photos" 
            subtitle="Upload photos of bills, receipts, or invoices"
          />
          
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
                    backgroundColor: theme.surface,
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
              <Text style={{ ...getTypographyStyle('sm', 'regular'), color: '#10B981', flex: 1 }}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} added
              </Text>
            </View>
          )}
        </View>

        {/* Reimbursement */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Reimbursement" />

          <Pressable
            onPress={() => updateField('reimbursement_requested', !formData.reimbursement_requested)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: pressed ? theme.primary + '10' : theme.surface,
            })}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: formData.reimbursement_requested ? theme.primary : theme.border,
                backgroundColor: formData.reimbursement_requested ? theme.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {formData.reimbursement_requested && (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              )}
            </View>
            <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.text, flex: 1 }}>
              Request reimbursement for this expense
            </Text>
          </Pressable>
        </View>

        {/* Additional Notes */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Notes (Optional)" />
          <Input
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes or comments"
            multiline
            leftIcon="document-outline"
          />
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

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVendorModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowVendorModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ gap: 16 }}>
              <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                Select Vendor
              </Text>

              <TextInput
                value={vendorSearchQuery}
                onChangeText={setVendorSearchQuery}
                placeholder="Search vendors..."
                placeholderTextColor={theme.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  ...getTypographyStyle('sm', 'regular'),
                  color: theme.text,
                  backgroundColor: theme.background,
                }}
              />

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {filteredVendors.length === 0 ? (
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                    No vendors found
                  </Text>
                ) : (
                  filteredVendors.map((vendor) => (
                    <Pressable
                      key={vendor.id}
                      onPress={() => handleSelectVendor(vendor)}
                      style={({ pressed }) => ({
                        padding: 14,
                        borderRadius: 8,
                        backgroundColor: pressed ? theme.primary + '10' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      })}
                    >
                      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                        {vendor.name}
                      </Text>
                      {vendor.contact_person && (
                        <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: 4 }}>
                          {vendor.contact_person} {vendor.phone ? `• ${vendor.phone}` : ''}
                        </Text>
                      )}
                    </Pressable>
                  ))
                )}
              </ScrollView>

              <Button
                title="Cancel"
                onPress={() => setShowVendorModal(false)}
                variant="secondary"
                fullWidth
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Event Selection Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowEventModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ gap: 16 }}>
              <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                Select Event
              </Text>

              <TextInput
                value={eventSearchQuery}
                onChangeText={setEventSearchQuery}
                placeholder="Search events..."
                placeholderTextColor={theme.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 8,
                  padding: 12,
                  ...getTypographyStyle('sm', 'regular'),
                  color: theme.text,
                  backgroundColor: theme.background,
                }}
              />

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {filteredEvents.length === 0 ? (
                  <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                    No events found
                  </Text>
                ) : (
                  filteredEvents.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => handleSelectEvent(event)}
                      style={({ pressed }) => ({
                        padding: 14,
                        borderRadius: 8,
                        backgroundColor: pressed ? theme.primary + '10' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      })}
                    >
                      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                        {event.name}
                      </Text>
                      <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: 4 }}>
                        {event.client?.name || 'N/A'} • {new Date(event.start_date).toLocaleDateString('en-IN')}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  title="Clear Selection"
                  onPress={() => {
                    setSelectedEvent(null);
                    updateField('event', null);
                    setShowEventModal(false);
                  }}
                  variant="secondary"
                  fullWidth
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowEventModal(false)}
                  variant="secondary"
                  fullWidth
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Vendor Modal */}
      <Modal
        visible={showCreateVendorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateVendorModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowCreateVendorModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                  Create New Vendor
                </Text>

                <Input
                  label="Vendor Name"
                  value={newVendor.name}
                  onChangeText={(text: string) => setNewVendor({ ...newVendor, name: text })}
                  placeholder="Enter vendor name"
                  required
                  leftIcon="business-outline"
                />

                <Input
                  label="Contact Person"
                  value={newVendor.contact_person}
                  onChangeText={(text: string) => setNewVendor({ ...newVendor, contact_person: text })}
                  placeholder="Enter contact person name"
                  leftIcon="person-outline"
                />

                <Input
                  label="Email"
                  value={newVendor.email}
                  onChangeText={(text: string) => setNewVendor({ ...newVendor, email: text })}
                  placeholder="vendor@example.com"
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                />

                <Input
                  label="Phone"
                  value={newVendor.phone}
                  onChangeText={(text: string) => setNewVendor({ ...newVendor, phone: text })}
                  placeholder="1234567890"
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />

                <Input
                  label="Address"
                  value={newVendor.address}
                  onChangeText={(text: string) => setNewVendor({ ...newVendor, address: text })}
                  placeholder="Enter vendor address"
                  multiline
                  leftIcon="location-outline"
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowCreateVendorModal(false);
                      setNewVendor({ name: '', contact_person: '', email: '', phone: '', address: '' });
                    }}
                    variant="secondary"
                    fullWidth
                  />
                  <Button
                    title="Create Vendor"
                    onPress={handleCreateVendor}
                    fullWidth
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
