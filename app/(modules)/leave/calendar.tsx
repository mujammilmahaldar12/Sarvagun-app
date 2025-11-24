import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { useMyLeaves } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import { getStatusColor, shadows, spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LeaveCalendarScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: leavesData, isLoading } = useMyLeaves();
  const leaves = Array.isArray(leavesData) ? leavesData : leavesData?.results || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const leaveDates = leaves.flatMap((leave: any) => {
    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    return eachDayOfInterval({ start: fromDate, end: toDate }).map(date => ({ date, leave }));
  });

  const getLeavesForDate = (date: Date) => leaveDates.filter((ld: any) => isSameDay(ld.date, date));

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Leave Calendar" showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[getTypographyStyle('sm', 'medium'), { marginTop: spacing.md, color: theme.textSecondary }]}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Calendar */}
            <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border, ...shadows.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
                <TouchableOpacity onPress={goToPreviousMonth} accessibilityLabel="Previous month" accessibilityRole="button" style={{ padding: spacing.md }}>
                  <Ionicons name="chevron-back" size={iconSizes.md} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[getTypographyStyle('lg', 'bold'), { color: theme.text }]}>
                  {format(currentDate, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity onPress={goToNextMonth} accessibilityLabel="Next month" accessibilityRole="button" style={{ padding: spacing.md }}>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                {DAYS.map(day => (
                  <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[getTypographyStyle('xs', 'semibold'), { color: theme.textSecondary }]}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array(monthStart.getDay()).fill(null).map((_, i) => (
                  <View key={`empty-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />
                ))}
                {daysInMonth.map((date, idx) => {
                  const dayLeaves = getLeavesForDate(date);
                  const hasLeave = dayLeaves.length > 0;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isCurrentDay = isToday(date);
                  const leaveStatus = hasLeave ? dayLeaves[0].leave.status : null;

                  let statusColor: any = null;
                  let bgColor: any = 'transparent';
                  let borderColor: any = theme.border;

                  if (hasLeave) {
                    statusColor = getStatusColor(leaveStatus, isDark);
                    bgColor = getOpacityColor(statusColor.bg, 0.3);
                    borderColor = statusColor.border;
                  } else if (isSelected || isCurrentDay) {
                    bgColor = getOpacityColor(theme.primary, 0.15);
                    borderColor = theme.primary;
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedDate(date)}
                      accessibilityLabel={`${format(date, 'MMM dd')}${hasLeave ? ` - ${leaveStatus}` : ''}`}
                      accessibilityRole="button"
                      style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}
                    >
                      <View
                        style={{
                          flex: 1,
                          borderRadius: borderRadius.md,
                          backgroundColor: bgColor,
                          borderWidth: isSelected || isCurrentDay ? 2 : 1,
                          borderColor: borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        } as any}
                      >
                        <Text style={[getTypographyStyle('sm', isCurrentDay ? 'bold' : 'semibold'), { color: theme.text }]}>
                          {format(date, 'd')}
                        </Text>
                        {hasLeave && <View style={{ marginTop: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: borderColor }} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Date Leaves */}
            {selectedDate && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, marginBottom: spacing.md }]}>
                  Leaves on {format(selectedDate, 'MMM dd, yyyy')}
                </Text>
                {getLeavesForDate(selectedDate).length === 0 ? (
                  <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.xl, borderWidth: 1, borderColor: theme.border, alignItems: 'center', ...shadows.sm }}>
                    <Text style={[getTypographyStyle('base', 'bold'), { color: theme.text }]}>No Leaves</Text>
                  </View>
                ) : (
                  getLeavesForDate(selectedDate).map((item: any, idx: number) => {
                    const statusColor = getStatusColor(item.leave.status, isDark);
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => router.push(`/(modules)/leave/${item.leave.id}` as any)}
                        accessibilityLabel={`${item.leave.leave_type} - ${item.leave.status}`}
                        accessibilityRole="button"
                        style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1.5, borderColor: statusColor.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.sm }}
                      >
                        <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: getOpacityColor(statusColor.bg, 0.3), alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: statusColor.border }}>
                          <Ionicons name="document-outline" size={iconSizes.sm} color={statusColor.icon} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>{item.leave.leave_type}</Text>
                          <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>{item.leave.status.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Legend */}
            <View style={{ backgroundColor: theme.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: theme.border, ...shadows.sm }}>
              <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text, marginBottom: spacing.md }]}>Legend</Text>
              <View style={{ gap: spacing.md }}>
                {[
                  { label: 'Approved', status: 'approved' },
                  { label: 'Pending', status: 'pending' },
                  { label: 'Rejected', status: 'rejected' },
                ].map((item) => {
                  const statusColor = getStatusColor(item.status, isDark);
                  return (
                    <View key={item.status} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <View style={{ width: 20, height: 20, borderRadius: borderRadius.sm, backgroundColor: getOpacityColor(statusColor.bg, 0.3), borderWidth: 1.5, borderColor: statusColor.border }} />
                      <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
