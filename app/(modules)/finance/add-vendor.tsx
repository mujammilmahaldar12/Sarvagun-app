import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { designSystem, getTypographyStyle } from '@/constants/designSystem';
import { useVendor, useCreateVendor, useUpdateVendor } from '@/hooks/useFinanceQueries';

export default function AddVendorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useTheme();
  const isEditMode = !!id;

  // Fetch vendor data if editing
  const { data: vendor, isLoading: vendorLoading } = useVendor(Number(id), { enabled: isEditMode });
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    gst_number: '',
    pan_number: '',
    bank_details: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  // Load existing vendor data
  useEffect(() => {
    if (vendor && isEditMode) {
      setFormData({
        name: vendor.name || '',
        contact_person: vendor.contact_person || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        gst_number: vendor.gst_number || '',
        pan_number: vendor.pan_number || '',
        bank_details: vendor.bank_details || '',
        notes: vendor.notes || '',
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

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const vendorData = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        gst_number: formData.gst_number || null,
        pan_number: formData.pan_number || null,
        bank_details: formData.bank_details || null,
        notes: formData.notes || null,
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
      <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 12,
          ...getTypographyStyle('sm', 'regular'),
          color: theme.text,
          backgroundColor: theme.surface,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 100 : 44,
        }}
      />
    </View>
  );

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
          
          <FormInput
            label="Vendor Name"
            value={formData.name}
            onChangeText={(text: string) => updateField('name', text)}
            placeholder="Enter vendor name"
            required
          />

          <FormInput
            label="Contact Person"
            value={formData.contact_person}
            onChangeText={(text: string) => updateField('contact_person', text)}
            placeholder="Enter contact person name"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Email"
                value={formData.email}
                onChangeText={(text: string) => updateField('email', text)}
                placeholder="vendor@example.com"
                keyboardType="email-address"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Phone"
                value={formData.phone}
                onChangeText={(text: string) => updateField('phone', text)}
                placeholder="1234567890"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <FormInput
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter vendor address"
            multiline
          />
        </View>

        {/* Tax Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader 
            title="Tax Information" 
            subtitle="GST and PAN details for invoicing"
          />
          
          <FormInput
            label="GST Number"
            value={formData.gst_number}
            onChangeText={(text: string) => updateField('gst_number', text.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
          />

          <FormInput
            label="PAN Number"
            value={formData.pan_number}
            onChangeText={(text: string) => updateField('pan_number', text.toUpperCase())}
            placeholder="ABCDE1234F"
          />
        </View>

        {/* Banking Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader 
            title="Banking Information (Optional)" 
            subtitle="Bank details for payments"
          />
          
          <FormInput
            label="Bank Details"
            value={formData.bank_details}
            onChangeText={(text: string) => updateField('bank_details', text)}
            placeholder="Enter account number, IFSC, bank name"
            multiline
          />
        </View>

        {/* Additional Notes */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Notes (Optional)" />
          
          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes about the vendor"
            multiline
          />
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <AppButton
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
