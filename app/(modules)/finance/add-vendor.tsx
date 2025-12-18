import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { Select } from '@/components/core/Select';
import { Button } from '@/components/core/Button';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useVendor, useCreateVendor, useUpdateVendor } from '@/hooks/useFinanceQueries';
import type { SelectOption } from '@/components/core/Select';

// Vendor categories matching backend
const VENDOR_CATEGORIES: SelectOption[] = [
  { label: 'Equipment Supplier', value: 'Equipment Supplier' },
  { label: 'Service Provider', value: 'Service Provider' },
  { label: 'Venue Partner', value: 'Venue Partner' },
  { label: 'Catering', value: 'Catering' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Decoration', value: 'Decoration' },
  { label: 'Other', value: 'Other' },
];

export default function AddVendorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const isEditMode = !!id;

  // Fetch vendor data if editing
  const { data: vendor, isLoading: vendorLoading } = useVendor(isEditMode ? Number(id) : 0);
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  // Form state - matching backend schema
  const [formData, setFormData] = useState({
    name: '',
    organization_name: '',
    contact_number: '',
    email: '',
    address: '',
    gstin: '',
    category: 'Equipment Supplier',
    comments: '',
  });

  const [loading, setLoading] = useState(false);

  // Load existing vendor data
  useEffect(() => {
    if (vendor && isEditMode) {
      setFormData({
        name: vendor.name || '',
        organization_name: vendor.organization_name || '',
        contact_number: vendor.contact_number || '',
        email: vendor.email || '',
        address: vendor.address || '',
        gstin: vendor.gstin || '',
        category: vendor.category || 'Equipment Supplier',
        comments: vendor.comments || '',
      });
    }
  }, [vendor, isEditMode]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter vendor name');
      return;
    }

    if (!formData.organization_name.trim()) {
      Alert.alert('Error', 'Please enter organization name');
      return;
    }

    if (!formData.contact_number.trim()) {
      Alert.alert('Error', 'Please enter contact number');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const vendorData = {
        name: formData.name.trim(),
        organization_name: formData.organization_name.trim() || '',
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || '',
        gstin: formData.gstin.trim() || '',
        category: formData.category,
        comments: formData.comments.trim() || '',
      };

      if (isEditMode) {
        await updateVendor.mutateAsync({ id: Number(id), data: vendorData });
        Alert.alert('Success', 'Vendor updated successfully');
      } else {
        await createVendor.mutateAsync(vendorData);
        Alert.alert('Success', 'Vendor created successfully');
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  if (vendorLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
          Loading vendor...
        </Text>
      </View>
    );
  }

  // No longer need custom components - using core components

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
        title={isEditMode ? 'Edit Vendor' : 'Add Vendor'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Basic Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Basic Information" />

          <Input
            label="Vendor Name"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter vendor name"
            required
            leftIcon="business-outline"
          />

          <Input
            label="Organization Name"
            value={formData.organization_name}
            onChangeText={(text: string) => updateField('organization_name', text)}
            placeholder="Enter organization name"
            leftIcon="briefcase-outline"
            required
          />

          <Input
            label="Contact Number"
            value={formData.contact_number}
            onChangeText={(text: string) => updateField('contact_number', text)}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
            required
            leftIcon="call-outline"
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text: string) => updateField('email', text)}
            placeholder="vendor@example.com"
            keyboardType="email-address"
            required
            leftIcon="mail-outline"
          />

          <Input
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter vendor address"
            multiline
            leftIcon="location-outline"
          />
        </View>

        {/* Category */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Category" />
          <Select
            label="Category"
            value={formData.category}
            onChange={(value: string) => updateField('category', value)}
            options={VENDOR_CATEGORIES}
            placeholder="Select category"
            required
          />
        </View>

        {/* Tax Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader
            title="Tax Information"
            subtitle="GST details for invoicing"
          />

          <Input
            label="GST Number"
            value={formData.gstin}
            onChangeText={(text: string) => updateField('gstin', text.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            leftIcon="receipt-outline"
          />
        </View>

        {/* Additional Notes */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Comments (Optional)" />

          <Input
            label="Comments"
            value={formData.comments}
            onChangeText={(text: string) => updateField('comments', text)}
            placeholder="Add any additional comments about the vendor"
            multiline
            leftIcon="chatbox-outline"
          />
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <Button
            title={isEditMode ? 'Update Vendor' : 'Create Vendor'}
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
