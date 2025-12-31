import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { DatePicker } from '@/components/core/DatePicker';
import { SuccessDialog } from '@/components/core/SuccessDialog';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { shadows, spacing, borderRadius } from '@/constants/designSystem';
import type { LeaveType, ShiftType } from '@/types/hr';

const LEAVE_TYPES: LeaveType[] = [
  'Annual Leave',
  'Sick Leave',
  'Casual Leave',
  'Study Leave',
  'Optional Leave',
];

const LEAVE_ICONS: Record<LeaveType, keyof typeof Ionicons.glyphMap> = {
  'Annual Leave': 'sunny',
  'Sick Leave': 'medkit',
  'Casual Leave': 'cafe',
  'Study Leave': 'school',
  'Optional Leave': 'calendar',
};

const LEAVE_COLORS: Record<LeaveType, string> = {
  'Annual Leave': '#F59E0B',
  'Sick Leave': '#EF4444',
  'Casual Leave': '#10B981',
  'Study Leave': '#8B5CF6',
  'Optional Leave': '#6366F1',
};

const SHIFT_TYPES: { value: ShiftType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'full_shift', label: 'Full Day', icon: 'sunny' },
  { value: 'first_half', label: '1st Half', icon: 'partly-sunny' },
  { value: 'second_half', label: '2nd Half', icon: 'moon' },
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
  const [selectionMode, setSelectionMode] = useState<'range' | 'multi'>('range');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
  const [reason, setReason] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Derived state
  const calculateDays = () => {
    if (selectionMode === 'range') {
      if (!fromDate || !toDate) return 0;
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } else {
      return selectedDates.length;
    }
  };

  const days = calculateDays();
  const balanceCount = leaveType && balance ?
    ((balance[`${leaveType.toLowerCase().replace(' ', '_')}_total` as keyof typeof balance] as number) || 0) -
    ((balance[`${leaveType.toLowerCase().replace(' ', '_')}_used` as keyof typeof balance] as number) || 0) : 0;

  const handleSubmit = async () => {
    if (!leaveType || !reason.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    let payloadFromDate: string = '';
    let payloadToDate: string = '';
    let specificDates: string[] = [];

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (selectionMode === 'range') {
      if (!fromDate || !toDate) {
        Alert.alert('Missing Dates', 'Please select a date range.');
        return;
      }
      if (toDate < fromDate) {
        Alert.alert('Invalid Dates', 'End date cannot be before start date.');
        return;
      }
      payloadFromDate = formatDate(fromDate);
      payloadToDate = formatDate(toDate);
    } else {
      if (selectedDates.length === 0) {
        Alert.alert('Missing Dates', 'Please select at least one date.');
        return;
      }
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      payloadFromDate = formatDate(sortedDates[0]);
      payloadToDate = formatDate(sortedDates[sortedDates.length - 1]);
      specificDates = sortedDates.map(formatDate);
    }

    try {
      createLeave({
        leave_type: leaveType,
        from_date: payloadFromDate,
        to_date: payloadToDate,
        shift_type: shiftType,
        reason: reason.trim(),
        documents: [],
        specific_dates: selectionMode === 'multi' ? specificDates : undefined,
      }, {
        onSuccess: async (data) => {
          try {
            await trackLeaveRequest(leaveType as string, payloadFromDate, payloadToDate, (data as any)?.id);
          } catch (e) { console.log(e) }
          setShowSuccessDialog(true);
        },
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to submit.')
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const styles = createStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <ModuleHeader title="Apply Leave" showNotifications={false} />

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>
                  {balanceLoading ? '...' : balanceCount}
                  <Text style={styles.balanceDays}> days</Text>
                </Text>
              </View>
              <View style={[styles.balanceIcon, { backgroundColor: leaveType ? LEAVE_COLORS[leaveType] + '20' : theme.primary + '20' }]}>
                <Ionicons name="wallet-outline" size={24} color={leaveType ? LEAVE_COLORS[leaveType] : theme.primary} />
              </View>
            </View>
            <View style={styles.balanceInfo}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.balanceInfoText}>
                {leaveType ? `For ${leaveType}` : 'Select a leave type below'}
              </Text>
            </View>
          </Animated.View>

          {/* Leave Type Selection */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.sectionTitle}>Leave Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.leaveTypeScroll}
            >
              {LEAVE_TYPES.map((type) => {
                const isSelected = leaveType === type;
                const color = LEAVE_COLORS[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => setLeaveType(type)}
                    style={[
                      styles.leaveTypeChip,
                      isSelected && { backgroundColor: color + '15', borderColor: color }
                    ]}
                  >
                    <View style={[styles.leaveTypeIcon, { backgroundColor: isSelected ? color : theme.background }]}>
                      <Ionicons name={LEAVE_ICONS[type]} size={18} color={isSelected ? '#fff' : theme.textSecondary} />
                    </View>
                    <Text style={[
                      styles.leaveTypeText,
                      isSelected && { color: color, fontWeight: '700' }
                    ]}>
                      {type.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Duration Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.modeToggle}>
                {(['range', 'multi'] as const).map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setSelectionMode(mode);
                      setFromDate(null);
                      setToDate(null);
                      setSelectedDates([]);
                    }}
                    style={[
                      styles.modeButton,
                      selectionMode === mode && styles.modeButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      selectionMode === mode && { color: theme.primary }
                    ]}>
                      {mode === 'range' ? 'Range' : 'Multi-Date'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {selectionMode === 'range' ? (
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <DatePicker
                    label="From"
                    value={fromDate}
                    onChange={setFromDate}
                    minDate={new Date()}
                    placeholder="Start"
                  />
                </View>
                <View style={styles.dateArrow}>
                  <Ionicons name="arrow-forward" size={20} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePicker
                    label="To"
                    value={toDate}
                    onChange={setToDate}
                    minDate={fromDate || new Date()}
                    placeholder="End"
                  />
                </View>
              </View>
            ) : (
              <DatePicker
                label="Select Specific Dates"
                mode="multiple"
                dates={selectedDates}
                onDatesChange={setSelectedDates}
                minDate={new Date()}
                placeholder="Tap to select dates..."
              />
            )}

            {/* Days Indicator */}
            {days > 0 && (
              <View style={styles.daysCard}>
                <View style={styles.daysIcon}>
                  <Text style={{ fontSize: 18 }}>🗓️</Text>
                </View>
                <View>
                  <Text style={styles.daysLabel}>Total Duration</Text>
                  <Text style={styles.daysValue}>{days} Days</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Session Selection */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={styles.sectionTitle}>Session</Text>
            <View style={styles.sessionContainer}>
              {SHIFT_TYPES.map((shift) => {
                const isSelected = shiftType === shift.value;
                return (
                  <Pressable
                    key={shift.value}
                    onPress={() => setShiftType(shift.value)}
                    style={[styles.sessionButton, isSelected && styles.sessionButtonActive]}
                  >
                    <Ionicons name={shift.icon} size={16} color={isSelected ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.sessionText, isSelected && styles.sessionTextActive]}>
                      {shift.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Reason */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Why are you taking leave?"
              placeholderTextColor={theme.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={[styles.submitContainer, { backgroundColor: theme.background }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || !leaveType || !reason.trim() || days === 0}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: '#6D376D',
              opacity: (isSubmitting || !leaveType || !reason.trim() || days === 0) ? 0.5 : (pressed ? 0.9 : 1)
            }
          ]}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Text>
          {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </Pressable>
      </View>

      {/* Success Dialog */}
      <SuccessDialog
        visible={showSuccessDialog}
        title="Request Sent"
        message="Your leave request has been submitted successfully!"
        buttonText="Great!"
        onConfirm={() => {
          setShowSuccessDialog(false);
          router.back();
          setTimeout(() => {
            router.push('/(modules)/leave' as any);
          }, 100);
        }}
      />
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 120,
    gap: spacing.xl,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.text,
    marginTop: 4,
  },
  balanceDays: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: 6,
  },
  balanceInfoText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Leave Type
  leaveTypeScroll: {
    gap: 12,
    paddingRight: 20,
  },
  leaveTypeChip: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    width: 90,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  leaveTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  leaveTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    ...shadows.sm,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: isDark ? '#2A242E' : '#F8F4F9',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  // Date Row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateArrow: {
    marginTop: 24,
  },
  // Days Card
  daysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2A242E' : '#F8F4F9',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: 12,
  },
  daysIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#3A343E' : '#E0CCE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  daysValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  // Session
  sessionContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    ...shadows.sm,
  },
  sessionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  sessionButtonActive: {
    backgroundColor: theme.background,
    ...shadows.sm,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  sessionTextActive: {
    fontWeight: '700',
    color: theme.text,
  },
  // Reason
  reasonInput: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: theme.text,
    ...shadows.sm,
  },
  // Submit
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.base,
    backgroundColor: theme.background,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.xl,
    gap: 8,
    ...shadows.lg,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
