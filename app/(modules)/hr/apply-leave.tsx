import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useCreateLeave, useLeaveBalance } from '@/hooks/useHRQueries';
import { LeaveBalanceCard } from '@/components/hr';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';
import type { LeaveType, ShiftType } from '@/types/hr';

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Study Leave', 'Optional Leave'];
const SHIFT_TYPES: { value: ShiftType; label: string }[] = [
  { value: 'full_shift', label: 'Full Day (9:00 AM - 6:00 PM)' },
  { value: 'first_half', label: 'First Half (9:00 AM - 1:00 PM)' },
  { value: 'second_half', label: 'Second Half (2:00 PM - 6:00 PM)' },
];

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<string[]>([]);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  // API hooks
  const { mutate: createLeave, isPending: isSubmitting } = useCreateLeave();
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();

  // Form state
  const [formData, setFormData] = useState<{
    leaveType: LeaveType | '';
    shiftType: ShiftType;
    fromDate: string;
    toDate: string;
    reason: string;
  }>({
    leaveType: '',
    shiftType: 'full_shift',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    // TODO: Implement document picker with expo-document-picker
    // For now, just mock it
    Alert.alert('Document Picker', 'Document picker will be implemented with expo-document-picker');
    // const result = await DocumentPicker.getDocumentAsync();
    // if (result.type === 'success') {
    //   setDocuments([...documents, result.uri]);
    // }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const calculateDays = () => {
    if (!formData.fromDate || !formData.toDate) return 0;
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const selectDate = (dateString: string, type: 'from' | 'to') => {
    if (type === 'from') {
      updateField('fromDate', dateString);
      setShowFromDatePicker(false);
    } else {
      updateField('toDate', dateString);
      setShowToDatePicker(false);
    }
  };

  // Check if user has sufficient leave balance
  const getAvailableBalance = (leaveType: LeaveType): number => {
    if (!balance) return 0;
    
    const typeKey = leaveType.toLowerCase().replace(' ', '_');
    const totalKey = `${typeKey}_total` as keyof typeof balance;
    const usedKey = `${typeKey}_used` as keyof typeof balance;
    const plannedKey = `${typeKey}_planned` as keyof typeof balance;
    
    const total = (balance[totalKey] as number) || 0;
    const used = (balance[usedKey] as number) || 0;
    const planned = (balance[plannedKey] as number) || 0;
    
    return total - used - planned;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      Alert.alert('Invalid Dates', 'To date must be after from date');
      return;
    }

    // Check balance
    const availableBalance = getAvailableBalance(formData.leaveType);
    if (days > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ${availableBalance} days available for ${formData.leaveType}. Requested: ${days} days.`
      );
      return;
    }

    try {
      createLeave(
        {
          leave_type: formData.leaveType,
          from_date: formData.fromDate,
          to_date: formData.toDate,
          shift_type: formData.shiftType,
          reason: formData.reason.trim(),
          documents: [], // TODO: Add document upload
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Success',
              'Your leave application has been submitted successfully and is pending approval.',
              [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]
            );
          },
          onError: (error: any) => {
            Alert.alert(
              'Error',
              error.message || 'Failed to submit leave application. Please try again.'
            );
          },
        }
      );
    } catch (error) {
      console.error('Error submitting leave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ModuleHeader title="Apply Leave" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Employee Info */}
          <View style={{
            backgroundColor: theme.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary, marginBottom: 4 }}>
              Applying as
            </Text>
            <Text style={{ ...getTypographyStyle('lg'), color: theme.text, fontWeight: 'semibold' }}>
              {user?.full_name || 'Employee'}
            </Text>
          </View>

          {/* Leave Balance Card */}
          {!balanceLoading && balance && (
            <LeaveBalanceCard compact />
          )}

          {/* Leave Type Selection */}
          <Text style={{
            ...getTypographyStyle('sm'),
            color: theme.textSecondary,
            marginBottom: 8,
            fontWeight: '500',
          }}>
            Leave Type *
          </Text>
          <View style={{ marginBottom: 16, gap: 8 }}>
            {LEAVE_TYPES.map((type) => (
              <Pressable
                key={type}
                style={{
                  backgroundColor: formData.leaveType === type 
                    ? `${theme.primary}20` 
                    : theme.surface,
                  borderWidth: 1,
                  borderColor: formData.leaveType === type 
                    ? theme.primary 
                    : theme.border,
                  padding: 16,
                  borderRadius: 8,
                }}
                onPress={() => updateField('leaveType', type)}
              >
                <Text style={{
                  color: formData.leaveType === type 
                    ? theme.primary 
                    : theme.text,
                  ...getTypographyStyle('base'),
                  fontWeight: formData.leaveType === type ? 'semibold' : '400',
                }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Shift Type Selection */}
          <Text style={{
            ...getTypographyStyle('sm'),
            color: theme.textSecondary,
            marginBottom: 8,
            fontWeight: '500',
          }}>
            Shift Type *
          </Text>
          <View style={{ marginBottom: 16, gap: 8 }}>
            {SHIFT_TYPES.map((shift) => (
              <Pressable
                key={shift.value}
                style={{
                  backgroundColor: formData.shiftType === shift.value 
                    ? `${theme.primary}20` 
                    : theme.surface,
                  borderWidth: 1,
                  borderColor: formData.shiftType === shift.value 
                    ? theme.primary 
                    : theme.border,
                  padding: 16,
                  borderRadius: 8,
                }}
                onPress={() => updateField('shiftType', shift.value)}
              >
                <Text style={{
                  color: formData.shiftType === shift.value 
                    ? theme.primary 
                    : theme.text,
                  ...getTypographyStyle('base'),
                  fontWeight: formData.shiftType === shift.value ? 'semibold' : '400',
                }}>
                  {shift.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Selection */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              ...getTypographyStyle('sm'),
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              From Date *
            </Text>
            <Pressable
              onPress={() => setShowFromDatePicker(true)}
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{
                ...getTypographyStyle('base'),
                color: formData.fromDate ? theme.text : theme.textSecondary,
              }}>
                {formData.fromDate ? formatDate(formData.fromDate) : 'Select date'}
              </Text>
              <Ionicons name="calendar" size={20} color={theme.primary} />
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              ...getTypographyStyle('sm'),
              color: theme.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              To Date *
            </Text>
            <Pressable
              onPress={() => setShowToDatePicker(true)}
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{
                ...getTypographyStyle('base'),
                color: formData.toDate ? theme.text : theme.textSecondary,
              }}>
                {formData.toDate ? formatDate(formData.toDate) : 'Select date'}
              </Text>
              <Ionicons name="calendar" size={20} color={theme.primary} />
            </Pressable>
          </View>

          {/* Calculated Days */}
          {formData.fromDate && formData.toDate && (
            <View style={{
              backgroundColor: theme.surface,
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <Text style={{ ...getTypographyStyle('sm'), color: theme.textSecondary }}>
                Total Days
              </Text>
              <Text style={{ ...getTypographyStyle('2xl'), color: theme.primary, fontWeight: 'bold', marginTop: 4 }}>
                {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}

          {/* Reason */}
          <FormInput
            label="Reason *"
            value={formData.reason}
            onChangeText={(text) => updateField('reason', text)}
            placeholder="Enter reason for leave"
            multiline
            numberOfLines={4}
            theme={theme}
          />

          {/* Document Upload (Optional for Sick Leave) */}
          {formData.leaveType === 'Sick Leave' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                ...getTypographyStyle('sm'),
                color: theme.textSecondary,
                marginBottom: 8,
                fontWeight: '500',
              }}>
                Medical Certificate (Optional)
              </Text>
              
              <Pressable
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={pickDocument}
              >
                <Ionicons name="cloud-upload" size={32} color={theme.primary} />
                <Text style={{ color: theme.primary, marginTop: 8, fontWeight: '500' }}>
                  Upload Document
                </Text>
                <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, marginTop: 4 }}>
                  PDF, JPG, PNG (Max 5MB)
                </Text>
              </Pressable>

              {/* Show uploaded documents */}
              {documents.length > 0 && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {documents.map((doc, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.surface,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Ionicons name="document" size={20} color={theme.primary} />
                      <Text style={{ flex: 1, marginLeft: 12, color: theme.text }}>
                        Document {index + 1}
                      </Text>
                      <Pressable onPress={() => removeDocument(index)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <View style={{ marginTop: 24, marginBottom: 32 }}>
            <AppButton
              title={isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
              onPress={handleSubmit}
              disabled={isSubmitting || !formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()}
              loading={isSubmitting}
              fullWidth
              size="lg"
              leftIcon="send"
            />
            
            {formData.leaveType && balance && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: theme.surface, borderRadius: 8 }}>
                <Text style={{ ...getTypographyStyle('xs'), color: theme.textSecondary, textAlign: 'center' }}>
                  Available {formData.leaveType}: {getAvailableBalance(formData.leaveType)} days
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* From Date Picker Modal */}
      <DatePickerModal
        visible={showFromDatePicker}
        onClose={() => setShowFromDatePicker(false)}
        onSelectDate={(date) => selectDate(date, 'from')}
        theme={theme}
        title="Select From Date"
        minDate={new Date().toISOString().split('T')[0]}
      />

      {/* To Date Picker Modal */}
      <DatePickerModal
        visible={showToDatePicker}
        onClose={() => setShowToDatePicker(false)}
        onSelectDate={(date) => selectDate(date, 'to')}
        theme={theme}
        title="Select To Date"
        minDate={formData.fromDate || new Date().toISOString().split('T')[0]}
      />
    </View>
  );
}

// Helper Components
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  theme: any;
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  theme,
}: FormInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        ...getTypographyStyle('sm'),
        color: theme.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
      }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 12,
          ...getTypographyStyle('base'),
          color: theme.text,
          minHeight: multiline ? 100 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  theme: any;
  title: string;
  minDate?: string;
}

function DatePickerModal({ visible, onClose, onSelectDate, theme, title, minDate }: DatePickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (date: string) => {
    if (!minDate) return false;
    return new Date(date) < new Date(minDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: '14.28%', padding: 4 }} />);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const disabled = isDateDisabled(dateString);
      const isToday = dateString === new Date().toISOString().split('T')[0];

      days.push(
        <Pressable
          key={day}
          disabled={disabled}
          onPress={() => onSelectDate(dateString)}
          style={{
            width: '14.28%',
            padding: 8,
            alignItems: 'center',
            opacity: disabled ? 0.3 : 1,
          }}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isToday ? theme.primary + '20' : 'transparent',
            borderWidth: isToday ? 1 : 0,
            borderColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              ...getTypographyStyle('sm'),
              color: disabled ? theme.textSecondary : theme.text,
              fontWeight: isToday ? 'semibold' : '400',
            }}>
              {day}
            </Text>
          </View>
        </Pressable>
      );
    }

    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 20,
            width: '90%',
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{ ...getTypographyStyle('lg'), fontWeight: 'semibold', color: theme.text }}>
              {title}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          {/* Month and Year Selectors */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 2 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 40 }}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {months.map((month, index) => (
                    <Pressable
                      key={month}
                      onPress={() => setSelectedMonth(index)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: selectedMonth === index 
                          ? theme.primary 
                          : theme.background,
                      }}
                    >
                      <Text style={{
                        ...getTypographyStyle('sm'),
                        color: selectedMonth === index ? '#fff' : theme.text,
                        fontWeight: selectedMonth === index ? 'semibold' : '400',
                      }}>
                        {month.substring(0, 3)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 40 }}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: selectedYear === year 
                          ? theme.primary 
                          : theme.background,
                      }}
                    >
                      <Text style={{
                        ...getTypographyStyle('sm'),
                        color: selectedYear === year ? '#fff' : theme.text,
                        fontWeight: selectedYear === year ? 'semibold' : '400',
                      }}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Day Headers */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={index} style={{ width: '14.28%', alignItems: 'center', padding: 4 }}>
                <Text style={{ ...getTypographyStyle('xs'), fontWeight: 'semibold', color: theme.textSecondary }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {renderCalendar()}
          </View>

          {/* Footer */}
          <View style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          }}>
            <Pressable
              onPress={onClose}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: theme.background,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.text, fontWeight: 'semibold' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
