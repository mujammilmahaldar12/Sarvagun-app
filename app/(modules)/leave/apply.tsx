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
import { spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle, getCardStyle } from '@/utils/styleHelpers';
import { format } from 'date-fns';
import type { LeaveType, ShiftType } from '@/types/hr';
import { useActivityTracker } from '@/hooks/useActivityTracker';

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Study Leave', 'Optional Leave'];

const SHIFT_TYPES: { value: ShiftType; label: string; description: string }[] = [
  { value: 'full_shift', label: 'Full Day', description: 'Complete working day' },
  { value: 'first_half', label: 'First Half', description: 'Morning shift only' },
  { value: 'second_half', label: 'Second Half', description: 'Afternoon shift only' },
];

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  // API hooks
  const { mutate: createLeave, isPending: isSubmitting } = useCreateLeave();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();
  const { trackLeaveRequest } = useActivityTracker();

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
    console.log('🔵 Submit button clicked!');
    console.log('🔍 Form state:', {
      leaveType,
      selectedDates: selectedDates.length,
      reason: reason.length,
      isSubmitting,
    });

    // Validation
    if (!leaveType) {
      console.log('❌ Validation failed: No leave type');
      Alert.alert('Validation Error', 'Please select a leave type');
      return;
    }

    if (selectedDates.length === 0) {
      console.log('❌ Validation failed: No dates selected');
      Alert.alert('Validation Error', 'Please select at least one date');
      return;
    }

    if (!reason.trim()) {
      console.log('❌ Validation failed: No reason');
      Alert.alert('Validation Error', 'Please provide a reason for leave');
      return;
    }

    console.log('✅ Validation passed!');

    const totalDays = calculateTotalDays();
    const availableBalance = getAvailableBalance();

    // Allow applying even without balance (removed balance check)
    submitLeave();
  };

  const submitLeave = () => {
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const fromDate = format(sortedDates[0], 'yyyy-MM-dd');
    const toDate = format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd');

    console.log('🚀 Submitting leave:', {
      leave_type: leaveType,
      from_date: fromDate,
      to_date: toDate,
      shift_type: shiftType,
      reason: reason.trim(),
      dates_count: selectedDates.length,
    });

    createLeave(
      {
        leave_type: leaveType as LeaveType,
        from_date: fromDate,
        to_date: toDate,
        shift_type: shiftType,
        reason: reason.trim(),
      },
      {
        onSuccess: async (data) => {
          console.log('✅ Leave submitted successfully:', data);
          console.log('📢 Showing success alert...');
          
          // Track activity in local storage
          await trackLeaveRequest(
            leaveType as string,
            fromDate,
            toDate,
            (data as any)?.id
          );
          
          // Use setTimeout to ensure alert shows after state updates
          setTimeout(() => {
            Alert.alert(
              '✅ Success',
              `Your leave application for ${selectedDates.length} day(s) has been submitted successfully! Your manager will review it soon.`,
              [
                {
                  text: 'View Leaves',
                  onPress: () => {
                    console.log('📍 Navigating back...');
                    router.back();
                  },
                },
                {
                  text: 'Apply Another',
                  style: 'cancel',
                  onPress: () => {
                    // Reset form
                    setLeaveType('');
                    setSelectedDates([]);
                    setReason('');
                  },
                },
              ]
            );
          }, 100);
        },
        onError: (error: any) => {
          console.error('❌ Leave submission error:', error);
          Alert.alert(
            '❌ Error',
            error.message || 'Failed to submit leave application. Please try again.'
          );
        },
      }
    );
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
                    accessibilityLabel={`Select ${type}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? getOpacityColor(theme.primary, 0.15) : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }
                    ]}
                  >
                    <Text
                      style={[getTypographyStyle('sm', isSelected ? 'semibold' : 'medium'), { color: isSelected ? theme.primary : theme.text }]}
                    >
                      {type}
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
                    <View key={date.getTime()} style={[styles.selectedDateChip, { backgroundColor: getOpacityColor(theme.primary, 0.15), borderColor: theme.primary }]}>
                      <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.primary }]}>
                        {format(date, 'MMM dd')}
                      </Text>
                      <Pressable
                        onPress={() => setSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()))}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={`Remove ${format(date, 'MMM dd')}`}
                        accessibilityRole="button"
                      >
                        <Ionicons name="close-circle" size={iconSizes.xs} color={theme.primary} />
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
                
                <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Leave Type:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.leaveType}</Text>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shift Type:</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    Full Day
                  </Text>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Days:</Text>
                  <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.primary }]}>
                    {summary.totalDays} {summary.totalDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Available Balance:</Text>
                  <Text style={[getTypographyStyle('sm', 'bold'), { color: '#10B981' }]}>
                    {summary.availableBalance} days
                  </Text>
                </View>

                <View style={[styles.warningBox, { backgroundColor: getOpacityColor('#3B82F6', 0.15), borderColor: '#3B82F6' }]}>
                  <Ionicons name="information-circle" size={iconSizes.md} color="#3B82F6" />
                  <Text style={[getTypographyStyle('xs', 'medium'), { color: '#1E40AF', marginLeft: spacing.md, flex: 1 }]}>
                    You can apply for leave even if balance is low. Approval depends on manager.
                  </Text>
                </View>

                <View style={[styles.summaryDatesSection, { borderTopColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
                    Selected Dates:
                  </Text>
                  <View style={styles.summaryDatesList}>
                    {summary.dates.map((date, index) => (
                      <Text key={date.getTime()} style={[getTypographyStyle('sm', 'regular'), { color: theme.text }]}>
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
              title={isSubmitting ? 'Submitting Leave...' : 'Submit Leave Application'}
              onPress={() => {
                console.log('🟢 Button onPress triggered!');
                handleSubmit();
              }}
              disabled={isSubmitting || !leaveType || selectedDates.length === 0 || !reason.trim()}
              loading={isSubmitting}
              size="md"
              leftIcon="paper-plane"
              accessibilityLabel={isSubmitting ? 'Submitting leave application' : 'Submit leave application'}
            />
            
            {/* Debug Info */}
            <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
              Debug: Type={leaveType ? '✓' : '✗'} | Dates={selectedDates.length} | Reason={reason.trim() ? '✓' : '✗'} | Submitting={isSubmitting ? 'Yes' : 'No'}
            </Text>
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
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  summaryDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryDateItem: {
    ...getTypographyStyle('sm', 'regular'),
  },
});
