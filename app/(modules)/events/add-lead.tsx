import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const LEAD_SOURCES = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'Other'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Other'];
const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function AddLeadScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    source: '',
    industry: '',
    employeeCount: '',
    address: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.companyName.trim()) {
      Alert.alert('Error', 'Please enter company name');
      return;
    }
    if (!formData.contactPerson.trim()) {
      Alert.alert('Error', 'Please enter contact person name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }

    // Submit logic here
    console.log('Submitting lead:', formData);
    Alert.alert('Success', 'Lead added successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label}
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

  const SelectInput = ({ label, value, options, onSelect }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option: string) => (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: value === option ? theme.colors.primary : theme.colors.border,
              backgroundColor: pressed
                ? theme.colors.primary + '10'
                : value === option
                ? theme.colors.primary + '20'
                : theme.colors.surface,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                color: value === option ? theme.colors.primary : theme.colors.text,
                fontWeight: value === option ? '600' : 'normal',
              }}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
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
        title="Add Lead"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Company Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Company Information" />
          <FormInput
            label="Company Name *"
            value={formData.companyName}
            onChangeText={(text: string) => updateField('companyName', text)}
            placeholder="Enter company name"
          />
          <SelectInput
            label="Industry"
            value={formData.industry}
            options={INDUSTRIES}
            onSelect={(value: string) => updateField('industry', value)}
          />
          <SelectInput
            label="Employee Count"
            value={formData.employeeCount}
            options={EMPLOYEE_COUNTS}
            onSelect={(value: string) => updateField('employeeCount', value)}
          />
          <FormInput
            label="Address"
            value={formData.address}
            onChangeText={(text: string) => updateField('address', text)}
            placeholder="Enter company address"
            multiline
          />
        </View>

        {/* Contact Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Contact Information" />
          <FormInput
            label="Contact Person *"
            value={formData.contactPerson}
            onChangeText={(text: string) => updateField('contactPerson', text)}
            placeholder="Enter contact person name"
          />
          <FormInput
            label="Phone *"
            value={formData.phone}
            onChangeText={(text: string) => updateField('phone', text)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          <FormInput
            label="Email *"
            value={formData.email}
            onChangeText={(text: string) => updateField('email', text)}
            placeholder="Enter email address"
            keyboardType="email-address"
          />
        </View>

        {/* Lead Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Lead Details" />
          <SelectInput
            label="Source"
            value={formData.source}
            options={LEAD_SOURCES}
            onSelect={(value: string) => updateField('source', value)}
          />
          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes"
            multiline
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => ({
            backgroundColor: pressed ? theme.colors.primary + 'dd' : theme.colors.primary,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 20,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Add Lead
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
