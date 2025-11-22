import React, { useState } from 'react';
import { View, Text, Platform, Modal, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/designSystem';
import { useTheme } from '@/hooks/useTheme';
import AnimatedPressable from './AnimatedPressable';

interface ThemedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean;
}

export const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select a date',
  label,
  required = false,
  minimumDate,
  maximumDate,
  mode = 'date',
  disabled = false
}) => {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDate = (date?: Date): string => {
    if (!date) return '';
    
    if (mode === 'date') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format for consistency
    } else if (mode === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${date.toISOString().split('T')[0]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    if (tempDate) {
      onChange(tempDate);
    }
    setShowPicker(false);
  };

  const handleIOSCancel = () => {
    setTempDate(value);
    setShowPicker(false);
  };

  const clearDate = () => {
    onChange(undefined);
  };

  const openPicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  return (
    <View>
      {label && (
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: spacing.sm
        }}>
          {label} {required && <Text style={{ color: theme.error }}>*</Text>}
        </Text>
      )}
      
      <AnimatedPressable
        onPress={openPicker}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: disabled ? theme.background : theme.surface,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={disabled ? theme.textSecondary : theme.primary}
          style={{ marginRight: spacing.sm }}
        />
        
        <Text style={{
          flex: 1,
          fontSize: typography.sizes.base,
          color: value ? theme.text : theme.textSecondary,
        }}>
          {value ? formatDate(value) : placeholder}
        </Text>
        
        {value && !disabled && (
          <AnimatedPressable
            onPress={() => {
              clearDate();
            }}
            style={{
              padding: spacing.xs,
              marginLeft: spacing.sm,
            }}
            accessibilityLabel="Clear date"
            accessibilityRole="button"
          >
            <Ionicons 
              name="close-circle" 
              size={18} 
              color={theme.textSecondary}
            />
          </AnimatedPressable>
        )}
        
        <Ionicons
          name="chevron-down"
          size={16}
          color={theme.textSecondary}
          style={{ marginLeft: spacing.xs }}
        />
      </AnimatedPressable>

      {/* Android DatePicker */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.primary}
          textColor={theme.text}
          style={{
            backgroundColor: theme.surface,
          }}
        />
      )}

      {/* iOS DatePicker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowPicker(false)}
          >
            <View 
              style={[
                styles.modalContent,
                { backgroundColor: theme.surface }
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Modal Header */}
              <View style={[
                styles.modalHeader,
                { borderBottomColor: theme.border }
              ]}>
                <Pressable
                  onPress={handleIOSCancel}
                  style={styles.modalButton}
                >
                  <Text style={[
                    styles.modalButtonText,
                    { color: theme.textSecondary }
                  ]}>
                    Cancel
                  </Text>
                </Pressable>
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme.text }
                ]}>
                  Select {mode === 'date' ? 'Date' : mode === 'time' ? 'Time' : 'Date & Time'}
                </Text>
                
                <Pressable
                  onPress={handleIOSConfirm}
                  style={styles.modalButton}
                >
                  <Text style={[
                    styles.modalButtonText,
                    { color: theme.primary, fontWeight: 'bold' }
                  ]}>
                    Done
                  </Text>
                </Pressable>
              </View>

              {/* DatePicker */}
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate || value || new Date()}
                  mode={mode}
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  accentColor={theme.primary}
                  textColor={theme.text}
                  style={{
                    backgroundColor: theme.surface,
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 60,
  },
  modalButtonText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
  },
  pickerContainer: {
    paddingTop: spacing.base,
  },
});

export default ThemedDatePicker;