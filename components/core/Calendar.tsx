/**
 * Calendar Component
 * Standalone calendar for date selection
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

interface CalendarProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  markedDates?: Record<string, { marked?: boolean; selected?: boolean; color?: string }>;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  markedDates = {},
}) => {
  const { colors } = useThemeStore();
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);
      const isToday =
        day === new Date().getDate() &&
        currentMonth.getMonth() === new Date().getMonth() &&
        currentMonth.getFullYear() === new Date().getFullYear();

      days.push(
        <Pressable
          key={day}
          onPress={() => {
            if (!disabled && onSelectDate) {
              onSelectDate(date);
            }
          }}
          disabled={disabled}
          style={styles.dayCell}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: selected
                ? colors.primary
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: isToday && !selected ? 2 : 0,
              borderColor: colors.primary,
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.sm,
                fontWeight: selected || isToday ? typography.weights.bold : typography.weights.regular,
                color: selected 
                  ? colors.textInverse || '#FFFFFF'
                  : isToday 
                  ? colors.primary 
                  : colors.text,
                textAlign: 'center',
              }}
            >
              {day}
            </Text>
          </View>
        </Pressable>
      );
    }

    return days;
  };

  return (
    <View style={{ 
      backgroundColor: colors.surface, 
      borderRadius: borderRadius.lg, 
      padding: spacing[3],
      width: '100%',
    }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={previousMonth}
          style={{
            padding: spacing[2],
            borderRadius: borderRadius.md,
            backgroundColor: colors.surfaceElevated || colors.surface,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={{ 
          fontSize: typography.sizes.lg, 
          fontWeight: typography.weights.bold, 
          color: colors.text,
          textAlign: 'center',
          flex: 1,
        }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <Pressable 
          onPress={nextMonth}
          style={{
            padding: spacing[2],
            borderRadius: borderRadius.md,
            backgroundColor: colors.surfaceElevated || colors.surface,
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Day names */}
      <View style={styles.dayNamesRow}>
        {dayNames.map((name) => (
          <View key={name} style={styles.dayNameCell}>
            <Text
              style={{
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.bold,
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.daysGrid}>{renderDays()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[2],
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  dayNameCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
});

export default Calendar;
