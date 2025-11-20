import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const EXPENSE_TYPES = ['Event', 'Normal', 'Reimbursement'];
const CATEGORIES = {
  Event: ['Venue', 'Catering', 'Decoration', 'Entertainment', 'Equipment', 'Marketing', 'Other'],
  Normal: ['Supplies', 'Technology', 'Utilities', 'Maintenance', 'Marketing', 'Travel', 'Other'],
  Reimbursement: ['Travel', 'Food', 'Accommodation', 'Medical', 'Communication', 'Other'],
};

export default function AddExpenseScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [expenseType, setExpenseType] = useState<'Event' | 'Normal' | 'Reimbursement'>('Normal');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    category: '',
    vendor: '',
    invoiceNumber: '',
    paymentMethod: '',
    description: '',
    notes: '',
    eventId: '', // Only for Event type
  });

  const [documents, setDocuments] = useState<any[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickDocument = async () => {
    // TODO: Implement document picker
    console.log('Pick document');
    Alert.alert('Info', 'Document picker will be implemented with expo-document-picker');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter expense title');
      return;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }
    if (!formData.date.trim()) {
      Alert.alert('Error', 'Please enter date');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select category');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Submit logic here
    console.log('Submitting expense:', { expenseType, ...formData });
    Alert.alert('Success', 'Expense submitted successfully', [
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
    prefix,
    required = false,
  }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{
            position: 'absolute',
            left: 12,
            fontSize: 14,
            color: theme.colors.text,
            zIndex: 1,
          }}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            paddingLeft: prefix ? 28 : 12,
            fontSize: 14,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 44,
          }}
        />
      </View>
    </View>
  );

  const SelectInput = ({ label, value, options, onSelect, required = false }: any) => (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
        {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
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
        title="Add Expense"
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Expense Type Selection */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Expense Type" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {EXPENSE_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setExpenseType(type as any);
                  setFormData({ ...formData, category: '' }); // Reset category when type changes
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: expenseType === type ? theme.colors.primary : theme.colors.border,
                  backgroundColor: pressed
                    ? theme.colors.primary + '10'
                    : expenseType === type
                    ? theme.colors.primary + '20'
                    : theme.colors.surface,
                  alignItems: 'center',
                })}
              >
                <Ionicons
                  name={
                    type === 'Event' ? 'calendar' :
                    type === 'Reimbursement' ? 'receipt' : 'wallet'
                  }
                  size={24}
                  color={expenseType === type ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    fontWeight: expenseType === type ? '600' : 'normal',
                    color: expenseType === type ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Basic Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Basic Information" />
          <FormInput
            label="Title"
            value={formData.title}
            onChangeText={(text: string) => updateField('title', text)}
            placeholder="Enter expense title"
            required
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Amount"
                value={formData.amount}
                onChangeText={(text: string) => updateField('amount', text)}
                placeholder="0"
                keyboardType="numeric"
                prefix="₹"
                required
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Date"
                value={formData.date}
                onChangeText={(text: string) => updateField('date', text)}
                placeholder="DD-MM-YYYY"
                required
              />
            </View>
          </View>
          <SelectInput
            label="Category"
            value={formData.category}
            options={CATEGORIES[expenseType]}
            onSelect={(value: string) => updateField('category', value)}
            required
          />
        </View>

        {/* Event Selection (only for Event type) */}
        {expenseType === 'Event' && (
          <View style={{ gap: 16 }}>
            <SectionHeader title="Event Details" />
            <FormInput
              label="Event ID"
              value={formData.eventId}
              onChangeText={(text: string) => updateField('eventId', text)}
              placeholder="Enter event ID or select from list"
            />
            <View style={{
              padding: 12,
              backgroundColor: theme.colors.primary + '20',
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.primary,
            }}>
              <Text style={{ fontSize: 12, color: theme.colors.text }}>
                💡 This expense will be linked to the selected event
              </Text>
            </View>
          </View>
        )}

        {/* Vendor Information */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Vendor Information" />
          <FormInput
            label="Vendor Name"
            value={formData.vendor}
            onChangeText={(text: string) => updateField('vendor', text)}
            placeholder="Enter vendor name"
          />
          <FormInput
            label="Invoice Number"
            value={formData.invoiceNumber}
            onChangeText={(text: string) => updateField('invoiceNumber', text)}
            placeholder="Enter invoice number"
          />
          <FormInput
            label="Payment Method"
            value={formData.paymentMethod}
            onChangeText={(text: string) => updateField('paymentMethod', text)}
            placeholder="e.g., Cash, Bank Transfer, UPI"
          />
        </View>

        {/* Additional Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Additional Details" />
          <FormInput
            label="Description"
            value={formData.description}
            onChangeText={(text: string) => updateField('description', text)}
            placeholder="Enter expense description"
            multiline
          />
          <FormInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text: string) => updateField('notes', text)}
            placeholder="Add any additional notes"
            multiline
          />
        </View>

        {/* Documents */}
        <View style={{ gap: 12 }}>
          <SectionHeader title="Supporting Documents" />
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
            Upload invoices, receipts, or other supporting documents
          </Text>
          <AppButton
            title="Upload Documents"
            onPress={pickDocument}
            variant="secondary"
            fullWidth
            leftIcon="cloud-upload-outline"
          />

          {documents.length > 0 && (
            <View style={{ gap: 8 }}>
              {documents.map((doc, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="document" size={20} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text, fontSize: 14, flex: 1 }}>
                      {doc.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeDocument(index)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <AppButton
            title="Submit Expense"
            onPress={handleSubmit}
            fullWidth
            size="lg"
            leftIcon="cash"
          />
        </View>
      </ScrollView>
    </View>
  );
}
