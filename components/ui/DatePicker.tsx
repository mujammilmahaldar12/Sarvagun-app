import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/designTokens';
import { useTheme } from '@/hooks/useTheme';

interface DatePickerProps {
  value: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = 'Select date',
  label,
  minimumDate,
  maximumDate,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const openPicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const clearDate = () => {
    onDateChange(null);
  };

  return (
    <View>
      {label && (
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: spacing.sm
        }}>
          {label}
        </Text>
      )}
      
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: disabled ? theme.colors.background : theme.colors.surface,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={value ? theme.colors.text : theme.colors.textSecondary}
          />
          <Text style={{
            fontSize: typography.sizes.base,
            color: value ? theme.colors.text : theme.colors.textSecondary,
          }}>
            {formatDate(value)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {value && !disabled && (
            <Pressable
              onPress={clearDate}
              style={{
                padding: spacing.xs,
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          )}
          
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.textSecondary}
          />
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()}
          mode="date"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

export default DatePicker;