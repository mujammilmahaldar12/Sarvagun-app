import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { LeaveBalanceCard } from '@/components/hr';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { DatePicker } from '@/components/core/DatePicker';
import type { LeaveType, ShiftType } from '@/types/hr';

const LEAVE_TYPES: LeaveType[] = [
  'Annual Leave',
  'Sick Leave',
  'Casual Leave',
  'Study Leave',
  'Optional Leave',
];

const SHIFT_TYPES: { value: ShiftType; label: string }[] = [
  { value: 'full_shift', label: 'Full Day' },
  { value: 'first_half', label: 'First Half (AM)' },
  { value: 'second_half', label: 'Second Half (PM)' },
];

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<string[]>([]);

  // API hooks
  const { mutate: createLeave, isPending: isSubmitting } = useCreateLeave();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();

  // Form state
  // Using Date objects for easier manipulation with DatePicker
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
  const [reason, setReason] = useState('');

  const pickDocument = async () => {
    Alert.alert('Document Picker', 'Document picker functionality coming soon');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if user has sufficient leave balance
  const getAvailableBalance = (type: LeaveType): number => {
    if (!balance) return 0;

    const typeKey = type.toLowerCase().replace(' ', '_');
    const totalKey = `${typeKey}_total` as keyof typeof balance;
    const usedKey = `${typeKey}_used` as keyof typeof balance;
    const plannedKey = `${typeKey}_planned` as keyof typeof balance;

    const total = (balance[totalKey] as number) || 0;
    const used = (balance[usedKey] as number) || 0;
    const planned = (balance[plannedKey] as number) || 0;

    return total - used - planned;
  };

  const handleSubmit = async () => {
    // Validation
    if (!leaveType || !fromDate || !toDate || !reason.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const days = calculateDays();
    if (toDate < fromDate) {
      Alert.alert('Invalid Dates', 'To date must be after from date');
      return;
    }

    // Check balance
    const availableBalance = getAvailableBalance(leaveType);

    // Allow unpaid leave even if balance is 0? For now, enforcing balance check
    // Unless it's sick leave which might be allowed pending approval
    if (days > availableBalance && leaveType === 'Annual Leave') {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${availableBalance} days available for ${leaveType}. Requested: ${days} days.`
      );
      return;
    }

    try {
      // Format dates as YYYY-MM-DD for API
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      createLeave(
        {
          leave_type: leaveType,
          from_date: formatDate(fromDate),
          to_date: formatDate(toDate),
          shift_type: shiftType,
          reason: reason.trim(),
          documents: [],
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Success',
              'Your leave application has been submitted successfully.',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          },
          onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to submit application.');
          },
        }
      );
    } catch (error) {
      console.error('Error submitting leave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Apply Leave" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Card: User Info & Balance Summary */}
          <View style={{ marginBottom: 20 }}>
            {!balanceLoading && balance ? (
              <LeaveBalanceCard compact />
            ) : (
              // Simple user card if balance loading
              <View style={{
                backgroundColor: theme.surface,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: theme.primary + '20',
                  justifyContent: 'center', alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
                <View>
                  <Text style={{ ...getTypographyStyle('base'), fontWeight: '600', color: theme.text }}>
                    {user?.full_name || 'Employee'}
                  </Text>
                  <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary }}>
                    Applying for leave
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Main Form Card */}
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 20
          }}>

            {/* Leave Type */}
            <View>
              <Text style={{ ...getTypographyStyle('sm'), fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Leave Type <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {LEAVE_TYPES.map((type) => {
                  const isSelected = leaveType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setLeaveType(type)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary + '15' : 'transparent',
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? theme.primary : theme.textSecondary
                      }}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {leaveType && (
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6, marginLeft: 4 }}>
                  Balance: <Text style={{ fontWeight: '600', color: theme.primary }}>{getAvailableBalance(leaveType)} days</Text> available
                </Text>
              )}
            </View>

            {/* Dates Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="From Date *"
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="Start date"
                  minDate={new Date()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="To Date *"
                  value={toDate}
                  onChange={setToDate}
                  placeholder="End date"
                  minDate={fromDate || new Date()}
                />
              </View>
            </View>

            {/* Duration Summary */}
            {fromDate && toDate && (
              <View style={{
                marginTop: -10,
                backgroundColor: theme.background,
                padding: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Text style={{ fontSize: 14, color: theme.textSecondary }}>Total Duration</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                    {calculateDays()} Days
                  </Text>
                </View>
              </View>
            )}

            {/* Shift Type */}
            <View>
              <Text style={{ ...getTypographyStyle('sm'), fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Session
              </Text>
              <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, flexDirection: 'row' }}>
                {SHIFT_TYPES.map((shift, index) => {
                  const isSelected = shiftType === shift.value;
                  return (
                    <Pressable
                      key={shift.value}
                      onPress={() => setShiftType(shift.value)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: isSelected ? theme.surface : theme.background, // inverted logic for tab-like feel? No, let's do standard
                        borderRightWidth: index !== SHIFT_TYPES.length - 1 ? 1 : 0,
                        borderRightColor: theme.border
                      }}
                    >
                      {isSelected && (
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: theme.primary }} />
                      )}
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? theme.primary : theme.textSecondary
                      }}>
                        {index === 0 ? 'Full Day' : index === 1 ? '1st Half' : '2nd Half'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Reason Input */}
            <View>
              <Text style={{ ...getTypographyStyle('sm'), fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                Reason <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 15,
                  color: theme.text,
                  minHeight: 100,
                  textAlignVertical: 'top'
                }}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter detailed reason for leave..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Document Upload */}
            <Pressable
              onPress={pickDocument}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderStyle: 'dashed',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                backgroundColor: theme.background
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: theme.primary + '15',
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 8
              }}>
                <Ionicons name="cloud-upload-outline" size={20} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>
                Attach Documents
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                Optional (Max 5MB)
              </Text>
            </Pressable>

          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={{
          padding: 16,
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16
        }}>
          <AppButton
            title={isSubmitting ? 'Sumitting Request...' : 'Submit Leave Request'}
            onPress={handleSubmit}
            disabled={isSubmitting || !calculateDays()}
            loading={isSubmitting}
            fullWidth
            size="lg"
            variant="primary"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
