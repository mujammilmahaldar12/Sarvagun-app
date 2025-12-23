/**
 * DatePicker Component
 * Single date picker with calendar modal
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import { Calendar } from './Calendar';
import { Button } from './Button';

const { spacing, typography, borderRadius } = designSystem;

interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  onDateChange?: (date: Date | null) => void;
  // Multiple mode props
  mode?: 'single' | 'multiple';
  dates?: Date[];
  onDatesChange?: (dates: Date[]) => void;

  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  format?: 'short' | 'long' | 'full';
}

export const DatePicker: React.FC<DatePickerProps & { inline?: boolean }> = ({
  label,
  value,
  onChange,
  onDateChange,
  mode = 'single',
  dates = [],
  onDatesChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  error,
  required = false,
  disabled = false,
  format = 'long',
  inline = false,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [selectedDates, setSelectedDates] = useState<Date[]>(dates || []);

  const formatDate = (date: Date): string => {
    if (format === 'short') {
      return date.toLocaleDateString();
    } else if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const getDisplayText = () => {
    if (mode === 'single') {
      return value ? formatDate(value) : placeholder;
    } else {
      if (!dates || dates.length === 0) return placeholder;
      if (dates.length === 1) return formatDate(dates[0]);
      return `${dates.length} dates selected`;
    }
  };

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    if (inline && mode === 'single') {
      onChange?.(date);
      onDateChange?.(date);
    }
  };

  const handleSelectDates = (newDates: Date[]) => {
    setSelectedDates(newDates);
    if (inline) {
      onDatesChange?.(newDates);
    }
  }

  const handleConfirm = () => {
    if (mode === 'single') {
      if (selectedDate) {
        onChange?.(selectedDate);
        onDateChange?.(selectedDate);
        setIsOpen(false);
      }
    } else {
      // Multiple
      onDatesChange?.(selectedDates);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'single') {
      setSelectedDate(value || null);
    } else {
      setSelectedDates(dates || []);
    }
    setIsOpen(false);
  };

  // Sync internal state when props change
  React.useEffect(() => {
    if (value) setSelectedDate(value);
  }, [value]);

  React.useEffect(() => {
    if (dates) setSelectedDates(dates);
  }, [dates]);

  if (inline) {
    // Inline not fully optimized for multiple yet in this snippet, sticking to standard flow
    return (
      <View style={{ marginBottom: spacing[4] }}>
        {label && (
          <Text
            style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: theme.text || '#000000',
              marginBottom: spacing[2],
            }}
          >
            {label}
            {required && <Text style={{ color: theme.error || '#EF4444' }}> *</Text>}
          </Text>
        )}
        <View style={{
          backgroundColor: theme.surface || '#FFFFFF',
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.border || '#E5E7EB',
          overflow: 'hidden',
        }}>
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            selectionMode={mode}
            selectedDates={selectedDates}
            onSelectDates={handleSelectDates}
          />
        </View>
        {error && (
          <Text
            style={{
              fontSize: typography.sizes.xs,
              color: theme.error || '#EF4444',
              marginTop: spacing[1],
              marginLeft: spacing[1],
            }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* Label */}
      {label && (
        <Text
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: theme.text || '#000000',
            marginBottom: spacing[1],
          }}
        >
          {label}
          {required && <Text style={{ color: theme.error || '#EF4444' }}> *</Text>}
        </Text>
      )}

      {/* Input Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface || '#FFFFFF',
          borderWidth: 1.5,
          borderColor: error ? (theme.error || '#EF4444') : (theme.border || '#E5E7EB'),
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
          minHeight: 48,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Calendar Icon */}
        <Ionicons
          name="calendar-outline"
          size={20}
          color={error ? (theme.error || '#EF4444') : (theme.textSecondary || '#6B7280')}
          style={{ marginRight: spacing[2] }}
        />

        {/* Display Text - Takes remaining space */}
        <Text
          style={{
            flex: 1,
            fontSize: typography.sizes.base,
            color: (mode === 'single' ? value : dates.length > 0) ? (theme.text || '#111827') : (theme.textSecondary || '#6B7280'),
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getDisplayText()}
        </Text>

        {/* Chevron */}
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.textSecondary || '#6B7280'}
          style={{ marginLeft: spacing[1] }}
        />
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: typography.sizes.xs,
            color: theme.error || '#EF4444',
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
        animationType="fade"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.overlay || 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCancel}
          />

          <View
            style={{
              backgroundColor: theme.surface || '#FFFFFF',
              borderRadius: borderRadius.xl,
              padding: spacing[4],
              marginHorizontal: 20,
              width: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
              selectionMode={mode}
              selectedDates={selectedDates}
              onSelectDates={handleSelectDates}
            />

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm"
                variant="primary"
                onPress={handleConfirm}
                disabled={mode === 'single' ? !selectedDate : false} // Allow explicit confirm empty? maybe
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DatePicker;
