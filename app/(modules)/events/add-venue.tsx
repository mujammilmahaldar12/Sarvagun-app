import React, { useState } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';
import { Button, FormField, FormSection } from '@/components';
import { designSystem } from '@/constants/designSystem';

const { spacing } = designSystem;

export default function AddVenueScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    // Structured address fields (combined into 'address' on submit)
    addressStreet: '',
    addressLandmark: '',
    addressPincode: '',
    capacity: '',
    contactPerson: '',
    contactPhone: '',
    facilities: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation with user feedback
    if (!formData.name.trim()) {
      return Alert.alert('Error', 'Please enter venue name');
    }
    if (!formData.addressStreet.trim()) {
      return Alert.alert('Error', 'Please enter venue address (Street/Area)');
    }

    // Prevent double submission
    if (loading) return;

    setLoading(true);

    // Dismiss keyboard before API call
    Keyboard.dismiss();

    try {
      // Combine structured address into single string (delimiter: |||)
      const combinedAddress = [
        formData.addressStreet,
        formData.addressLandmark,
        formData.addressPincode
      ].filter(Boolean).join('|||');

      const result = await eventsService.createVenue({
        name: formData.name.trim(),
        address: combinedAddress,
        // Backend requires capacity - send 0 if empty, otherwise parse the number
        capacity: formData.capacity && formData.capacity.trim()
          ? Number(formData.capacity)
          : 0,
        contact_person: formData.contactPerson.trim() || undefined,
        contact_phone: formData.contactPhone.trim() || undefined,
        facilities: formData.facilities.trim() || undefined,
      });

      console.log('✅ Venue created successfully:', result);

      // Navigate back immediately on success
      router.back();
    } catch (error: any) {
      console.error('❌ Venue creation error:', error);
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to create venue');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Add Venue"
        showBack
        showNotifications={false}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection title="Venue Information">
            <FormField
              label="Venue Name *"
              value={formData.name}
              onChangeText={(text: string) => updateField('name', text)}
              placeholder="Enter venue name"
              shape="pill"
            />
            <FormField
              label="Street / Area *"
              value={formData.addressStreet}
              onChangeText={(text: string) => updateField('addressStreet', text)}
              placeholder="Enter street, area or locality"
              shape="pill"
            />
            <FormField
              label="Landmark / City"
              value={formData.addressLandmark}
              onChangeText={(text: string) => updateField('addressLandmark', text)}
              placeholder="Enter landmark or city"
              shape="pill"
            />
            <FormField
              label="Pincode"
              value={formData.addressPincode}
              onChangeText={(text: string) => updateField('addressPincode', text)}
              placeholder="Enter pincode"
              keyboardType="numeric"
              shape="pill"
            />
            <FormField
              label="Capacity"
              value={formData.capacity}
              onChangeText={(text: string) => updateField('capacity', text)}
              placeholder="Enter maximum capacity"
              keyboardType="numeric"
              shape="pill"
            />
            <FormField
              label="Facilities"
              value={formData.facilities}
              onChangeText={(text: string) => updateField('facilities', text)}
              placeholder="E.g., Parking, WiFi, AC, Stage, etc."
              multiline
            />
          </FormSection>

          <FormSection title="Contact Information">
            <FormField
              label="Contact Person"
              value={formData.contactPerson}
              onChangeText={(text: string) => updateField('contactPerson', text)}
              placeholder="Enter contact person name"
              shape="pill"
            />
            <FormField
              label="Contact Phone"
              value={formData.contactPhone}
              onChangeText={(text: string) => updateField('contactPhone', text)}
              placeholder="Enter contact phone number"
              keyboardType="phone-pad"
              shape="pill"
            />
          </FormSection>

          <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
            <Button
              title={loading ? 'Creating...' : 'Create Venue'}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              fullWidth
              shape="pill"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

