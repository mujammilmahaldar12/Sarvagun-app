import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getMonth, getYear, parseISO, isValid } from 'date-fns';
import { useCalendarLeaves } from '@/hooks/useHRQueries';
import ModuleHeader from '@/components/layout/ModuleHeader';
import { useTheme } from '@/hooks/useTheme';
import { getStatusColor, shadows, spacing, borderRadius, getOpacityColor, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { CalendarLeave } from '@/types/hr';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LeaveCalendarScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch leaves for the currently displayed month
  const { data: leavesData, isLoading, refetch } = useCalendarLeaves(
    getYear(currentDate),
    getMonth(currentDate) + 1
  );

  const leaves = Array.isArray(leavesData) ? leavesData : [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Refresh data when month changes
  useEffect(() => {
    refetch();
  }, [currentDate, refetch]);

  // Expand leaves into individual dates for easier lookup
  const leaveDates = React.useMemo(() => {
    return leaves.flatMap((leave: CalendarLeave) => {
      // Backend already returns array of date strings in 'dates'
      return (leave.dates || []).map(dateStr => {
        const date = parseISO(dateStr);
        return isValid(date) ? { date, leave } : null;
      }).filter(Boolean) as { date: Date, leave: CalendarLeave }[];
    });
  }, [leaves]);

  const getLeavesForDate = (date: Date) => leaveDates.filter(ld => isSameDay(ld.date, date));

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

                  // Styles based on selection/current day
                  let bgColor: any = 'transparent';
                  let borderColor: any = theme.border;
                  let borderWidth = 1;

                  if (isSelected) {
                    bgColor = getOpacityColor(theme.primary, 0.15);
                    borderColor = theme.primary;
                    borderWidth = 2;
                  } else if (isCurrentDay) {
                    borderColor = theme.primary;
                    borderWidth = 2;
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedDate(date)}
                      accessibilityLabel={`${format(date, 'MMM dd')}${hasLeave ? ` - ${dayLeaves.length} leaves` : ''}`}
                      accessibilityRole="button"
                      style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}
                    >
                      <View
                        style={{
                          flex: 1,
                          borderRadius: borderRadius.md,
                          backgroundColor: bgColor,
                          borderWidth: borderWidth,
                          borderColor: borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        } as any}
                      >
                        <Text style={[getTypographyStyle('sm', isCurrentDay ? 'bold' : 'semibold'), { color: theme.text }]}>
                          {format(date, 'd')}
                        </Text>

                        {/* Leave Indicators */}
                        {hasLeave && (
                          <View style={{ flexDirection: 'row', gap: 2, marginTop: 2, justifyContent: 'center', flexWrap: 'wrap', maxWidth: '80%' }}>
                            {dayLeaves.slice(0, 3).map((item, i) => {
                              // Red/Green based on status? Or User based? 
                              // Let's simplify: Status color for everyone. 
                              // Maybe different shape for "Team" vs "Mine"?
                              const statusColor = getStatusColor(item.leave.status, isDark);
                              return (
                                <View
                                  key={i}
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: item.leave.is_mine ? statusColor.icon : theme.textSecondary,
                                    opacity: item.leave.is_mine ? 1 : 0.5
                                  }}
                                />
                              );
                            })}
                            {dayLeaves.length > 3 && (
                              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.textSecondary }} />
                            )}
                          </View>
                        )}
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
                  getLeavesForDate(selectedDate).map((item, idx) => {
                    const statusColor = getStatusColor(item.leave.status, isDark);
                    const isMine = item.leave.is_mine;

                    return (
                      <TouchableOpacity
                        key={idx}
                        // Only navigate if it's my leave or I have permission (assuming backend filtering allows seeing details if returned)
                        onPress={() => isMine ? router.push(`/(modules)/leave/${item.leave.id}` as any) : null}
                        disabled={!isMine} // Maybe allow clicking for details later?
                        accessibilityLabel={`${item.leave.user_name} - ${item.leave.leave_type}`}
                        accessibilityRole="button"
                        style={{
                          backgroundColor: theme.surface,
                          borderRadius: borderRadius.lg,
                          padding: spacing.lg,
                          marginBottom: spacing.md,
                          borderWidth: 1.5,
                          borderColor: isMine ? statusColor.border : theme.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          ...shadows.sm
                        }}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: borderRadius.md,
                          backgroundColor: getOpacityColor(statusColor.bg, isMine ? 0.3 : 0.1),
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: isMine ? statusColor.border : 'transparent'
                        }}>
                          <Ionicons name={isMine ? "person" : "people"} size={iconSizes.sm} color={statusColor.icon} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[getTypographyStyle('sm', 'bold'), { color: theme.text }]}>
                            {item.leave.user_name} {isMine && '(You)'}
                          </Text>
                          <Text style={[getTypographyStyle('xs', 'medium'), { color: theme.textSecondary }]}>
                            {item.leave.leave_type} • {item.leave.status.toUpperCase()}
                          </Text>
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
                  { label: 'My Leave', color: theme.primary, isDot: true },
                  { label: 'Team Leave', color: theme.textSecondary, isDot: true, opacity: 0.5 },
                  { label: 'Approved', status: 'approved' },
                  { label: 'Pending', status: 'pending' },
                ].map((item: any, i) => {
                  if (item.isDot) {
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, opacity: item.opacity || 1 }} />
                        <Text style={[getTypographyStyle('sm', 'medium'), { color: theme.text }]}>{item.label}</Text>
                      </View>
                    )
                  }
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
