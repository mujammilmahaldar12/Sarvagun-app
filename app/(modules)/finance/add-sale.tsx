/**
 * Add/Edit Sale Screen - UPDATED WITH CORE COMPONENTS
 * Matches event management patterns
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { Input } from '@/components/core/Input';
import { Select } from '@/components/core/Select';
import { Button } from '@/components/core/Button';
import { DatePicker } from '@/components/core/DatePicker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateSale, useUpdateSale, useSale } from '@/hooks/useFinanceQueries';
import { useEvents } from '@/hooks/useEventsQueries';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';
import type { SalesPayment } from '@/types/finance';

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Not Yet', value: 'not_yet' },
];

const PAYMENT_MODE_OPTIONS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
];

export default function AddSaleScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  
  const saleId = params.id ? Number(params.id) : null;
  const isEditMode = !!saleId;

  // Mutations
  const createSaleMutation = useCreateSale();
  const updateSaleMutation = useUpdateSale();
  
  // Fetch existing sale if editing
  const { data: existingSale, isLoading: loadingSale } = useSale(saleId || 0);
  
  // Fetch all events for selection
  const { data: eventsData, isLoading: loadingEvents } = useEvents();

  // State
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    event: '',
    amount: '',
    discount: '0',
    date: new Date().toISOString().split('T')[0],
    payment_status: 'not_yet' as 'completed' | 'pending' | 'not_yet',
  });

  const [installments, setInstallments] = useState<Array<Partial<SalesPayment>>>([]);
  const [editingInstallment, setEditingInstallment] = useState<Partial<SalesPayment> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Convert events to select options
  const eventOptions = useMemo(() => {
    if (!eventsData?.results) return [];
    return eventsData.results.map((event: any) => ({
      label: `${event.name}${event.client?.name ? ` - ${event.client.name}` : ''}`,
      value: event.id,
    }));
  }, [eventsData]);

  // Load existing sale data in edit mode
  useEffect(() => {
    if (isEditMode && existingSale) {
      const eventObj = typeof existingSale.event === 'object' ? existingSale.event : null;
      
      setFormData({
        event: eventObj?.id ? String(eventObj.id) : existingSale.event ? String(existingSale.event) : '',
        amount: String(existingSale.amount || ''),
        discount: String(existingSale.discount || '0'),
        date: existingSale.date || new Date().toISOString().split('T')[0],
        payment_status: existingSale.payment_status || 'not_yet',
      });
      
      if (existingSale.payments && existingSale.payments.length > 0) {
        setInstallments(existingSale.payments.map(p => ({
          payment_amount: p.payment_amount,
          payment_date: p.payment_date,
          mode_of_payment: p.mode_of_payment,
          notes: p.notes,
        })));
      }
    }
  }, [isEditMode, existingSale]);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Calculate net amount
  const netAmount = useMemo(() => {
    const amount = Number(formData.amount) || 0;
    const discount = Number(formData.discount) || 0;
    return Math.max(0, amount - discount);
  }, [formData.amount, formData.discount]);

  // Calculate total received from installments
  const totalReceived = useMemo(() => {
    return installments.reduce((sum, inst) => sum + (Number(inst.payment_amount) || 0), 0);
  }, [installments]);

  // Calculate balance due
  const balanceDue = useMemo(() => {
    return Math.max(0, netAmount - totalReceived);
  }, [netAmount, totalReceived]);

  // Add or update installment
  const handleSaveInstallment = () => {
    if (!editingInstallment?.payment_amount || Number(editingInstallment.payment_amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }
    if (!editingInstallment?.payment_date) {
      Alert.alert('Error', 'Please select payment date');
      return;
    }
    if (!editingInstallment?.mode_of_payment) {
      Alert.alert('Error', 'Please select payment mode');
      return;
    }

    if (editingIndex >= 0) {
      // Update existing
      const updated = [...installments];
      updated[editingIndex] = editingInstallment;
      setInstallments(updated);
    } else {
      // Add new
      setInstallments([...installments, editingInstallment]);
    }

    setEditingInstallment(null);
    setEditingIndex(-1);
    setShowPaymentModal(false);
  };

  // Remove installment
  const handleRemoveInstallment = (index: number) => {
    Alert.alert(
      'Remove Payment',
      'Are you sure you want to remove this payment installment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setInstallments(installments.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  // Open payment modal for new installment
  const handleAddInstallment = () => {
    setEditingInstallment({
      payment_amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      mode_of_payment: 'cash',
      notes: '',
    });
    setEditingIndex(-1);
    setShowPaymentModal(true);
  };

  // Open payment modal for editing
  const handleEditInstallment = (index: number) => {
    setEditingInstallment({ ...installments[index] });
    setEditingIndex(index);
    setShowPaymentModal(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.event) {
      Alert.alert('Error', 'Please select an event');
      return;
    }
    if (!formData.amount.trim() || Number(formData.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }
    if (Number(formData.discount) < 0) {
      Alert.alert('Error', 'Discount cannot be negative');
      return;
    }
    if (Number(formData.discount) > Number(formData.amount)) {
      Alert.alert('Error', 'Discount cannot be greater than amount');
      return;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please select sale date');
      return;
    }

    // Validate installments total doesn't exceed net amount
    if (totalReceived > netAmount) {
      Alert.alert(
        'Error',
        `Total received (₹${totalReceived.toLocaleString('en-IN')}) cannot exceed net amount (₹${netAmount.toLocaleString('en-IN')})`
      );
      return;
    }

    setLoading(true);
    try {
      const saleData: any = {
        event: Number(formData.event),
        amount: Number(formData.amount),
        discount: Number(formData.discount) || 0,
        date: formData.date,
        payment_status: formData.payment_status,
      };

      // Add payments if any
      if (installments.length > 0) {
        saleData.payments = installments.map(inst => ({
          payment_amount: Number(inst.payment_amount),
          payment_date: inst.payment_date,
          mode_of_payment: inst.mode_of_payment,
          notes: inst.notes || '',
        }));
      }

      if (isEditMode && saleId) {
        await updateSaleMutation.mutateAsync({ id: saleId, data: saleData });
        Alert.alert('Success', 'Sale updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await createSaleMutation.mutateAsync(saleData);
        Alert.alert('Success', 'Sale created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Error saving sale:', error);
      Alert.alert('Error', error.message || 'Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  // Reusable components
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View style={{ gap: 4 }}>
      <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text, marginTop: 8 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  // Loading state
  if (loadingSale) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ModuleHeader title={isEditMode ? 'Edit Sale' : 'Create Sale'} showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary, marginTop: 12 }}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader
        title={isEditMode ? 'Edit Sale' : 'Create Sale'}
        showBack
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Event Selection */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Event Details" />
          
          <Select
            label="Event"
            placeholder="Select an event"
            value={formData.event}
            onChange={(value) => updateField('event', value)}
            options={eventOptions}
            required
            searchable
            disabled={loadingEvents}
          />
        </View>

        {/* Financial Details */}
        <View style={{ gap: 16 }}>
          <SectionHeader title="Financial Details" />
          
          <Input
            label="Amount"
            value={formData.amount}
            onChangeText={(text: string) => updateField('amount', text)}
            placeholder="0"
            keyboardType="numeric"
            leftIcon="cash-outline"
            required
          />

          <Input
            label="Discount"
            value={formData.discount}
            onChangeText={(text: string) => updateField('discount', text)}
            placeholder="0"
            keyboardType="numeric"
            leftIcon="pricetag-outline"
          />

          {/* Summary Card */}
          <View style={{
            padding: 16,
            backgroundColor: theme.surface,
            borderRadius: 12,
            gap: 12,
            ...designSystem.shadows.sm,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Gross Amount
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                ₹{(Number(formData.amount) || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.textSecondary }}>
                Discount
              </Text>
              <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: '#EF4444' }}>
                - ₹{(Number(formData.discount) || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...getTypographyStyle('base', 'bold'), color: theme.text }}>
                Net Amount
              </Text>
              <Text style={{ ...getTypographyStyle('xl', 'bold'), color: theme.primary }}>
                ₹{netAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <DatePicker
            label="Sale Date"
            value={formData.date ? new Date(formData.date) : new Date()}
            onChange={(date) => updateField('date', date.toISOString().split('T')[0])}
            mode="single"
          />

          <View style={{ gap: 8 }}>
            <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
              Payment Status <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => updateField('payment_status', option.value)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: formData.payment_status === option.value ? theme.primary : theme.border,
                    backgroundColor: pressed
                      ? theme.primary + '10'
                      : formData.payment_status === option.value
                      ? theme.primary + '20'
                      : theme.surface,
                  })}
                >
                  <Text
                    style={{
                      ...getTypographyStyle('sm', formData.payment_status === option.value ? 'semibold' : 'regular'),
                      color: formData.payment_status === option.value ? theme.primary : theme.text,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Payment Installments */}
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionHeader title="Payment Installments" subtitle="Add multiple payment installments" />
          </View>

          <Button
            title="Add Installment"
            onPress={handleAddInstallment}
            variant="secondary"
            leftIcon="add-circle-outline"
          />

          {installments.length > 0 && (
            <View style={{ gap: 8 }}>
              {installments.map((inst, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: 8,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                      ₹{Number(inst.payment_amount).toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }}>
                      {new Date(inst.payment_date!).toLocaleDateString('en-IN')} • {inst.mode_of_payment}
                    </Text>
                    {inst.notes && (
                      <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary }} numberOfLines={1}>
                        {inst.notes}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable onPress={() => handleEditInstallment(index)}>
                      <Ionicons name="create-outline" size={20} color={theme.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleRemoveInstallment(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Payment Summary */}
              <View style={{
                padding: 14,
                backgroundColor: theme.primary + '10',
                borderRadius: 8,
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
                    Total Received
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'bold'), color: '#10B981' }}>
                    ₹{totalReceived.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.text }}>
                    Balance Due
                  </Text>
                  <Text style={{ ...getTypographyStyle('sm', 'bold'), color: balanceDue > 0 ? '#EF4444' : '#10B981' }}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <Button
            title={isEditMode ? 'Update Sale' : 'Create Sale'}
            onPress={handleSubmit}
            loading={loading}
            leftIcon={isEditMode ? 'checkmark-circle' : 'add-circle'}
          />
        </View>
      </ScrollView>

      {/* Payment Installment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowPaymentModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                  {editingIndex >= 0 ? 'Edit' : 'Add'} Payment Installment
                </Text>

                <Input
                  label="Payment Amount"
                  value={String(editingInstallment?.payment_amount || '')}
                  onChangeText={(text: string) => 
                    setEditingInstallment({ ...editingInstallment, payment_amount: Number(text) || 0 })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                  required
                />

                <DatePicker
                  label="Payment Date"
                  value={editingInstallment?.payment_date ? new Date(editingInstallment.payment_date) : new Date()}
                  onChange={(date) => 
                    setEditingInstallment({ ...editingInstallment, payment_date: date.toISOString().split('T')[0] })
                  }
                  mode="single"
                />

                <View style={{ gap: 8 }}>
                  <Text style={{ ...getTypographyStyle('sm', 'semibold'), color: theme.text }}>
                    Payment Mode <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {PAYMENT_MODE_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => 
                          setEditingInstallment({ ...editingInstallment, mode_of_payment: option.value as any })
                        }
                        style={({ pressed }) => ({
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: editingInstallment?.mode_of_payment === option.value ? theme.primary : theme.border,
                          backgroundColor: pressed
                            ? theme.primary + '10'
                            : editingInstallment?.mode_of_payment === option.value
                            ? theme.primary + '20'
                            : theme.background,
                        })}
                      >
                        <Text
                          style={{
                            ...getTypographyStyle('sm', editingInstallment?.mode_of_payment === option.value ? 'semibold' : 'regular'),
                            color: editingInstallment?.mode_of_payment === option.value ? theme.primary : theme.text,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Input
                  label="Notes (Optional)"
                  value={editingInstallment?.notes || ''}
                  onChangeText={(text: string) => 
                    setEditingInstallment({ ...editingInstallment, notes: text })
                  }
                  placeholder="Add notes about this payment"
                  multiline
                  leftIcon="document-text-outline"
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowPaymentModal(false);
                      setEditingInstallment(null);
                      setEditingIndex(-1);
                    }}
                    variant="secondary"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={editingIndex >= 0 ? 'Update' : 'Add'}
                    onPress={handleSaveInstallment}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
