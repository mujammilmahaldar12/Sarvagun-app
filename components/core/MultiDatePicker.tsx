/**
 * MultiDatePicker Component
 * Calendar-based picker for selecting multiple dates (for event active days)
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { Button } from './Button';

const { spacing, typography, borderRadius } = designSystem;

interface MultiDatePickerProps {
  label?: string;
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const MultiDatePicker: React.FC<MultiDatePickerProps> = ({
  label,
  selectedDates,
  onChange,
  placeholder = 'Select dates',
  minDate,
  maxDate,
  error,
  required = false,
  disabled = false,
}) => {
  const { colors } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tempDates, setTempDates] = useState<Date[]>(selectedDates);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Sync tempDates with selectedDates when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempDates(selectedDates);
    }
  }, [isOpen, selectedDates]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (date: Date) => {
    // Normalize dates to compare only year/month/day (ignore time)
    const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dateNorm = normalizeDate(date);

    if (minDate && dateNorm < normalizeDate(minDate)) return true;
    if (maxDate && dateNorm > normalizeDate(maxDate)) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return tempDates.some(d => {
      const selectedLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dateLocal.getTime() === selectedLocal.getTime();
    });
  };

  const toggleDate = (date: Date) => {
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const isSelected = isDateSelected(dateLocal);

    if (isSelected) {
      setTempDates(tempDates.filter(d => {
        const selectedLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return dateLocal.getTime() !== selectedLocal.getTime();
      }));
    } else {
      setTempDates([...tempDates, dateLocal].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const handleConfirm = () => {
    onChange(tempDates);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDates(selectedDates);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempDates([]);
  };

  const formatDates = (): string => {
    if (selectedDates.length === 0) return placeholder;
    if (selectedDates.length === 1) {
      return selectedDates[0].toLocaleDateString();
    }
    return `${selectedDates.length} dates selected`;
  };

  const renderDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);
      const today = new Date();
      const isToday =
        day === today.getDate() &&
        currentMonth.getMonth() === today.getMonth() &&
        currentMonth.getFullYear() === today.getFullYear();

      days.push(
        <Pressable
          key={day}
          onPress={() => {
            if (!disabled) {
              toggleDate(date);
            }
          }}
          disabled={disabled}
          style={({ pressed }) => [
            styles.dayCell,
            { opacity: pressed && !disabled ? 0.6 : 1 }
          ]}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: selected ? colors.primary : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: isToday && !selected ? 2 : 0,
              borderColor: colors.primary,
              opacity: disabled ? 0.3 : 1,
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.sm,
                fontWeight: selected || isToday ? typography.weights.bold : typography.weights.regular,
                color: selected
                  ? colors.textInverse || '#FFFFFF'
                  : disabled
                    ? colors.textSecondary
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
    <View style={{ marginBottom: spacing[4] }}>
      {/* Label */}
      {label && (
        <Text
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing[1],
          }}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Input Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: error ? colors.error : selectedDates.length > 0 ? colors.primary : colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: 12,
          paddingVertical: 12,
          minHeight: 48,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Pressable
          onPress={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={error ? colors.error : selectedDates.length > 0 ? colors.primary : colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 16,
              color: selectedDates.length > 0 ? colors.text : colors.textSecondary,
            }}
          >
            {formatDates()}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>

      {/* Selected Dates Preview */}
      {selectedDates.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing[2] }}
          contentContainerStyle={{ paddingRight: spacing[2] }}
        >
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {selectedDates.map((date, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.primary + '15',
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[1],
                }}
              >
                <Ionicons name="calendar" size={12} color={colors.primary} />
                <Text style={{ fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.semibold }}>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: colors.error,
            marginTop: spacing[1],
            marginLeft: spacing[1],
          }}
        >
          {error}
        </Text>
      )}

      {/* Calendar Modal */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleCancel}>
        <Animated.View
          entering={FadeIn}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.overlay,
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing[4],
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

          <Animated.View
            entering={SlideInDown.springify()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing[4],
              width: '100%',
              maxWidth: 400,
              maxHeight: '85%',
            }}
          >
            {/* Header with Selected Count */}
            <View style={{ marginBottom: spacing[3], alignItems: 'center' }}>
              <Text style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                color: colors.text,
                marginBottom: spacing[1],
              }}>
                Select Event Dates
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>
                {tempDates.length === 0 ? 'Tap dates to select' : `${tempDates.length} date${tempDates.length !== 1 ? 's' : ''} selected`}
              </Text>
            </View>

            {/* Calendar Header */}
            <View style={styles.header}>
              <Pressable
                onPress={previousMonth}
                style={({ pressed }) => ({
                  padding: spacing[2],
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.surfaceElevated || colors.surface,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text style={{
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.bold,
                color: colors.text,
                textAlign: 'center',
                flex: 1,
              }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => ({
                  padding: spacing[2],
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.surfaceElevated || colors.surface,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Day names */}
            <View style={styles.dayNamesRow}>
              {dayNames.map((name) => (
                <View key={name} style={styles.dayNameCell}>
                  <Text
                    style={{
                      fontSize: 10,
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

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Clear"
                variant="outline"
                onPress={handleClear}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm"
                variant="primary"
                onPress={handleConfirm}
                disabled={tempDates.length === 0}
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    paddingTop: spacing[2],
  },
  dayNameCell: {
    width: '14.28%',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
});

export default MultiDatePicker;
