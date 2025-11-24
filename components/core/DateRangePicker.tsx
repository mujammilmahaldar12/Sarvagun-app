/**
 * DateRangePicker Component
 * Multi-date picker for date ranges (start and end date)
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';
import { Calendar } from './Calendar';
import { Button } from './Button';

const { spacing, typography, borderRadius } = designSystem;

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

interface DateRangePickerProps {
  label?: string;
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  error,
  required = false,
  disabled = false,
}) => {
  const { colors } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value || {});
  const [selectingStart, setSelectingStart] = useState(true);

  const formatDateRange = (range: DateRange): string => {
    if (range.startDate && range.endDate) {
      return `${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()}`;
    } else if (range.startDate) {
      return `${range.startDate.toLocaleDateString()} - End date`;
    }
    return placeholder;
  };

  const handleSelect = (date: Date) => {
    if (selectingStart) {
      setTempRange({ startDate: date, endDate: undefined });
      setSelectingStart(false);
    } else {
      if (tempRange.startDate && date >= tempRange.startDate) {
        setTempRange({ ...tempRange, endDate: date });
      } else {
        // If selected date is before start date, swap them
        setTempRange({ startDate: date, endDate: tempRange.startDate });
      }
    }
  };

  const handleConfirm = () => {
    if (tempRange.startDate && tempRange.endDate) {
      onChange(tempRange);
      setIsOpen(false);
      setSelectingStart(true);
    }
  };

  const handleCancel = () => {
    setTempRange(value || {});
    setIsOpen(false);
    setSelectingStart(true);
  };

  const handleClear = () => {
    setTempRange({});
    setSelectingStart(true);
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
          borderColor: error ? colors.error : value?.startDate ? colors.primary : colors.border,
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
            color={error ? colors.error : value?.startDate ? colors.primary : colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 16,
              color: value?.startDate ? colors.text : colors.textSecondary,
            }}
          >
            {formatDateRange(value || {})}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>

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
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleCancel}
      >
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
            {/* Header with Selection Info */}
            <View style={{ marginBottom: spacing[3], alignItems: 'center' }}>
              <Text style={{ 
                fontSize: typography.sizes.lg, 
                fontWeight: typography.weights.bold,
                color: colors.text,
                marginBottom: spacing[1],
              }}>
                Select Date Range
              </Text>
              <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>
                {selectingStart ? 'Choose start date' : 'Choose end date'}
              </Text>
              {tempRange.startDate && (
                <View style={{ 
                  marginTop: spacing[2],
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  backgroundColor: colors.primary + '15',
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}>
                  <Text style={{ fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.semibold }}>
                    {tempRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {tempRange.endDate && ` - ${tempRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </Text>
                </View>
              )}
            </View>

            <Calendar
              selectedDate={selectingStart ? tempRange.startDate : tempRange.endDate}
              onSelectDate={handleSelect}
              minDate={selectingStart ? minDate : tempRange.startDate}
              maxDate={maxDate}
            />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                size="md"
                style={{ flex: 1 }}
              />
              {tempRange.startDate && (
                <Button
                  title="Clear"
                  variant="outline"
                  onPress={handleClear}
                  size="md"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title="Confirm"
                variant="primary"
                onPress={handleConfirm}
                disabled={!tempRange.startDate || !tempRange.endDate}
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

export default DateRangePicker;
