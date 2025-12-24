import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import hrService from '@/services/hr.service';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    department: '',
    joinDate: new Date().toISOString().split('T')[0],
    address: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.email || !formData.designation || !formData.password) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Name, Email, Password, Designation)');
      return;
    }

    setLoading(true);
    try {
      // Prepare payload for backend
      const payload: any = {
        username: formData.email, // Use email as username
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        designation: formData.designation,
        department: formData.department,
        mobileno: formData.phone,
        address: formData.address,
        joiningdate: formData.joinDate,
        category: 'employee', // Default to employee
      };

      console.log('Creating employee with payload:', payload);

      await hrService.createEmployee(payload);

      setLoading(false);
      Alert.alert('Success', 'Employee added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      setLoading(false);
      console.error('Error adding employee:', error);
      const errorMessage = error.response?.data ?
        (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data)
        : 'Failed to add employee. Please check details and try again.';

      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Add Employee" showNotifications={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <SectionHeader title="Personal Information" theme={theme} />

          <FormInput
            label="First Name *"
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            placeholder="Enter first name"
            theme={theme}
          />

          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChangeText={(text) => updateField('lastName', text)}
            placeholder="Enter last name"
            theme={theme}
          />

          <FormInput
            label="Email *"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            theme={theme}
          />

          <FormInput
            label="Password *"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            placeholder="Set initial password"
            theme={theme}
          // secureTextEntry // TODO: Add prop to FormInput if supported, or just text for admin
          />

          <FormInput
            label="Phone"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            theme={theme}
          />

          <FormInput
            label="Address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="Enter complete address"
            multiline
            numberOfLines={3}
            theme={theme}
          />

          {/* Employment Details */}
          <SectionHeader title="Employment Details" theme={theme} />

          <FormInput
            label="Designation *"
            value={formData.designation}
            onChangeText={(text) => updateField('designation', text)}
            placeholder="e.g., Senior Developer"
            theme={theme}
          />

          <FormInput
            label="Department"
            value={formData.department}
            onChangeText={(text) => updateField('department', text)}
            placeholder="e.g., IT"
            theme={theme}
          />

          <FormInput
            label="Join Date"
            value={formData.joinDate}
            onChangeText={(text) => updateField('joinDate', text)}
            placeholder="YYYY-MM-DD"
            theme={theme}
          />



          {/* Submit Button */}
          <View style={{ marginTop: 24, marginBottom: 32 }}>
            <AppButton
              title={loading ? 'Adding Employee...' : 'Add Employee'}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
              leftIcon="person-add"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Helper Components
function SectionHeader({ title, theme }: { title: string; theme: any }) {
  return (
    <Text style={{
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 12,
    }}>
      {title}
    </Text>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  numberOfLines?: number;
  theme: any;
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  theme,
}: FormInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
      }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: theme.text,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}
