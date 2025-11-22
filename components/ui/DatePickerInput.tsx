import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

interface DatePickerInputProps {
  label: string;
  value: string;
  onDateSelect: (date: string) => void;
  placeholder?: string;
}

export default function DatePickerInput({ 
  label, 
  value, 
  onDateSelect, 
  placeholder = 'Select date' 
}: DatePickerInputProps) {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    const formatted = formatDate(date);
    onDateSelect(formatted);
    setShowModal(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ 
        ...getTypographyStyle('sm', 'semibold'), 
        color: theme.text, 
        marginBottom: designSystem.spacing[2] 
      }}>
        {label}
      </Text>
      
      <Pressable
        onPress={() => setShowModal(true)}
        android_disableSound={true}
        style={{
          borderWidth: designSystem.borderWidth.thin,
          borderColor: value ? theme.primary : theme.border,
          borderRadius: designSystem.borderRadius.md,
          padding: designSystem.spacing[3],
          backgroundColor: theme.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ 
          color: value ? theme.text : theme.textSecondary,
          ...getTypographyStyle('sm'),
          flex: 1,
        }}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={designSystem.iconSizes.sm} color={theme.primary} />
      </Pressable>

      {/* Calendar Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
        statusBarTranslucent={true}
      >
        <Pressable 
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 20,
          }}
          android_disableSound={true}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={{ width: '100%', maxWidth: 400 }}
            android_disableSound={true}
            onPress={(e) => e.stopPropagation()}
          >
          <View style={{
            backgroundColor: theme.background,
            borderRadius: designSystem.borderRadius.xl,
            padding: designSystem.spacing[5],
            width: '100%',
            maxWidth: 400,
            ...designSystem.shadows.xl,
            elevation: 10,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: designSystem.spacing[5],
            }}>
              <Text style={{
                ...getTypographyStyle('lg', 'bold'),
                color: theme.text,
                textAlign: 'center',
                flex: 1,
              }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <Pressable
                onPress={() => setShowModal(false)}
                android_disableSound={true}
                style={{
                  padding: designSystem.spacing[2],
                  borderRadius: designSystem.borderRadius.md,
                }}
              >
                <Ionicons name="close" size={designSystem.iconSizes.md} color={theme.text} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: designSystem.spacing[5],
            }}>
              <Pressable
                onPress={() => navigateMonth('prev')}
                android_disableSound={true}
                style={{
                  padding: designSystem.spacing[3],
                  borderRadius: designSystem.borderRadius.md,
                  backgroundColor: theme.surface,
                }}
              >
                <Ionicons name="chevron-back" size={designSystem.iconSizes.sm} color={theme.primary} />
              </Pressable>

              <Pressable
                onPress={() => {
                  setCurrentMonth(new Date());
                }}
                android_disableSound={true}
                style={{
                  paddingHorizontal: designSystem.spacing[4],
                  paddingVertical: designSystem.spacing[2],
                  borderRadius: designSystem.borderRadius.md,
                  backgroundColor: theme.primary + '20',
                }}
              >
                <Text style={{
                  color: theme.primary,
                  ...getTypographyStyle('sm', 'semibold'),
                }}>
                  Today
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigateMonth('next')}
                android_disableSound={true}
                style={{
                  padding: designSystem.spacing[3],
                  borderRadius: designSystem.borderRadius.md,
                  backgroundColor: theme.surface,
                }}
              >
                <Ionicons name="chevron-forward" size={designSystem.iconSizes.sm} color={theme.primary} />
              </Pressable>
            </View>

            {/* Days of Week Header */}
            <View style={{
              flexDirection: 'row',
              marginBottom: designSystem.spacing[3],
            }}>
              {dayNames.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    ...getTypographyStyle('sm', 'semibold'),
                    color: theme.textSecondary,
                  }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ marginBottom: designSystem.spacing[5] }}>
              {Array.from({ length: Math.ceil(getDaysInMonth(currentMonth).length / 7) }, (_, weekIndex) => (
                <View key={weekIndex} style={{ flexDirection: 'row', marginBottom: designSystem.spacing[2], gap: designSystem.spacing[1] }}>
                  {getDaysInMonth(currentMonth)
                    .slice(weekIndex * 7, (weekIndex + 1) * 7)
                    .map((date, dayIndex) => {
                      const isCurrentMonthDay = isCurrentMonth(date);
                      const isTodayDate = isToday(date);
                      const isSelectedDate = isSelected(date);
                      
                      return (
                        <Pressable
                          key={dayIndex}
                          onPress={() => selectDate(date)}
                          android_disableSound={true}
                          style={({ pressed }) => ({
                            flex: 1,
                            height: designSystem.touchTarget.min,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: designSystem.borderRadius.lg,
                            backgroundColor: isSelectedDate 
                              ? theme.primary 
                              : isTodayDate 
                              ? theme.primary + '20'
                              : pressed 
                              ? theme.surface 
                              : 'transparent',
                            borderWidth: isSelectedDate ? 0 : designSystem.borderWidth.thin,
                            borderColor: theme.border + '30',
                          })}
                        >
                          <Text style={{
                            ...getTypographyStyle('base', isSelectedDate || isTodayDate ? 'bold' : 'medium'),
                            color: isSelectedDate 
                              ? '#FFFFFF'
                              : isCurrentMonthDay 
                              ? theme.text
                              : theme.textSecondary,
                            opacity: isCurrentMonthDay ? 1 : 0.4,
                            textAlign: 'center',
                          }}>
                            {date.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={{
              flexDirection: 'row',
              gap: designSystem.spacing[3],
            }}>
              <Pressable
                onPress={() => setShowModal(false)}
                android_disableSound={true}
                style={{
                  flex: 1,
                  padding: designSystem.spacing[3],
                  borderRadius: designSystem.borderRadius.md,
                  backgroundColor: theme.surface,
                  alignItems: 'center',
                  borderWidth: designSystem.borderWidth.thin,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ 
                  color: theme.text,
                  ...getTypographyStyle('sm', 'semibold'),
                }}>
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  const today = new Date();
                  selectDate(today);
                }}
                android_disableSound={true}
                style={{
                  flex: 1,
                  padding: designSystem.spacing[3],
                  borderRadius: designSystem.borderRadius.md,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  color: theme.textInverse,
                  ...getTypographyStyle('sm', 'semibold'),
                }}>
                  Select Today
                </Text>
              </Pressable>
            </View>
          </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}