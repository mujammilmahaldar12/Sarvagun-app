import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import eventsService from '@/services/events.service';

export default function AddVenueScreen() {
  const { theme } = useTheme();
  const router = useRouter();

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
    if (!formData.name.trim()) {
      return;
    }
    if (!formData.address.trim()) {
      return;
    }

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

      router.back();
    } catch (error: any) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    required = false,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label} {required && '*'}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 100 : 44,
        }}
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader
        title="Add Venue"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Venue Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Venue Information" />
          <FormInput
            label="Venue Name"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter venue name"
            required
          />
          <FormInput
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter venue address"
            multiline
            required
          />
          <FormInput
            label="Capacity"
            value={formData.capacity}
            onChangeText={(text: string) => updateField('capacity', text)}
            placeholder="Enter maximum capacity"
            keyboardType="numeric"
          />
          <FormInput
            label="Facilities"
            value={formData.facilities}
            onChangeText={(text: string) => updateField('facilities', text)}
            placeholder="E.g., Parking, WiFi, AC, Stage, etc."
            multiline
          />
        </View>

        {/* Contact Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Contact Information" />
          <FormInput
            label="Contact Person"
            value={formData.contactPerson}
            onChangeText={(text: string) => updateField('contactPerson', text)}
            placeholder="Enter contact person name"
          />
          <FormInput
            label="Contact Phone"
            value={formData.contactPhone}
            onChangeText={(text: string) => updateField('contactPhone', text)}
            placeholder="Enter contact phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: loading ? theme.colors.border : (pressed ? theme.colors.primary + 'dd' : theme.colors.primary),
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          })}
        >
          {loading && <ActivityIndicator color="#fff" />}
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Creating...' : 'Create Venue'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
