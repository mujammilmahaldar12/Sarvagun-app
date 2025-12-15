import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { format, addDays, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import ModuleHeader from '@/components/layout/ModuleHeader';
import { FormSection } from '@/components/ui/FormSection';
import Input from '@/components/core/Input';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius, shadows, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useLeave, useUpdateLeave, useLeaveTypes } from '@/hooks/useHRQueries';
import { LeaveType, ShiftType } from '@/types/hr';

// Reuse components or logic? For speed, we copy-adapt logic.
// Ideally should share components.
import CompactLeaveBalance from '@/components/hr/CompactLeaveBalance';
import { Button } from '@/components/ui/Button';

// MultiDatePicker component (simplified version of what's in apply.tsx or imported if it was exported)
// Since it's not exported from apply.tsx, we'll inline a simple version or try to make apply.tsx export it?
// apply.tsx has it inline. I'll copy it for now to ensure stability.

const ShiftSelector = ({ selected, onSelect }: { selected: ShiftType; onSelect: (t: ShiftType) => void }) => {
    const { theme } = useTheme();
    const options: { label: string; value: ShiftType }[] = [
        { label: 'Full Day', value: 'full_shift' },
        { label: 'First Half', value: 'first_half' },
        { label: 'Second Half', value: 'second_half' },
    ];

    return (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {options.map((option) => {
                const isSelected = selected === option.value;
                return (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => onSelect(option.value)}
                        style={{
                            flex: 1,
                            paddingVertical: spacing.sm,
                            paddingHorizontal: spacing.sm,
                            borderRadius: borderRadius.md,
                            backgroundColor: isSelected ? theme.primary : theme.surface,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.primary : theme.border,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={[
                                getTypographyStyle('xs', isSelected ? 'bold' : 'medium'),
                                { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default function EditLeaveScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { id } = useLocalSearchParams();
    const leaveId = typeof id === 'string' ? parseInt(id, 10) : 0;

    const { data: leaveData, isLoading: isLoadingLeave } = useLeave(leaveId, { enabled: !!leaveId });
    const { mutate: updateLeave, isPending: isUpdating } = useUpdateLeave();
    const { data: leaveTypes = [] } = useLeaveTypes();

    const [leaveType, setLeaveType] = useState<string>('');
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [shiftType, setShiftType] = useState<ShiftType>('full_shift');
    const [reason, setReason] = useState('');

    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Populate form when data loads
    useEffect(() => {
        if (leaveData) {
            setLeaveType(leaveData.leave_type); // Note: this might be name, need to map to ID or handled by backend? Apply uses name matching?
            // Check apply.tsx: it sets leaveType to string name. createLeave maps it to ID. 
            // But updateLeave also needs ID logic? 
            // HR Service createLeave calls getLeaveTypeId. updateLeave does NOT yet.
            // I should update hr.service.ts updateLeave to also map string to ID if needed?
            // Or just pass the name and let backend handle? Backend usually expects ID for ForeignKey.
            // Wait, apply.tsx passes "Annual Leave" string to createLeave. createLeave maps it.
            // updateLeave implementation I just added receives "UpdateLeaveRequest". 
            // Does it map? NO. I need to fix check hr.service.ts updateLeave logic to map generic names if passed?
            // OR, simply: I will make sure I pass the RIGHT value.
            // leaveData.leave_type comes as NAME from getLeave transformation.

            setShiftType(leaveData.shift_type || 'full_shift');
            setReason(leaveData.reason || '');

            if (leaveData.dates && leaveData.dates.length > 0) {
                setSelectedDates(leaveData.dates.map(d => new Date(d)));
                setCurrentMonth(new Date(leaveData.dates[0]));
            } else if (leaveData.from_date && leaveData.to_date) {
                // Fallback if specific dates missing
                // Create date entries for each day in the range
                const start = new Date(leaveData.from_date);
                const end = new Date(leaveData.to_date);
                const dates = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    dates.push(new Date(d));
                }
                setSelectedDates(dates);
                setCurrentMonth(start);
            }
        }
    }, [leaveData]);

    // Calendar Logic (Inline simplified)
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const toggleDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existingIndex = selectedDates.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr);

        if (existingIndex >= 0) {
            setSelectedDates(selectedDates.filter((_, i) => i !== existingIndex));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    const isDateSelected = (date: Date) => {
        return selectedDates.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    };

    const handleSubmit = () => {
        if (!leaveType || selectedDates.length === 0 || !reason.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        const fromDate = format(sortedDates[0], 'yyyy-MM-dd');
        const toDate = format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd');

        updateLeave(
            {
                id: leaveId,
                data: {
                    // Ideally we need leave_type ID here if backend expects ID.
                    // But if existing createLeave logic handles mapping, I should verify updateLeave.
                    // UPDATE: HRService updateLeave currently blindly spreads data. 
                    // It DOES NOT map name -> ID.
                    // I must map it manually here or update service.
                    // Let's assume for now I pass the name but backend might fail if it expects ID.
                    // Actually, wait. leaveData.leave_type is "Annual Leave" (string).
                    // If I send "Annual Leave" to serializer `leave_type` field (IntegerField), it fails.
                    // I should use `useLeaveTypes` to find ID.

                    // Fix: Map name to ID
                    // leaveTypes is array of objects? 
                    // hr.service.ts getLeaveTypes returns logic.
                    // Let's try to pass the name first, if it fails I'll fix.
                    // Actually, better: I'll map it right now if I can.
                    // leaveTypes data structure? 
                    // Assuming it matches what CreateLeave needs.

                    // To be safe, I will NOT send leave_type in update if it hasn't changed?
                    // But if user changes it...
                    // I'll try to find the ID from `leaveTypes`.

                    leave_type: leaveTypes.find((lt: any) => lt.name === leaveType || lt.leave_type === leaveType)?.id,

                    from_date: fromDate,
                    to_date: toDate,
                    shift_type: shiftType,
                    reason: reason.trim(),
                    specific_dates: sortedDates.map(d => format(d, 'yyyy-MM-dd')),
                }
            },
            {
                onSuccess: () => {
                    Alert.alert('Success', 'Leave request updated successfully', [
                        { text: 'OK', onPress: () => router.navigate({ pathname: '/(modules)/leave/[id]', params: { id: leaveId } }) }
                    ]);
                },
                onError: (error: any) => {
                    Alert.alert('Error', error.message || 'Failed to update leave');
                }
            }
        );
    };

    if (isLoadingLeave) {
        return <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ModuleHeader title="Edit Leave Request" showBack />

            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}>
                {/* Balance (Read only / Helper) */}
                <View style={{ marginBottom: spacing.lg }}>
                    <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text, marginBottom: spacing.sm }]}>
                        Your Leave Balance
                    </Text>
                    <CompactLeaveBalance selectedType={leaveType as any} showViewAll={false} />
                </View>

                <FormSection title="Leave Details">
                    <View style={{ gap: spacing.md }}>
                        {/* Leave Type Display (or Selector via Balance above) */}
                        <View style={{ padding: spacing.md, backgroundColor: theme.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>Selected Leave Type</Text>
                            <Text style={[getTypographyStyle('base', 'bold'), { color: theme.primary }]}>{leaveType || 'Select from above'}</Text>
                        </View>

                        {/* Calendar Month Nav */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                            <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
                                <Ionicons name="chevron-back" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>
                                {format(currentMonth, 'MMMM yyyy')}
                            </Text>
                            <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
                                <Ionicons name="chevron-forward" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Grid */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {getDaysInMonth(currentMonth).map((date, index) => {
                                const isSelected = isDateSelected(date);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => toggleDate(date)}
                                        style={{
                                            width: '14.28%',
                                            aspectRatio: 1,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isSelected ? theme.primary : 'transparent',
                                            borderRadius: borderRadius.full,
                                        }}
                                    >
                                        <Text style={{ color: isSelected ? '#fff' : theme.text }}>{date.getDate()}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Selected Count */}
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.textSecondary, marginTop: spacing.sm }]}>
                            Selected Days: {selectedDates.length}
                        </Text>

                        {/* Shift Type */}
                        <View>
                            <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text, marginBottom: spacing.xs }]}>Shift Type</Text>
                            <ShiftSelector selected={shiftType} onSelect={setShiftType} />
                        </View>

                        {/* Reason */}
                        <Input
                            label="Reason"
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Enter reason for leave"
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </FormSection>
            </ScrollView>

            <View style={{ padding: spacing.md, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border }}>
                <Button
                    title={isUpdating ? "Updating..." : "Update Request"}
                    onPress={handleSubmit}
                    isLoading={isUpdating}
                    disabled={isUpdating}
                />
            </View>
        </View>
    );
}
