import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
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
    phone: '',
    designation: '',
    department: '',
    employeeId: '',
    joinDate: '',
    salary: '',
    address: '',
    emergencyContact: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.email || !formData.designation) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real API call
      // await api.post('/hr/employees/create-complete/', {
      //   user_data: formData,
      //   notify_admin: true
      // });

      console.log('Creating employee:', formData);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Employee added successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add employee');
      console.error('Error:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ModuleHeader title="Add Employee" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
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

          <FormInput
            label="Emergency Contact"
            value={formData.emergencyContact}
            onChangeText={(text) => updateField('emergencyContact', text)}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            theme={theme}
          />

          {/* Employment Details */}
          <SectionHeader title="Employment Details" theme={theme} />

          <FormInput
            label="Employee ID"
            value={formData.employeeId}
            onChangeText={(text) => updateField('employeeId', text)}
            placeholder="EMP001"
            theme={theme}
          />

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

          <FormInput
            label="Salary"
            value={formData.salary}
            onChangeText={(text) => updateField('salary', text)}
            placeholder="₹ 850000"
            keyboardType="numeric"
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
      color: theme.colors.text,
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
        color: theme.colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
      }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: theme.colors.text,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}
