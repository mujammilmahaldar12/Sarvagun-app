import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { LeaveBalanceCard } from '@/components/hr';
import { Button, Card } from '@/components';
import { MultiDatePicker } from '@/components/core';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { format } from 'date-fns';
import type { LeaveType, ShiftType } from '@/types/hr';

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Study Leave', 'Optional Leave'];

const SHIFT_TYPES: { value: ShiftType; label: string; description: string }[] = [
  { value: 'full_shift', label: 'Full Day', description: 'Complete working day' },
  { value: 'first_half', label: 'First Half', description: 'Morning shift only' },
  { value: 'second_half', label: 'Second Half', description: 'Afternoon shift only' },
];

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  // API hooks
  const { mutate: createLeave, isPending: isSubmitting } = useCreateLeave();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [reason, setReason] = useState('');

  // Calculate total days from selected dates
  const calculateTotalDays = () => {
    if (selectedDates.length === 0) return 0;
    
    // If half day shift, count as 0.5 per date
    if (shiftType !== 'full_shift') {
      return selectedDates.length * 0.5;
    }
    
    return selectedDates.length;
  };

  // Get available balance for selected leave type
  const getAvailableBalance = (): number => {
    if (!balance || !leaveType) return 0;

    const typeKey = leaveType.toLowerCase().replace(' ', '_');
    const totalKey = `${typeKey}_total` as keyof typeof balance;
    const usedKey = `${typeKey}_used` as keyof typeof balance;
    const plannedKey = `${typeKey}_planned` as keyof typeof balance;

    const total = (balance[totalKey] as number) || 0;
    const used = (balance[usedKey] as number) || 0;
    const planned = (balance[plannedKey] as number) || 0;

    return total - used - planned;
  };

  // Generate leave summary
  const generateSummary = () => {
    if (selectedDates.length === 0) return null;

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const totalDays = calculateTotalDays();
    const availableBalance = getAvailableBalance();

    return {
      dates: sortedDates,
      totalDays,
      leaveType,
      shiftType,
      availableBalance,
      willExceedBalance: totalDays > availableBalance,
    };
  };

  const handleSubmit = async () => {
    // Validation
    if (!leaveType) {
      Alert.alert('Validation Error', 'Please select a leave type');
      return;
    }

    if (selectedDates.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one date');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for leave');
      return;
    }

    const totalDays = calculateTotalDays();
    const availableBalance = getAvailableBalance();

    // Check balance
    if (totalDays > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${availableBalance} days available for ${leaveType}. Requested: ${totalDays} days.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply Anyway',
            onPress: () => submitLeave(),
          },
        ]
      );
      return;
    }

    submitLeave();
  };

  const submitLeave = () => {
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const fromDate = format(sortedDates[0], 'yyyy-MM-dd');
    const toDate = format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd');

    try {
      createLeave(
        {
          leave_type: leaveType as LeaveType,
          from_date: fromDate,
          to_date: toDate,
          shift_type: shiftType,
          reason: reason.trim(),
          // Store selected dates in reason or custom field
          // Backend should handle multiple date selection
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Success',
              'Your leave application has been submitted successfully!',
              [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]
            );
          },
          onError: (error: any) => {
            Alert.alert(
              'Error',
              error.message || 'Failed to submit leave application. Please try again.'
            );
          },
        }
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    }
  };

  const summary = generateSummary();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ModuleHeader
        title="Apply Leave"
        showBack={true}
        onBackPress={() => router.back()}
        backgroundColor={theme.surface}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Info */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Applying as</Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.full_name || 'Employee'}
            </Text>
            {user?.designation && (
              <Text style={[styles.userDesignation, { color: theme.textSecondary }]}>
                {user.designation}
              </Text>
            )}
          </View>

          {/* Leave Balance Card */}
          {!balanceLoading && balance && (
            <View style={styles.section}>
              <LeaveBalanceCard compact />
            </View>
          )}

          {/* Leave Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Leave Type <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={styles.optionsGrid}>
              {LEAVE_TYPES.map((type) => {
                const isSelected = leaveType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setLeaveType(type)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? theme.primary + '15' : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? theme.primary : theme.text,
                      }}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Shift Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Shift Type <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={styles.shiftTypesContainer}>
              {SHIFT_TYPES.map((shift) => {
                const isSelected = shiftType === shift.value;
                return (
                  <Pressable
                    key={shift.value}
                    onPress={() => setShiftType(shift.value)}
                    style={[
                      styles.shiftTypeCard,
                      {
                        backgroundColor: isSelected ? theme.primary + '15' : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: isSelected ? '600' : '500',
                          color: isSelected ? theme.primary : theme.text,
                          marginLeft: 8,
                        }}
                      >
                        {shift.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 28 }}>
                      {shift.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date Selection with Multi-Date Picker */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                Select Dates <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              {selectedDates.length > 0 && (
                <Pressable onPress={() => setSelectedDates([])}>
                  <Text style={{ fontSize: 14, color: theme.primary, fontWeight: '600' }}>
                    Clear All
                  </Text>
                </Pressable>
              )}
            </View>
            
            <MultiDatePicker
              selectedDates={selectedDates}
              onChange={setSelectedDates}
              minDate={new Date()}
              label=""
            />

            {selectedDates.length > 0 && (
              <View style={[styles.selectedDatesContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.selectedDatesTitle, { color: theme.text }]}>
                  Selected Dates ({selectedDates.length})
                </Text>
                <View style={styles.selectedDatesList}>
                  {[...selectedDates].sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                    <View key={date.getTime()} style={[styles.selectedDateChip, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: theme.primary }}>
                        {format(date, 'MMM dd')}
                      </Text>
                      <Pressable
                        onPress={() => setSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()))}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color={theme.primary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Reason <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                }
              ]}
              placeholder="Provide a reason for your leave request..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
          </View>

          {/* Leave Summary */}
          {summary && (
            <View style={styles.section}>
              <Card variant="elevated" shadow="md" padding="lg">
                <Text style={[styles.summaryTitle, { color: theme.text }]}>Leave Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Leave Type:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.leaveType}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shift Type:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {SHIFT_TYPES.find(s => s.value === summary.shiftType)?.label}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Days:</Text>
                  <Text style={[styles.summaryValue, { color: theme.primary, fontWeight: '700' }]}>
                    {summary.totalDays} {summary.totalDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Available Balance:</Text>
                  <Text style={[styles.summaryValue, { color: summary.willExceedBalance ? '#EF4444' : '#10B981', fontWeight: '700' }]}>
                    {summary.availableBalance} days
                  </Text>
                </View>

                {summary.willExceedBalance && (
                  <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <Text style={{ fontSize: 13, color: '#92400E', marginLeft: 8, flex: 1 }}>
                      You don't have sufficient balance. This request may require special approval.
                    </Text>
                  </View>
                )}

                <View style={styles.summaryDatesSection}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary, marginBottom: 8 }]}>
                    Selected Dates:
                  </Text>
                  <View style={styles.summaryDatesList}>
                    {summary.dates.map((date, index) => (
                      <Text key={date.getTime()} style={[styles.summaryDateItem, { color: theme.text }]}>
                        {format(date, 'MMM dd, yyyy')}
                        {index < summary.dates.length - 1 && ', '}
                      </Text>
                    ))}
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Submit Button */}
          <View style={styles.section}>
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
              onPress={handleSubmit}
              disabled={isSubmitting || !leaveType || selectedDates.length === 0 || !reason.trim()}
              size="lg"
              variant="primary"
              leftIcon={isSubmitting ? undefined : 'send'}
            />
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...getTypographyStyle('xs', 'medium'),
    marginBottom: 4,
  },
  userName: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: 4,
  },
  userDesignation: {
    ...getTypographyStyle('sm', 'regular'),
  },
  sectionTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  shiftTypesContainer: {
    gap: spacing.sm,
  },
  shiftTypeCard: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: 15,
    minHeight: 100,
  },
  selectedDatesContainer: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  selectedDatesTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    marginBottom: spacing.sm,
  },
  selectedDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectedDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  summaryTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    ...getTypographyStyle('sm', 'medium'),
  },
  summaryValue: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.base,
  },
  summaryDatesSection: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryDateItem: {
    ...getTypographyStyle('sm', 'regular'),
  },
});
