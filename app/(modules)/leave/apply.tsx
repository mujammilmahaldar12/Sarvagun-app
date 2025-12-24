import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Animated as RNAnimated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { DatePicker } from '@/components/core/DatePicker';
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

const LEAVE_COLORS: Record<LeaveType, [string, string]> = {
  'Annual Leave': ['#F59E0B', '#D97706'],
  'Sick Leave': ['#EF4444', '#B91C1C'],
  'Casual Leave': ['#10B981', '#059669'],
  'Study Leave': ['#8B5CF6', '#7C3AED'],
  'Optional Leave': ['#6366F1', '#4F46E5'],
};

const SHIFT_TYPES: { value: ShiftType; label: string; icon: string }[] = [
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
  // New: Selection Mode State
  const [selectionMode, setSelectionMode] = useState<'range' | 'multi'>('range');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
  const [reason, setReason] = useState('');

  // Derived state
  const calculateDays = () => {
    if (selectionMode === 'range') {
      if (!fromDate || !toDate) return 0;
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    } else {
      // Multi mode: simply count unique selected dates
      return selectedDates.length;
    }
  };

  const days = calculateDays();
  const balanceCount = leaveType && balance ?
    ((balance[`${leaveType.toLowerCase().replace(' ', '_')}_total` as keyof typeof balance] as number) || 0) -
    ((balance[`${leaveType.toLowerCase().replace(' ', '_')}_used` as keyof typeof balance] as number) || 0) : 0;

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called - starting submission process');
    console.log('📋 Form state:', { leaveType, reason: reason.trim(), selectionMode, fromDate, toDate, selectedDates });

    if (!leaveType || !reason.trim()) {
      console.log('❌ Validation failed: Missing fields');
      Alert.alert('Missing Fields', 'Please fill in all required fields to proceed.');
      return;
    }

    let payloadFromDate: string = '';
    let payloadToDate: string = '';
    let specificDates: string[] = [];

    // Use local date formatting to avoid timezone issues
    // toISOString() converts to UTC which can shift dates back by hours
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
        Alert.alert('Invalid Dates', 'The "To Date" cannot be before the "From Date".');
        return;
      }
      payloadFromDate = formatDate(fromDate);
      payloadToDate = formatDate(toDate);
    } else {
      if (selectedDates.length === 0) {
        Alert.alert('Missing Dates', 'Please select at least one date.');
        return;
      }
      // Sort dates to determine min/max for the basic fields
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

          Alert.alert('Request Sent', 'Your leave request has been submitted successfully!', [
            {
              text: 'Great!',
              onPress: () => {
                console.log('✅ Alert confirmed, navigating to leave list...');
                // Use setTimeout to ensure navigation happens after alert dismisses
                setTimeout(() => {
                  router.back();
                  // Double ensure by also pushing to the list
                  setTimeout(() => {
                    router.push('/(modules)/leave' as any);
                  }, 100);
                }, 100);
              }
            }
          ]);
        },
        onError: (err: any) => Alert.alert('Error', err.message || 'Failed to submit.')
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Custom Header Background - REDUCED SIZE */}
      <View style={{ height: 100, overflow: 'hidden' }}>
        <LinearGradient
          colors={isDark ? ['#341B34', '#472447'] : ['#6D376D', '#5A2D5A']}
          style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 16, paddingHorizontal: 20 }}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Apply Leave</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Plan your time off
            </Text>
          </Animated.View>
        </LinearGradient>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Balance Card - Premium Look */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <LinearGradient
              colors={leaveType ? LEAVE_COLORS[leaveType] : ['#6D376D', '#8B5CF6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>AVAILABLE BALANCE</Text>
                  <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 8 }}>
                    {balanceLoading ? '...' : balanceCount}
                    <Text style={{ fontSize: 18, fontWeight: '500' }}> days</Text>
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                  <Ionicons name="wallet-outline" size={24} color="#fff" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Ionicons name="information-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                  {leaveType ? `For ${leaveType}` : 'Select a leave type'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Leave Type Selection - FIXED CLIPPING */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Leave Type</Text>
            {/* Extra vertical padding to prevent shadow clipping */}
            <View style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 40 }}>
                {LEAVE_TYPES.map((type, index) => {
                  const isSelected = leaveType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setLeaveType(type)}
                      style={{ transform: [{ scale: isSelected ? 1.05 : 1 }] }}
                    >
                      <Animated.View
                        layout={Layout.springify()}
                        style={{
                          width: 110, height: 110,
                          borderRadius: 20,
                          backgroundColor: isSelected ? (isDark ? '#472447' : '#F8F4F9') : theme.surface,
                          borderWidth: 2,
                          borderColor: isSelected ? LEAVE_COLORS[type][0] : 'transparent',
                          justifyContent: 'center', alignItems: 'center',
                          shadowColor: isSelected ? LEAVE_COLORS[type][0] : "#000",
                          shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
                          shadowOpacity: isSelected ? 0.3 : 0.05,
                          shadowRadius: isSelected ? 12 : 8,
                          elevation: isSelected ? 8 : 3
                        }}
                      >
                        <View style={{
                          width: 44, height: 44, borderRadius: 22,
                          backgroundColor: isSelected ? LEAVE_COLORS[type][0] : theme.background,
                          justifyContent: 'center', alignItems: 'center', marginBottom: 10
                        }}>
                          <Ionicons name={LEAVE_ICONS[type]} size={24} color={isSelected ? '#fff' : theme.textSecondary} />
                        </View>
                        <Text style={{
                          fontSize: 12, fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? (isDark ? '#fff' : '#6D376D') : theme.textSecondary,
                          textAlign: 'center'
                        }}>
                          {type.split(' ')[0]}
                        </Text>
                      </Animated.View>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Duration Section with Multi-Select Toggle */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Duration</Text>
              <View style={{
                flexDirection: 'row',
                backgroundColor: theme.surface,
                padding: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.border
              }}>
                {(['range', 'multi'] as const).map(mode => (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setSelectionMode(mode);
                      setFromDate(null);
                      setToDate(null);
                      setSelectedDates([]);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: selectionMode === mode ? (isDark ? '#472447' : '#F8F4F9') : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: selectionMode === mode ? theme.primary : theme.textSecondary
                    }}>
                      {mode === 'range' ? 'Range' : 'Multi-Date'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {selectionMode === 'range' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <DatePicker
                    label="From"
                    value={fromDate}
                    onChange={setFromDate}
                    minDate={new Date()}
                    placeholder="Start"
                  />
                </View>
                <View style={{ marginTop: 24, justifyContent: 'center' }}>
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
              <View>
                <DatePicker
                  label="Select Specific Dates"
                  mode="multiple"
                  dates={selectedDates}
                  onDatesChange={setSelectedDates}
                  minDate={new Date()}
                  placeholder="Tap to select dates..."
                />

                {/* Visual feedback for the calculated range */}
                {selectedDates.length > 0 && (
                  <View style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border
                  }}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 6, fontWeight: '600' }}>
                      Effective Range (Auto-calculated for submission)
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>START DATE</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                          {[...selectedDates].sort((a, b) => a.getTime() - b.getTime())[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={theme.primary} style={{ marginHorizontal: 8 }} />
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>END DATE</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                          {[...selectedDates].sort((a, b) => a.getTime() - b.getTime())[selectedDates.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Days Indicator */}
            {days > 0 && (
              <Animated.View
                entering={FadeInUp.springify()}
                style={{
                  marginTop: 16,
                  backgroundColor: isDark ? '#472447' : '#F8F4F9',
                  padding: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#5A2D5A' : '#E0CCE5'
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#5A2D5A' : '#E0CCE5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 18 }}>🗓️</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '500' }}>Total Duration</Text>
                  <Text style={{ fontSize: 18, color: theme.text, fontWeight: '800' }}>{days} Days</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Shift Selection */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Session</Text>
            <View style={{ flexDirection: 'row', backgroundColor: theme.surface, padding: 4, borderRadius: 16 }}>
              {SHIFT_TYPES.map((shift) => {
                const isSelected = shiftType === shift.value;
                return (
                  <Pressable
                    key={shift.value}
                    onPress={() => setShiftType(shift.value)}
                    style={{ flex: 1 }}
                  >
                    <Animated.View style={{
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? theme.background : 'transparent',
                      borderRadius: 12,
                      shadowColor: "#000",
                      shadowOpacity: isSelected ? 0.1 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 2 : 0,
                      flexDirection: 'row',
                      gap: 6
                    }}>
                      <Ionicons name={shift.icon as any} size={16} color={isSelected ? theme.primary : theme.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '500', color: isSelected ? theme.text : theme.textSecondary }}>
                        {shift.label}
                      </Text>
                    </Animated.View>
                  </Pressable>
                )
              })}
            </View>
          </Animated.View>

          {/* Reason */}
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Reason</Text>
            <TextInput
              style={{
                backgroundColor: theme.surface,
                borderRadius: 20,
                padding: 16,
                height: 120,
                textAlignVertical: 'top',
                fontSize: 16,
                color: theme.text,
                borderWidth: 1,
                borderColor: 'transparent'
              }}
              placeholder="Why are you taking leave?"
              placeholderTextColor={theme.textSecondary}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button FAB */}
      <Animated.View
        entering={SlideInRight.delay(800).springify()}
        style={{
          position: 'absolute', bottom: 30, left: 20, right: 20,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10
        }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <LinearGradient
            colors={['#6D376D', '#5A2D5A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: 24,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12
            }}
          >
            {isSubmitting ? (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Sending Request...</Text>
            ) : (
              <>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Submit Request</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>

    </View>
  );
}
