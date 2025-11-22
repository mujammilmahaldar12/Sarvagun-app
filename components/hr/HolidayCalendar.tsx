/**
 * Holiday Calendar Component
 * Monthly calendar view showing approved leaves and holidays
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHolidays, useTeamLeaves } from '../../hooks/useHRQueries';
import type { Holiday } from '../../types/hr';

interface HolidayCalendarProps {
  onDateSelect?: (date: string) => void;
  selectedDates?: string[];
  highlightLeaveType?: string;
}

export const HolidayCalendar: React.FC<HolidayCalendarProps> = ({
  onDateSelect,
  selectedDates = [],
  highlightLeaveType,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: holidays = [], isLoading: holidaysLoading } = useHolidays(currentYear);
  const { data: teamLeaves = [], isLoading: teamLeavesLoading } = useTeamLeaves();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isHoliday = (day: number) => {
    const dateStr = formatDateForComparison(currentYear, currentMonth, day);
    return holidays.some(h => h.date === dateStr);
  };

  const getHoliday = (day: number): Holiday | undefined => {
    const dateStr = formatDateForComparison(currentYear, currentMonth, day);
    return holidays.find(h => h.date === dateStr);
  };

  const isTeamLeaveDay = (day: number) => {
    const dateStr = formatDateForComparison(currentYear, currentMonth, day);
    return teamLeaves.some(leave => {
      const leaveStart = new Date(leave.from_date);
      const leaveEnd = new Date(leave.to_date);
      const checkDate = new Date(dateStr);
      return checkDate >= leaveStart && checkDate <= leaveEnd && leave.status === 'approved';
    });
  };

  const getTeamLeavesForDay = (day: number) => {
    const dateStr = formatDateForComparison(currentYear, currentMonth, day);
    return teamLeaves.filter(leave => {
      const leaveStart = new Date(leave.from_date);
      const leaveEnd = new Date(leave.to_date);
      const checkDate = new Date(dateStr);
      return checkDate >= leaveStart && checkDate <= leaveEnd && leave.status === 'approved';
    });
  };

  const isSelected = (day: number) => {
    const dateStr = formatDateForComparison(currentYear, currentMonth, day);
    return selectedDates.includes(dateStr);
  };

  const formatDateForComparison = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDatePress = (day: number) => {
    if (onDateSelect) {
      const dateStr = formatDateForComparison(currentYear, currentMonth, day);
      onDateSelect(dateStr);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <View style={styles.calendarGrid}>
        {dayNames.map((day) => (
          <View key={day} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{day}</Text>
          </View>
        ))}
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.emptyCell} />;
          }

          const isWeekendDay = isWeekend(day);
          const isHolidayDay = isHoliday(day);
          const isTeamLeave = isTeamLeaveDay(day);
          const isSelectedDay = isSelected(day);
          const holiday = getHoliday(day);
          const teamLeavesOnDay = getTeamLeavesForDay(day);

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isSelectedDay && styles.selectedDayCell,
                (isWeekendDay || isHolidayDay) && styles.weekendCell,
              ]}
              onPress={() => handleDatePress(day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelectedDay && styles.selectedDayText,
                  (isWeekendDay || isHolidayDay) && styles.weekendDayText,
                ]}
              >
                {day}
              </Text>
              {isHolidayDay && holiday && (
                <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {holiday.name.substring(0, 3)}
                  </Text>
                </View>
              )}
              {isTeamLeave && teamLeavesOnDay.length > 0 && (
                <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>{teamLeavesOnDay.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (holidaysLoading || teamLeavesLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {renderCalendar()}

        {highlightLeaveType && (
          <View style={styles.leaveTypeInfo}>
            <Text style={styles.leaveTypeLabel}>Type of Holiday:</Text>
            <Text style={styles.leaveTypeValue}>{highlightLeaveType}</Text>
          </View>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Team Leave</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Holiday</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayNameCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  selectedDayCell: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  weekendCell: {
    backgroundColor: '#FEF3C7',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  weekendDayText: {
    color: '#92400E',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  leaveTypeInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  leaveTypeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  leaveTypeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default HolidayCalendar;
