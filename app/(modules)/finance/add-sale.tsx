/**
 * Add/Edit Sale Screen - UPDATED WITH CORE COMPONENTS
 * Matches event management patterns
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
import financeService from '@/services/finance.service';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prevent re-loading data after initial load (causes infinite loop with mutations)
  const isInitialized = React.useRef(false);

  // Convert events to select options
  const eventOptions = useMemo(() => {
    const options = (eventsData?.results || []).map((event: any) => ({
      label: `${event.name}${event.client?.name ? ` - ${event.client.name}` : ''}`,
      value: String(event.id),
    }));

    // If edit mode and existing event is not in the list, add it to options
    if (isEditMode && existingSale?.event && typeof existingSale.event === 'object') {
      const eventId = String((existingSale.event as any).id);
      const exists = options.some((opt: any) => opt.value === eventId);
      if (!exists) {
        const evt = existingSale.event as any;
        options.push({
          label: `${evt.name}${evt.client?.name ? ` - ${evt.client.name}` : ''}`,
          value: eventId
        });
      }
    }
    return options;
  }, [eventsData, existingSale, isEditMode]);

  // Load existing sale data in edit mode - ONLY ONCE
  useEffect(() => {
    if (isEditMode && existingSale && !isInitialized.current) {
      isInitialized.current = true; // Mark as initialized to prevent re-loading

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
          id: p.id,
          payment_amount: p.payment_amount,
          payment_date: p.payment_date,
          mode_of_payment: p.mode_of_payment,
          notes: p.notes,
        })));
      }
    }
  }, [isEditMode, existingSale]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Auto-calculate payment status based on installments
  useEffect(() => {
    if (netAmount > 0) {
      let newStatus: 'completed' | 'pending' | 'not_yet' = 'not_yet';
      if (totalReceived >= netAmount) {
        newStatus = 'completed';
      } else if (totalReceived > 0) {
        newStatus = 'pending';
      }
      setFormData(prev => {
        if (prev.payment_status !== newStatus) {
          return { ...prev, payment_status: newStatus };
        }
        return prev;
      });
    }
  }, [totalReceived, netAmount]);

  // Auto-calculate sale date from earliest installment date
  useEffect(() => {
    if (installments.length > 0) {
      const validDates = installments
        .filter(inst => inst.payment_date)
        .map(inst => new Date(inst.payment_date!));

      if (validDates.length > 0) {
        const earliestDate = validDates.sort((a, b) => a.getTime() - b.getTime())[0];
        const dateString = earliestDate.toISOString().split('T')[0];

        setFormData(prev => {
          if (prev.date !== dateString) {
            return { ...prev, date: dateString };
          }
          return prev;
        });
      }
    }
  }, [installments]);

  // Add or update installment
  const handleSaveInstallment = () => {
    const paymentAmount = Number(editingInstallment?.payment_amount) || 0;

    if (paymentAmount <= 0) {
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

    // Calculate total if this installment is added/updated
    let currentTotal = 0;
    if (editingIndex >= 0) {
      // Exclude the installment being edited from current total
      currentTotal = installments.reduce((sum, inst, idx) =>
        idx === editingIndex ? sum : sum + (Number(inst.payment_amount) || 0), 0);
    } else {
      currentTotal = installments.reduce((sum, inst) => sum + (Number(inst.payment_amount) || 0), 0);
    }

    if (currentTotal + paymentAmount > netAmount) {
      setErrorMessage(`Payment amount exceeds balance due. Max: ₹${(netAmount - currentTotal).toLocaleString('en-IN')}`);
      return;
    }

    const installmentToSave = {
      ...editingInstallment,
      payment_amount: paymentAmount,
    };

    if (editingIndex >= 0) {
      // Update existing
      const updated = [...installments];
      updated[editingIndex] = installmentToSave;
      setInstallments(updated);
    } else {
      // Add new
      setInstallments([...installments, installmentToSave]);
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
      payment_amount: undefined as any,
      payment_date: new Date().toISOString().split('T')[0],
      mode_of_payment: 'cash',
      notes: '',
    });
    setEditingIndex(-1);
    setErrorMessage(null);
    setShowPaymentModal(true);
  };

  // Open payment modal for editing
  const handleEditInstallment = (index: number) => {
    setEditingInstallment({ ...installments[index] });
    setEditingIndex(index);
    setErrorMessage(null);
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

      let savedSaleId: number;

      if (isEditMode && saleId) {
        // Update the sale
        await updateSaleMutation.mutateAsync({ id: saleId, data: saleData });
        savedSaleId = saleId;
        console.log('✅ Sale updated:', savedSaleId);
      } else {
        // Create new sale
        const createdSale = await createSaleMutation.mutateAsync(saleData);
        savedSaleId = createdSale.id;
        console.log('✅ Sale created:', savedSaleId);
      }

      // Now create payments separately via the sales-payments endpoint
      if (installments.length > 0) {
        console.log('📤 Creating', installments.length, 'payments for sale', savedSaleId);

        for (const inst of installments) {
          // If payment already has an ID, it's an existing payment - skip creating it
          if (inst.id) {
            console.log('⏭️ Skipping existing payment:', inst.id);
            continue;
          }

          try {
            const paymentData = {
              sale: savedSaleId,
              payment_amount: Number(inst.payment_amount),
              payment_date: inst.payment_date,
              mode_of_payment: inst.mode_of_payment,
              notes: inst.notes || '',
            };
            console.log('📤 Creating payment:', paymentData);
            await financeService.addSalePayment(paymentData as any);
            console.log('✅ Payment created successfully');
          } catch (paymentError: any) {
            console.error('❌ Error creating payment:', paymentError);
            // Continue with other payments even if one fails
          }
        }
      }

      // Show success message
      Alert.alert(
        'Success',
        isEditMode ? 'Sale updated successfully' : 'Sale created successfully'
      );

      // Navigate immediately after showing alert
      if (isEditMode) {
        // For edit mode, go back to previous screen (Sales Details)
        router.back();
      } else if (savedSaleId) {
        // For create mode, navigate to the new sale's details
        router.push(`/(modules)/finance/sales/${savedSaleId}` as any);
      } else {
        router.back();
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
        <ModuleHeader title={isEditMode ? 'Edit Sale' : 'Create Sale'} showBack showNotifications={false} />
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
        showNotifications={false}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
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
              onFocus={() => {
                if (Number(formData.amount) === 0) updateField('amount', '');
              }}
              onBlur={() => {
                if (formData.amount === '') updateField('amount', '0');
              }}
            />

            <Input
              label="Discount"
              value={formData.discount}
              onChangeText={(text: string) => updateField('discount', text)}
              placeholder="0"
              keyboardType="numeric"
              leftIcon="pricetag-outline"
              onFocus={() => {
                if (Number(formData.discount) === 0) updateField('discount', '');
              }}
              onBlur={() => {
                if (formData.discount === '') updateField('discount', '0');
              }}
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

            <Select
              label="Payment Status"
              value={formData.payment_status}
              onChange={(value) => updateField('payment_status', value)}
              options={PAYMENT_STATUS_OPTIONS}
              required
              disabled
            />
            <Text style={{ ...getTypographyStyle('xs', 'regular'), color: theme.textSecondary, marginTop: -8 }}>
              * Auto-calculated based on payment installments
            </Text>
          </View>

          {/* Payment Installments */}
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionHeader title="Payment Installments" subtitle="Add multiple payment installments" />
            </View>

            <Button
              title="Add Payment Installment"
              onPress={handleAddInstallment}
              variant="outline"
              leftIcon="add-circle-outline"
              fullWidth
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
      </KeyboardAvoidingView>

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
                {/* Modal Header with Handle */}
                <View style={{ alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...getTypographyStyle('lg', 'bold'), color: theme.text }}>
                    {editingIndex >= 0 ? 'Edit' : 'Add'} Payment Installment
                  </Text>
                  <Pressable onPress={() => setShowPaymentModal(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {errorMessage && (
                  <View style={{ backgroundColor: theme.error + '20', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="alert-circle" size={20} color={theme.error} />
                    <Text style={{ ...getTypographyStyle('sm', 'medium'), color: theme.error, flex: 1 }}>
                      {errorMessage}
                    </Text>
                  </View>
                )}

                <Input
                  label="Payment Amount"
                  value={editingInstallment?.payment_amount !== undefined ? String(editingInstallment.payment_amount) : ''}
                  onChangeText={(text) => {
                    const value = text === '' ? undefined : Number(text);
                    setEditingInstallment({ ...editingInstallment, payment_amount: value as any });
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                  required
                />

                <DatePicker
                  label="Payment Date"
                  value={editingInstallment?.payment_date ? new Date(editingInstallment.payment_date) : new Date()}
                  onChange={(date) =>
                    date && setEditingInstallment({ ...editingInstallment, payment_date: date.toISOString().split('T')[0] })
                  }
                />

                <Select
                  label="Payment Mode"
                  value={editingInstallment?.mode_of_payment || 'cash'}
                  onChange={(value) => setEditingInstallment({ ...editingInstallment, mode_of_payment: value as any })}
                  options={PAYMENT_MODE_OPTIONS}
                  required
                />

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

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowPaymentModal(false);
                      setEditingInstallment(null);
                      setEditingIndex(-1);
                    }}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={editingIndex >= 0 ? 'Update' : 'Add Payment'}
                    onPress={handleSaveInstallment}
                    leftIcon={editingIndex >= 0 ? 'checkmark' : 'add'}
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
