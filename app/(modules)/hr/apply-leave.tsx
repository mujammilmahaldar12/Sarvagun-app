import React, { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import ModuleHeader from '@/components/layout/ModuleHeader';
import AppButton from '@/components/ui/AppButton';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Optional Leave'];

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    leaveType: '',
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

  const handleSubmit = async () => {
    // Validation
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const days = calculateDays();
    if (days <= 0) {
      Alert.alert('Invalid Dates', 'To date must be after from date');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real API call
      console.log('Applying leave:', { ...formData, days, employee: user?.full_name });
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Leave application submitted successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to submit leave application');
      console.error('Error:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 }}>
              Applying as
            </Text>
            <Text style={{ fontSize: 18, color: theme.colors.text, fontWeight: '600' }}>
              {user?.full_name || 'Employee'}
            </Text>
          </View>

          {/* Leave Type Selection */}
          <Text style={{
            fontSize: 14,
            color: theme.colors.textSecondary,
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
                    ? `${theme.colors.primary}20` 
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: formData.leaveType === type 
                    ? theme.colors.primary 
                    : theme.colors.border,
                  padding: 16,
                  borderRadius: 8,
                }}
                onPress={() => updateField('leaveType', type)}
              >
                <Text style={{
                  color: formData.leaveType === type 
                    ? theme.colors.primary 
                    : theme.colors.text,
                  fontSize: 16,
                  fontWeight: formData.leaveType === type ? '600' : '400',
                }}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Selection */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              From Date *
            </Text>
            <Pressable
              onPress={() => setShowFromDatePicker(true)}
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{
                fontSize: 16,
                color: formData.fromDate ? theme.colors.text : theme.colors.textSecondary,
              }}>
                {formData.fromDate ? formatDate(formData.fromDate) : 'Select date'}
              </Text>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              marginBottom: 8,
              fontWeight: '500',
            }}>
              To Date *
            </Text>
            <Pressable
              onPress={() => setShowToDatePicker(true)}
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{
                fontSize: 16,
                color: formData.toDate ? theme.colors.text : theme.colors.textSecondary,
              }}>
                {formData.toDate ? formatDate(formData.toDate) : 'Select date'}
              </Text>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>

          {/* Calculated Days */}
          {formData.fromDate && formData.toDate && (
            <View style={{
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                Total Days
              </Text>
              <Text style={{ fontSize: 24, color: theme.colors.primary, fontWeight: '700', marginTop: 4 }}>
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
                fontSize: 14,
                color: theme.colors.textSecondary,
                marginBottom: 8,
                fontWeight: '500',
              }}>
                Medical Certificate (Optional)
              </Text>
              
              <Pressable
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={pickDocument}
              >
                <Ionicons name="cloud-upload" size={32} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, marginTop: 8, fontWeight: '500' }}>
                  Upload Document
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
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
                        backgroundColor: theme.colors.surface,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <Ionicons name="document" size={20} color={theme.colors.primary} />
                      <Text style={{ flex: 1, marginLeft: 12, color: theme.colors.text }}>
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
              title={loading ? 'Submitting...' : 'Submit Leave Application'}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              fullWidth
              size="lg"
              leftIcon="send"
            />
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
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
      }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: theme.colors.text,
          minHeight: multiline ? 100 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
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
            backgroundColor: isToday ? theme.colors.primary + '20' : 'transparent',
            borderWidth: isToday ? 1 : 0,
            borderColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 14,
              color: disabled ? theme.colors.textSecondary : theme.colors.text,
              fontWeight: isToday ? '600' : '400',
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
            backgroundColor: theme.colors.surface,
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
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
              {title}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
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
                          ? theme.colors.primary 
                          : theme.colors.background,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: selectedMonth === index ? '#fff' : theme.colors.text,
                        fontWeight: selectedMonth === index ? '600' : '400',
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
                          ? theme.colors.primary 
                          : theme.colors.background,
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: selectedYear === year ? '#fff' : theme.colors.text,
                        fontWeight: selectedYear === year ? '600' : '400',
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
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary }}>
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
            borderTopColor: theme.colors.border,
          }}>
            <Pressable
              onPress={onClose}
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: theme.colors.background,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
