import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateReimbursement } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import api from '@/services/api';

interface Expense {
  id: number;
  particulars: string;
  amount: number;
  details: string;
  date: string;
  reimbursed: string;
}

export default function AddReimbursementScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const createReimbursement = useCreateReimbursement();
  
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [documents, setDocuments] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    reimbursement_amount: '',
    details: '',
    bill_evidence: 'no' as 'yes' | 'no',
  });

  // Fetch user's expenses that are not yet reimbursed
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);
      const response: any = await api.get('/finance_management/expenses/');
      const data = response?.results || response || [];
      
      // Filter expenses that are not yet reimbursed
      const unreimbursedExpenses = data.filter((expense: Expense) => 
        expense.reimbursed === 'notreimbursed' || !expense.reimbursed
      );
      
      setExpenses(unreimbursedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    Alert.alert('Document Picker', 'Document picker will be implemented with expo-document-picker');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedExpense) {
      Alert.alert('Validation Error', 'Please select an expense to claim reimbursement for');
      return;
    }

    if (!formData.reimbursement_amount || !formData.details) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.reimbursement_amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount > Number(selectedExpense.amount)) {
      Alert.alert('Invalid Amount', 'Reimbursement amount cannot exceed expense amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        expense: selectedExpense.id,
        reimbursement_amount: amount,
        details: formData.details,
        bill_evidence: formData.bill_evidence,
      };

      console.log('📤 Submitting reimbursement:', payload);
      
      await createReimbursement.mutateAsync(payload);
      
      Alert.alert('Success', 'Reimbursement claim submitted successfully! HR/Admin will be notified.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error submitting reimbursement:', error);
      Alert.alert(
        'Error', 
        error?.response?.data?.detail || error?.message || 'Failed to submit reimbursement claim'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Request Reimbursement" />

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
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={{
              backgroundColor: theme.surface,
              padding: 16,
              borderRadius: 12,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 4 }}>
              Requesting as
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '600' }}>
              {user?.full_name || user?.first_name || 'Employee'}
            </Text>
          </Animated.View>

          {/* Select Expense Section */}
          <Animated.View entering={SlideInUp.duration(400).delay(100)}>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              Select Expense to Reimburse *
            </Text>
            
            {loadingExpenses ? (
              <View style={{ 
                backgroundColor: theme.surface, 
                padding: 32, 
                borderRadius: 12, 
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Loading expenses...</Text>
              </View>
            ) : expenses.length === 0 ? (
              <View style={{ 
                backgroundColor: theme.surface, 
                padding: 32, 
                borderRadius: 12, 
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontWeight: '600', marginTop: 12 }}>
                  No Expenses Found
                </Text>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
                  You need to have an unreimbursed expense to request reimbursement.
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 16, gap: 8 }}>
                {expenses.map((expense) => (
                  <Pressable
                    key={expense.id}
                    style={{
                      backgroundColor: selectedExpense?.id === expense.id 
                        ? `${theme.primary}20` 
                        : theme.surface,
                      borderWidth: 1,
                      borderColor: selectedExpense?.id === expense.id 
                        ? theme.primary 
                        : theme.border,
                      padding: 16,
                      borderRadius: 12,
                    }}
                    onPress={() => {
                      setSelectedExpense(expense);
                      setFormData(prev => ({
                        ...prev,
                        reimbursement_amount: expense.amount.toString(),
                      }));
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: selectedExpense?.id === expense.id ? theme.primary : theme.text,
                          fontSize: 16,
                          fontWeight: '600',
                        }}>
                          {expense.particulars}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                          {expense.details}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{
                          color: theme.primary,
                          fontSize: 16,
                          fontWeight: '700',
                        }}>
                          ₹{Number(expense.amount).toLocaleString()}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {expense.date}
                        </Text>
                      </View>
                    </View>
                    {selectedExpense?.id === expense.id && (
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Reimbursement Amount */}
          {selectedExpense && (
            <Animated.View entering={SlideInUp.duration(400).delay(200)}>
              <FormInput
                label="Reimbursement Amount *"
                value={formData.reimbursement_amount}
                onChangeText={(text) => updateField('reimbursement_amount', text.replace(/[^0-9.]/g, ''))}
                placeholder={selectedExpense.amount.toString()}
                keyboardType="numeric"
                theme={theme}
                prefix="₹"
              />
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: -12, marginBottom: 16 }}>
                Max: ₹{Number(selectedExpense.amount).toLocaleString()}
              </Text>
            </Animated.View>
          )}

          {/* Details/Reason */}
          <Animated.View entering={SlideInUp.duration(400).delay(300)}>
            <FormInput
              label="Reason/Details *"
              value={formData.details}
              onChangeText={(text) => updateField('details', text)}
              placeholder="Enter reason for reimbursement claim"
              multiline
              numberOfLines={4}
              theme={theme}
            />
          </Animated.View>

          {/* Bill Evidence Toggle */}
          <Animated.View entering={SlideInUp.duration(400).delay(400)}>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              Bill/Receipt Available? *
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: formData.bill_evidence === 'yes' ? '#10B98120' : theme.surface,
                  borderWidth: 1,
                  borderColor: formData.bill_evidence === 'yes' ? '#10B981' : theme.border,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={() => setFormData(prev => ({ ...prev, bill_evidence: 'yes' }))}
              >
                <Ionicons 
                  name={formData.bill_evidence === 'yes' ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={20} 
                  color={formData.bill_evidence === 'yes' ? '#10B981' : theme.textSecondary} 
                />
                <Text style={{ 
                  color: formData.bill_evidence === 'yes' ? '#10B981' : theme.text,
                  fontWeight: '500',
                }}>
                  Yes
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: formData.bill_evidence === 'no' ? '#EF444420' : theme.surface,
                  borderWidth: 1,
                  borderColor: formData.bill_evidence === 'no' ? '#EF4444' : theme.border,
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={() => setFormData(prev => ({ ...prev, bill_evidence: 'no' }))}
              >
                <Ionicons 
                  name={formData.bill_evidence === 'no' ? 'close-circle' : 'ellipse-outline'} 
                  size={20} 
                  color={formData.bill_evidence === 'no' ? '#EF4444' : theme.textSecondary} 
                />
                <Text style={{ 
                  color: formData.bill_evidence === 'no' ? '#EF4444' : theme.text,
                  fontWeight: '500',
                }}>
                  No
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Document Upload */}
          <Animated.View entering={SlideInUp.duration(400).delay(500)} style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              Supporting Documents (Optional)
            </Text>
            
            <Pressable
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload" size={40} color={theme.primary} />
              <Text style={{ color: theme.primary, marginTop: 8, fontWeight: '600' }}>
                Upload Document
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                PDF, JPG, PNG (Max 5MB)
              </Text>
            </Pressable>

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
                      Document {index + 1}
                    </Text>
                    <Pressable onPress={() => removeDocument(index)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Info Note */}
          <Animated.View 
            entering={SlideInUp.duration(400).delay(600)}
            style={{
              backgroundColor: '#3B82F615',
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 4 }}>
                Note
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                HR and Admin will be notified of your reimbursement request. 
                You'll receive a notification once it's approved or rejected.
              </Text>
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={SlideInUp.duration(400).delay(700)}>
            <Pressable
              style={{
                backgroundColor: loading || !selectedExpense ? '#9CA3AF' : theme.primary,
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 32,
              }}
              onPress={handleSubmit}
              disabled={loading || !selectedExpense}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Submit Reimbursement Request
                </Text>
              )}
            </Pressable>
          </Animated.View>
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
