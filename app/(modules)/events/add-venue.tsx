import React, { useState, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';
import { Button, FormField, FormSection } from '@/components';
import { designSystem } from '@/constants/designSystem';

const { spacing } = designSystem;

export default function AddVenueScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  // Safe back navigation helper
  const safeGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    contactPerson: '',
    contactPhone: '',
    facilities: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) return;
    if (!formData.address.trim()) return;

    setLoading(true);
    try {
      await eventsService.createVenue({
        name: formData.name.trim(),
        address: formData.address.trim(),
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        contact_person: formData.contactPerson.trim() || undefined,
        contact_phone: formData.contactPhone.trim() || undefined,
        facilities: formData.facilities.trim() || undefined,
      });

      safeGoBack();
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title="Add Venue"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <FormSection title="Venue Information">
          <FormField
            label="Venue Name *"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter venue name"
            shape="pill"
          />
          <FormField
            label="Address *"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter venue address"
            multiline
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
    </View>
  );
}
