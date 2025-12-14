/**
 * DatePicker Component
 * Single date picker with calendar modal
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

interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  onDateChange?: (date: Date | null) => void;
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
  placeholder = 'Select date',
  minDate,
  maxDate,
  error,
  required = false,
  disabled = false,
  format = 'long',
  inline = false,
}) => {
  const { colors } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);

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

  const handleSelect = (date: Date) => {
    setSelectedDate(date);
    if (inline) {
      onChange?.(date);
      onDateChange?.(date);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onChange?.(selectedDate);
      onDateChange?.(selectedDate);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setSelectedDate(value || null);
    setIsOpen(false);
  };

  if (inline) {
    return (
      <View style={{ marginBottom: spacing[4] }}>
        {label && (
          <Text
            style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.text,
              marginBottom: spacing[2],
            }}
          >
            {label}
            {required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
        )}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}>
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </View>
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
            color: colors.text,
            marginBottom: spacing[1],
          }}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Input Button */}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: error ? colors.error : colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[3],
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1, minWidth: 0 }}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={error ? colors.error : colors.textSecondary}
          />
          <Text
            style={{
              fontSize: typography.sizes.base,
              color: value ? colors.text : colors.textSecondary,
              flex: 1,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

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
            }}
          >
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
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
                disabled={!selectedDate}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default DatePicker;
