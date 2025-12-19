import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { CompactLeaveBalance } from '@/components/hr';
import { Button, Card, FormSection, Input } from '@/components';
import { MultiDatePicker } from '@/components/core';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { spacing, borderRadius, getOpacityColor } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { format } from 'date-fns';
import type { LeaveType, ShiftType } from '@/types/hr';
import { useActivityTracker } from '@/hooks/useActivityTracker';

// Leave type configuration with icons and colors
const LEAVE_TYPE_CONFIG: Record<LeaveType, { icon: keyof typeof Ionicons.glyphMap; color: string; emoji: string }> = {
  'Annual Leave': { icon: 'sunny', color: '#8B5CF6', emoji: '🏖️' },
  'Sick Leave': { icon: 'medkit', color: '#EF4444', emoji: '🏥' },
  'Casual Leave': { icon: 'leaf', color: '#10B981', emoji: '🌴' },
  'Study Leave': { icon: 'book', color: '#F59E0B', emoji: '📚' },
  'Optional Leave': { icon: 'gift', color: '#6366F1', emoji: '🎉' },
};

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Study Leave', 'Optional Leave'];

const SHIFT_TYPES: { value: ShiftType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'full_shift', label: 'Full Day', description: 'Complete working day', icon: 'sunny' },
  { value: 'first_half', label: 'First Half', description: 'Morning shift only', icon: 'partly-sunny' },
  { value: 'second_half', label: 'Second Half', description: 'Afternoon shift only', icon: 'moon' },
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
    if (selectedDates.length === 0 || !leaveType) return null;

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
    if (isSubmitting) return;

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

    submitLeave();
  };

  const submitLeave = () => {
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const fromDate = format(sortedDates[0], 'yyyy-MM-dd');
    const toDate = format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd');

    createLeave(
      {
        leave_type: leaveType as LeaveType,
        from_date: fromDate,
        to_date: toDate,
        shift_type: shiftType,
        reason: reason.trim(),
        specific_dates: sortedDates.map(d => format(d, 'yyyy-MM-dd')),
      },
      {
        onSuccess: async (data) => {
          // Track activity in local storage (non-blocking)
          try {
            await trackLeaveRequest(
              leaveType as string,
              fromDate,
              toDate,
              (data as any)?.id
            );
          } catch (e) {
            console.log('Error tracking leave request locally:', e);
          }

          setTimeout(() => {
            Alert.alert(
              '✅ Success',
              `Your leave application for ${selectedDates.length} day(s) has been submitted successfully! Your manager will review it soon.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.back();
                  },
                },
              ],
              { cancelable: false }
            );
          }, 100);
        },
        onError: (error: any) => {
          Alert.alert(
            '❌ Error',
            error.message || 'Failed to submit leave application. Please try again.'
          );
        },
      }
    );
  };

  const summary = generateSummary();
  const currentLeaveConfig = leaveType ? LEAVE_TYPE_CONFIG[leaveType] : null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />

      <ModuleHeader
        title="Apply Leave"
        showBack={true}
        showNotifications={false}
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
          {/* Leave Balance - Compact View */}
          <FormSection title="Leave Balance">
            <CompactLeaveBalance
              selectedType={leaveType}
              onViewAll={() => router.push('/(modules)/leave/balance' as any)}
            />
          </FormSection>

          {/* Leave Type Selection */}
          <FormSection title="Leave Type *">
            <View style={styles.leaveTypeGrid}>
              {LEAVE_TYPES.map((type) => {
                const config = LEAVE_TYPE_CONFIG[type];
                const isSelected = leaveType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setLeaveType(type)}
                    accessibilityLabel={`Select ${type}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.leaveTypeCard,
                      {
                        backgroundColor: isSelected ? getOpacityColor(config.color, 0.15) : theme.surface,
                        borderColor: isSelected ? config.color : theme.border,
                      }
                    ]}
                  >
                    <Text style={styles.leaveTypeEmoji}>{config.emoji}</Text>
                    <Text
                      style={[
                        getTypographyStyle('xs', isSelected ? 'bold' : 'medium'),
                        { color: isSelected ? config.color : theme.text, textAlign: 'center' }
                      ]}
                      numberOfLines={1}
                    >
                      {type.replace(' Leave', '')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSection>

          {/* Shift Type Selection - Horizontal Buttons */}
          <FormSection title="Shift Type">
            <View style={styles.shiftTypeRow}>
              {SHIFT_TYPES.map((shift) => {
                const isSelected = shiftType === shift.value;
                return (
                  <TouchableOpacity
                    key={shift.value}
                    onPress={() => setShiftType(shift.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.shiftTypeButton,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      }
                    ]}
                  >
                    <Ionicons
                      name={shift.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text
                      style={[
                        getTypographyStyle('sm', isSelected ? 'bold' : 'medium'),
                        { color: isSelected ? '#FFFFFF' : theme.text }
                      ]}
                    >
                      {shift.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormSection>

          {/* Date Selection */}
          <FormSection title="Select Dates *">
            <View style={styles.dateHeader}>
              {selectedDates.length > 0 && (
                <Pressable onPress={() => setSelectedDates([])}>
                  <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.primary }]}>
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
                <Text style={[getTypographyStyle('sm', 'semibold'), { color: theme.text, marginBottom: spacing.sm }]}>
                  Selected Dates ({selectedDates.length})
                </Text>
                <View style={styles.selectedDatesList}>
                  {[...selectedDates].sort((a, b) => a.getTime() - b.getTime()).map((date) => (
                    <View
                      key={date.getTime()}
                      style={[
                        styles.selectedDateChip,
                        {
                          backgroundColor: getOpacityColor(theme.primary, 0.12),
                          borderColor: theme.primary
                        }
                      ]}
                    >
                      <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.primary }]}>
                        {format(date, 'MMM dd')}
                      </Text>
                      <Pressable
                        onPress={() => setSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()))}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={16} color={theme.primary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </FormSection>

          {/* Reason */}
          <FormSection title="Reason *">
            <Input
              label=""
              value={reason}
              onChangeText={setReason}
              placeholder="Provide a reason for your leave request..."
              multiline
              leftIcon="chatbox-outline"
            />
          </FormSection>

          {/* Leave Summary */}
          {summary && (
            <FormSection title="Leave Summary">
              <Card variant="elevated" shadow="md" padding="lg">
                {/* Summary Header */}
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: getOpacityColor(currentLeaveConfig?.color || theme.primary, 0.15) }]}>
                    <Ionicons
                      name={currentLeaveConfig?.icon || 'document-text'}
                      size={24}
                      color={currentLeaveConfig?.color || theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>
                      Leave Application
                    </Text>
                    <Text style={[getTypographyStyle('xs', 'regular'), { color: theme.textSecondary }]}>
                      Review your leave request
                    </Text>
                  </View>
                </View>

                {/* Summary Rows */}
                <View style={styles.summaryContent}>
                  <SummaryRow
                    icon="calendar"
                    label="Leave Type"
                    value={summary.leaveType}
                    valueColor={currentLeaveConfig?.color}
                    theme={theme}
                  />
                  <SummaryRow
                    icon="time"
                    label="Shift Type"
                    value={SHIFT_TYPES.find(s => s.value === summary.shiftType)?.label || 'Full Day'}
                    theme={theme}
                  />
                  <SummaryRow
                    icon="stats-chart"
                    label="Total Days"
                    value={`${summary.totalDays} ${summary.totalDays === 1 ? 'day' : 'days'}`}
                    valueColor={theme.primary}
                    bold
                    theme={theme}
                  />
                  <SummaryRow
                    icon="wallet"
                    label="Available Balance"
                    value={`${summary.availableBalance} days`}
                    valueColor="#10B981"
                    theme={theme}
                  />
                </View>

                {/* Selected Dates */}
                <View style={[styles.summaryDatesSection, { borderTopColor: theme.border }]}>
                  <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginBottom: spacing.sm }]}>
                    Selected Dates:
                  </Text>
                  <View style={styles.summaryDatesList}>
                    {summary.dates.map((date) => (
                      <View
                        key={date.getTime()}
                        style={[styles.summaryDateChip, { backgroundColor: getOpacityColor(theme.primary, 0.1) }]}
                      >
                        <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.primary }]}>
                          {format(date, 'MMM dd')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Info Banner */}
                <View style={[styles.infoBanner, { backgroundColor: getOpacityColor('#3B82F6', 0.1), borderColor: '#3B82F6' }]}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={[getTypographyStyle('xs', 'medium'), { color: '#1E40AF', marginLeft: spacing.sm, flex: 1 }]}>
                    Leave approval is subject to manager's discretion.
                  </Text>
                </View>
              </Card>
            </FormSection>
          )}

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <Button
              title={isSubmitting ? 'Submitting Leave...' : 'Submit Leave Application'}
              onPress={() => !isSubmitting && handleSubmit()}
              disabled={isSubmitting || !leaveType || selectedDates.length === 0 || !reason.trim()}
              loading={isSubmitting}
              size="lg"
              leftIcon="paper-plane"
              fullWidth
            />
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// Summary Row Component
interface SummaryRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  theme: any;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ icon, label, value, valueColor, bold, theme }) => (
  <View style={styles.summaryRow}>
    <View style={styles.summaryRowLeft}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginLeft: spacing.sm }]}>
        {label}
      </Text>
    </View>
    <Text style={[
      getTypographyStyle('sm', bold ? 'bold' : 'semibold'),
      { color: valueColor || theme.text }
    ]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  leaveTypeCard: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 4,
  },
  leaveTypeEmoji: {
    fontSize: 22,
  },
  shiftTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  shiftTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  selectedDatesContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDatesSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  summaryDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  summaryDateChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  submitSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
});
