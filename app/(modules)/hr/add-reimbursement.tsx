/**
 * Add Reimbursement Screen
 * Simplified form with correct backend integration
 * Flow: 1) Create Expense → 2) Create ReimbursementRequest
 */
import React, { useState } from 'react';
import {
  View, ScrollView, Text, TextInput, Pressable, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Button } from '@/components/core/Button';
import api from '@/services/api';

// Reimburse For options
const REIMBURSE_TYPES = [
  { value: 'Travel', label: 'Travel' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Food', label: 'Food' },
  { value: 'Accommodation', label: 'Accommodation' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Other', label: 'Other' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'not_paid', label: 'Not Paid' },
  { value: 'partial_paid', label: 'Partial Paid' },
];

const PAYMENT_MODE_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Gpay', label: 'UPI / GPay' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Debit Card', label: 'Debit Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' },
];

export default function AddReimbursementScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    reimburse_for: 'Travel',
    details: '',
    amount: '',
    reimbursement_amount: '',
    payment_status: 'paid',
    mode_of_payment: 'Cash',
    payment_made_by: user?.full_name || user?.first_name || '',
    bill_evidence: 'no' as 'yes' | 'no',
    bill_no: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-fill reimbursement amount when amount changes
    if (field === 'amount') {
      setFormData(prev => ({ ...prev, reimbursement_amount: value }));
    }
  };

  // Image Picker - with proper permission request
  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setBillImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setBillImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.details.trim()) {
      Alert.alert('Error', 'Please enter expense details');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!formData.reimbursement_amount || parseFloat(formData.reimbursement_amount) <= 0) {
      Alert.alert('Error', 'Please enter reimbursement amount');
      return;
    }
    if (parseFloat(formData.reimbursement_amount) > parseFloat(formData.amount)) {
      Alert.alert('Error', 'Reimbursement amount cannot exceed expense amount');
      return;
    }
    if (formData.bill_evidence === 'yes' && !formData.bill_no.trim()) {
      Alert.alert('Error', 'Please enter Bill Number since you selected "Yes"');
      return;
    }
    if (formData.bill_evidence === 'yes' && !billImage) {
      Alert.alert('Error', 'Please upload bill/evidence since you selected "Yes"');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Expense
      const expenseFormData = new FormData();
      expenseFormData.append('particulars', formData.reimburse_for);
      expenseFormData.append('details', formData.details);
      expenseFormData.append('amount', formData.amount);
      expenseFormData.append('payment_status', formData.payment_status);
      expenseFormData.append('mode_of_payment', formData.mode_of_payment);
      expenseFormData.append('payment_made_by', formData.payment_made_by);
      expenseFormData.append('bill_evidence', formData.bill_evidence);
      if (formData.bill_evidence === 'yes') {
        expenseFormData.append('bill_no', formData.bill_no);
      }
      expenseFormData.append('reimbursed', 'notreimbursed');

      // Add bill photo if provided
      if (billImage) {
        const filename = billImage.split('/').pop() || 'bill.jpg';
        expenseFormData.append('photo', {
          uri: billImage,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      console.log('📤 Step 1: Creating expense...');
      // api wrapper handles multipart content-type automatically
      const expenseResponse: any = await api.post('/finance_management/expenses/', expenseFormData);

      const expenseId = expenseResponse?.id || expenseResponse?.data?.id;
      if (!expenseId) {
        throw new Error('Failed to create expense - no ID returned');
      }
      console.log('✅ Expense created with ID:', expenseId);

      // Step 2: Create Reimbursement Request
      const reimbursementPayload = {
        expense: expenseId,
        reimbursement_amount: parseFloat(formData.reimbursement_amount),
        details: formData.details,
        bill_evidence: formData.bill_evidence,
      };

      console.log('📤 Step 2: Creating reimbursement request...');
      await api.post('/finance_management/reimbursements/', reimbursementPayload);
      console.log('✅ Reimbursement request created');

      // Keep loading true to prevent multiple clicks while alert is showing
      // Do NOT set loading(false) in finally if successful

      // Backend automatically sends notification to HR/Admin
      Alert.alert(
        'Success! 🎉',
        'Your reimbursement request has been submitted.',
        [{ text: 'OK', onPress: () => router.navigate('/(modules)/hr') }]
      );

      // Force redirect after 1.5s in case user doesn't tap OK
      setTimeout(() => {
        router.navigate('/(modules)/hr');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error:', error);
      const errorMsg = error?.response?.data?.detail
        || error?.response?.data?.message
        || JSON.stringify(error?.response?.data)
        || 'Failed to submit request';
      Alert.alert('Error', errorMsg);
      setLoading(false); // Only reset loading on error
    }
    // Removed finally block to allow keeping loading state on success
  };

  // Dropdown Component (Inside to access theme easily)
  const Dropdown = ({ label, value, options, onSelect, placeholder }: any) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((o: any) => o.value === value);

    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8, fontWeight: '500' }}>{label}</Text>
        <Pressable
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: open ? theme.primary : theme.border,
            borderRadius: 8,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => setOpen(!open)}
        >
          <Text style={{ color: selectedOption ? theme.text : theme.textSecondary, fontSize: 16 }}>
            {selectedOption?.label || placeholder}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
        </Pressable>
        {open && (
          <View style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200,
          }}>
            <ScrollView nestedScrollEnabled>
              {options.map((option: any, index: number) => (
                <Pressable
                  key={option.value}
                  style={{
                    padding: 14,
                    backgroundColor: value === option.value ? `${theme.primary}15` : 'transparent',
                    borderBottomWidth: index < options.length - 1 ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                  onPress={() => { onSelect(option.value); setOpen(false); }}
                >
                  <Text style={{ color: value === option.value ? theme.primary : theme.text, fontSize: 16 }}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Request Reimbursement" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

          {/* Employee Info */}
          <Animated.View entering={FadeIn.duration(300)} style={{
            backgroundColor: theme.surface, padding: 16, borderRadius: 12, marginBottom: 20,
            borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Ionicons name="person" size={24} color={theme.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Requesting as</Text>
              <Text style={{ fontSize: 16, color: theme.text, fontWeight: '600' }}>
                {user?.full_name || user?.first_name || 'Employee'}
              </Text>
            </View>
          </Animated.View>

          {/* Reimburse For */}
          <Animated.View entering={SlideInUp.duration(400).delay(100)}>
            <Dropdown
              label="Reimburse For *"
              value={formData.reimburse_for}
              placeholder="Select type"
              options={REIMBURSE_TYPES}
              onSelect={(v: string) => updateField('reimburse_for', v)}
            />
          </Animated.View>

          {/* Expense Details */}
          <Animated.View entering={SlideInUp.duration(400).delay(150)}>
            <FormInput
              label="Expense Details *"
              value={formData.details}
              onChangeText={(text: string) => updateField('details', text)}
              placeholder="Describe what this expense is for..."
              multiline
              numberOfLines={3}
              theme={theme}
            />
          </Animated.View>

          {/* Amount */}
          <Animated.View entering={SlideInUp.duration(400).delay(200)}>
            <FormInput
              label="Amount *"
              value={formData.amount}
              onChangeText={(text: string) => updateField('amount', text.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              keyboardType="numeric"
              theme={theme}
              prefix="₹"
            />
          </Animated.View>

          {/* Reimbursement Amount */}
          <Animated.View entering={SlideInUp.duration(400).delay(250)}>
            <FormInput
              label="Reimbursement Amount *"
              value={formData.reimbursement_amount}
              onChangeText={(text: string) => updateField('reimbursement_amount', text.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              keyboardType="numeric"
              theme={theme}
              prefix="₹"
            />
          </Animated.View>

          {/* Payment Status */}
          <Animated.View entering={SlideInUp.duration(400).delay(300)}>
            <Dropdown
              label="Payment Status *"
              value={formData.payment_status}
              placeholder="Select status"
              options={PAYMENT_STATUS_OPTIONS}
              onSelect={(v: string) => updateField('payment_status', v)}
            />
          </Animated.View>

          {/* Mode of Payment */}
          <Animated.View entering={SlideInUp.duration(400).delay(350)}>
            <Dropdown
              label="Mode of Payment *"
              value={formData.mode_of_payment}
              placeholder="Select mode"
              options={PAYMENT_MODE_OPTIONS}
              onSelect={(v: string) => updateField('mode_of_payment', v)}
            />
          </Animated.View>

          {/* Payment Made By */}
          <Animated.View entering={SlideInUp.duration(400).delay(400)}>
            <FormInput
              label="Payment Made By *"
              value={formData.payment_made_by}
              onChangeText={(text: string) => updateField('payment_made_by', text)}
              placeholder="Who paid for this?"
              theme={theme}
            />
          </Animated.View>

          {/* Bill/Evidence Toggle */}
          <Animated.View entering={SlideInUp.duration(400).delay(450)} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8, fontWeight: '500' }}>
              Bill/Evidence Available? *
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: formData.bill_evidence === 'yes' ? '#10b98120' : theme.surface,
                  borderWidth: 2,
                  borderColor: formData.bill_evidence === 'yes' ? '#10b981' : theme.border,
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={() => updateField('bill_evidence', 'yes')}
              >
                <Ionicons
                  name={formData.bill_evidence === 'yes' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={formData.bill_evidence === 'yes' ? '#10b981' : theme.textSecondary}
                />
                <Text style={{ color: formData.bill_evidence === 'yes' ? '#10b981' : theme.text, fontWeight: '600', fontSize: 16 }}>
                  Yes
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: formData.bill_evidence === 'no' ? '#f59e0b20' : theme.surface,
                  borderWidth: 2,
                  borderColor: formData.bill_evidence === 'no' ? '#f59e0b' : theme.border,
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={() => { updateField('bill_evidence', 'no'); setBillImage(null); }}
              >
                <Ionicons
                  name={formData.bill_evidence === 'no' ? 'close-circle' : 'ellipse-outline'}
                  size={22}
                  color={formData.bill_evidence === 'no' ? '#f59e0b' : theme.textSecondary}
                />
                <Text style={{ color: formData.bill_evidence === 'no' ? '#f59e0b' : theme.text, fontWeight: '600', fontSize: 16 }}>
                  No
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Bill Upload - Only shown if bill_evidence === 'yes' */}
          {formData.bill_evidence === 'yes' && (
            <Animated.View entering={SlideInUp.duration(300)} style={{ marginBottom: 16 }}>
              {/* Bill Number Input */}
              <FormInput
                label="Bill Number *"
                value={formData.bill_no}
                onChangeText={(text: string) => updateField('bill_no', text)}
                placeholder="Enter bill/receipt number"
                theme={theme}
              />

              <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8, fontWeight: '500' }}>
                Upload Bill/Evidence *
              </Text>

              {billImage ? (
                <View style={{
                  backgroundColor: theme.surface, borderRadius: 12, overflow: 'hidden',
                  borderWidth: 2, borderColor: '#10b981',
                }}>
                  <Image source={{ uri: billImage }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
                  <View style={{ padding: 12, backgroundColor: theme.surface, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Button
                        title="Change"
                        onPress={() => setBillImage(null)} // Clear first to show options again
                        variant="secondary"
                        size="sm"
                        fullWidth
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Remove"
                        onPress={() => setBillImage(null)}
                        variant="danger"
                        size="sm"
                        fullWidth
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={{
                    borderWidth: 2,
                    borderColor: theme.border,
                    borderStyle: 'dashed',
                    borderRadius: 12,
                    padding: 24,
                    alignItems: 'center',
                    backgroundColor: theme.surface
                  }}>
                    <Ionicons name="cloud-upload-outline" size={32} color={theme.textSecondary} />
                    <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }}>
                      Attach bill/receipt proof
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                      title="Take Photo"
                      onPress={takePhoto}
                      variant="secondary"
                      leftIcon="camera"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Gallery"
                      onPress={pickImage}
                      variant="secondary"
                      leftIcon="images"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* Info Note */}
          <Animated.View entering={SlideInUp.duration(400).delay(500)} style={{
            backgroundColor: '#3b82f610', padding: 14, borderRadius: 12,
            flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16,
            borderWidth: 1, borderColor: '#3b82f630',
          }}>
            <Ionicons name="information-circle" size={22} color="#3b82f6" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 2 }}>What happens next?</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                HR and Admin will be automatically notified. You'll receive a notification once your request is approved or rejected.
              </Text>
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={SlideInUp.duration(400).delay(550)}>
            <Pressable
              style={{
                backgroundColor: loading ? '#9ca3af' : theme.primary,
                padding: 16, borderRadius: 12, alignItems: 'center',
                marginBottom: 40, flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Submit Request</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Form Input Component
function FormInput({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, numberOfLines = 1, theme, prefix }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8, fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {prefix && (
          <Text style={{ position: 'absolute', left: 14, fontSize: 18, color: theme.text, fontWeight: '600', zIndex: 1 }}>
            {prefix}
          </Text>
        )}
        <TextInput
          style={{
            flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
            borderRadius: 8, padding: 14, paddingLeft: prefix ? 36 : 14, fontSize: 16, color: theme.text,
            minHeight: multiline ? 90 : 50, textAlignVertical: multiline ? 'top' : 'center',
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
