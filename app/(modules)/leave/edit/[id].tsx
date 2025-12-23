import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, Alert, StatusBar, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useLeave, useUpdateLeave, useLeaveTypes } from '@/hooks/useHRQueries';
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

export default function EditLeaveScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { id } = useLocalSearchParams();
    const leaveId = typeof id === 'string' ? parseInt(id, 10) : 0;

    const { data: leaveData, isLoading } = useLeave(leaveId);
    const { mutate: updateLeave, isPending: isUpdating } = useUpdateLeave();
    const { data: leaveTypes = [] } = useLeaveTypes();

    // Form state
    const [selectionMode, setSelectionMode] = useState<'range' | 'multi'>('multi');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
    const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
    const [reason, setReason] = useState('');

    // Populate form when data loads
    useEffect(() => {
        if (leaveData) {
            setLeaveType(leaveData.leave_type || leaveData.leave_type_name);
            setShiftType(leaveData.shift_type || 'full_shift');
            setReason(leaveData.reason || '');

            // Check if it's multi-date
            if (leaveData.dates && leaveData.dates.length > 0) {
                setSelectionMode('multi');
                setSelectedDates(leaveData.dates.map((d: string) => new Date(d)));
            } else if (leaveData.from_date && leaveData.to_date) {
                setSelectionMode('range');
                setFromDate(new Date(leaveData.from_date));
                setToDate(new Date(leaveData.to_date));
            }
        }
    }, [leaveData]);

    const calculateDays = () => {
        if (selectionMode === 'range') {
            if (!fromDate || !toDate) return 0;
            const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        } else {
            return selectedDates.length;
        }
    };

    const days = calculateDays();

    const handleSubmit = () => {
        if (!leaveType || !reason.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        let payloadFromDate: string = '';
        let payloadToDate: string = '';
        let specificDates: string[] = [];

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        if (selectionMode === 'range') {
            if (!fromDate || !toDate) {
                Alert.alert('Missing Dates', 'Please select a date range.');
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

        // Map leave type name to ID
        const leaveTypeId = leaveTypes.find((lt: any) =>
            lt.name === leaveType || lt.leave_type === leaveType || lt.leave_type_name === leaveType
        )?.id;

        updateLeave({
            id: leaveId,
            data: {
                leave_type: leaveTypeId,
                from_date: payloadFromDate,
                to_date: payloadToDate,
                shift_type: shiftType,
                reason: reason.trim(),
                specific_dates: selectionMode === 'multi' ? specificDates : undefined,
            }
        }, {
            onSuccess: () => {
                Alert.alert('Success', 'Leave request updated successfully!', [
                    {
                        text: 'OK',
                        onPress: () => router.push(`/(modules)/leave/${leaveId}` as any)
                    }
                ]);
            },
            onError: (err: any) => {
                Alert.alert('Error', err.message || 'Failed to update.');
            }
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.text }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Custom Header */}
            <View style={{ height: 100, overflow: 'hidden' }}>
                <LinearGradient
                    colors={isDark ? ['#341B34', '#472447'] : ['#6D376D', '#5A2D5A']}
                    style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 16, paddingHorizontal: 20 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Edit Leave Request</Text>
                        </Animated.View>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Leave Type Selection */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Leave Type</Text>
                    <View style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 12 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 40 }}>
                            {LEAVE_TYPES.map((type) => {
                                const isSelected = leaveType === type;
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setLeaveType(type)}
                                    >
                                        <View
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
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Animated.View>

                {/* Duration Section */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
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
                                <TouchableOpacity
                                    key={mode}
                                    onPress={() => setSelectionMode(mode)}
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
                                </TouchableOpacity>
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
                            <View style={{ marginTop: 24 }}>
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
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Session</Text>
                    <View style={{ flexDirection: 'row', backgroundColor: theme.surface, padding: 4, borderRadius: 16 }}>
                        {SHIFT_TYPES.map((shift) => {
                            const isSelected = shiftType === shift.value;
                            return (
                                <TouchableOpacity
                                    key={shift.value}
                                    onPress={() => setShiftType(shift.value)}
                                    style={{ flex: 1 }}
                                >
                                    <View style={{
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
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Reason */}
                <Animated.View entering={FadeInDown.delay(500).springify()}>
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

            {/* Submit Button FAB */}
            <Animated.View
                entering={SlideInRight.delay(600).springify()}
                style={{
                    position: 'absolute', bottom: 30, left: 20, right: 20,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 10
                }}
            >
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isUpdating}
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
                        {isUpdating ? (
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Updating...</Text>
                        ) : (
                            <>
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Update Request</Text>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}
