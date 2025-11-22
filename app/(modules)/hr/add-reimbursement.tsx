import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';

const REIMBURSEMENT_TYPES = ['Travel', 'Medical', 'Food', 'Accommodation', 'Other'];

export default function AddReimbursementScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    date: '',
    description: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    // TODO: Implement document picker with expo-document-picker
    Alert.alert('Document Picker', 'Document picker will be implemented with expo-document-picker');
    // const result = await DocumentPicker.getDocumentAsync();
    // if (result.type === 'success') {
    //   setDocuments([...documents, result.uri]);
    // }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.type || !formData.amount || !formData.date || !formData.description) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real API call
      console.log('Submitting reimbursement:', { ...formData, employee: user?.full_name });
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Reimbursement claim submitted successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to submit reimbursement claim');
      console.error('Error:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Add Reimbursement" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Employee Info */}
          <View style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 4 }}>
              Claiming as
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '600' }}>
              {user?.full_name || 'Employee'}
            </Text>
          </View>

          {/* Reimbursement Type Selection */}
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 8,
            fontWeight: '500',
          }}>
            Reimbursement Type *
          </Text>
          <View style={{ marginBottom: 16, gap: 8 }}>
            {REIMBURSEMENT_TYPES.map((type) => (
              <Pressable
                key={type}
                style={{
                  backgroundColor: formData.type === type 
                    ? `${theme.primary}20` 
                    : theme.surface,
                  borderWidth: 1,
                  borderColor: formData.type === type 
                    ? theme.primary 
                    : theme.border,
                  padding: 16,
                  borderRadius: 8,
                }}
                onPress={() => updateField('type', type)}
              >
                <Text style={{
                  color: formData.type === type 
                    ? theme.primary 
                    : theme.text,
                  fontSize: 16,
                  fontWeight: formData.type === type ? '600' : '400',
                }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount Input */}
          <FormInput
            label="Amount *"
            value={formData.amount}
            onChangeText={(text) => updateField('amount', text.replace(/[^0-9.]/g, ''))}
            placeholder="5000"
            keyboardType="numeric"
            theme={theme}
            prefix="₹"
          />

          {/* Date Input */}
          <FormInput
            label="Date *"
            value={formData.date}
            onChangeText={(text) => updateField('date', text)}
            placeholder="YYYY-MM-DD"
            theme={theme}
          />

          {/* Description */}
          <FormInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Enter detailed description of the expense"
            multiline
            numberOfLines={4}
            theme={theme}
          />

          {/* Document Upload (Required for Reimbursement) */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              Attach Bills/Receipts *
            </Text>
            
            <Pressable
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
              }}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload" size={32} color={theme.primary} />
              <Text style={{ color: theme.primary, marginTop: 8, fontWeight: '500' }}>
                Upload Document
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                PDF, JPG, PNG (Max 5MB)
              </Text>
            </Pressable>

            {/* Show uploaded documents */}
            {documents.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {documents.map((doc, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.surface,
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Ionicons name="document" size={20} color={theme.primary} />
                    <Text style={{ flex: 1, marginLeft: 12, color: theme.text }}>
                      Receipt {index + 1}
                    </Text>
                    <Pressable onPress={() => removeDocument(index)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={{
              backgroundColor: loading ? '#9CA3AF' : theme.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 32,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: theme.textInverse, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Submitting...' : 'Submit Reimbursement'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Helper Component
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  theme: any;
  prefix?: string;
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  theme,
  prefix,
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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{
            position: 'absolute',
            left: 12,
            fontSize: 16,
            color: theme.text,
            fontWeight: '500',
            zIndex: 1,
          }}>
            {prefix}
          </Text>
        )}
        <TextInput
          style={{
            flex: 1,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 32 : 12,
            fontSize: 16,
            color: theme.text,
            minHeight: multiline ? 100 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
    </View>
  );
}
