import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

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
        fontSize: 14, 
        fontWeight: '600', 
        color: theme.colors.text, 
        marginBottom: 8 
      }}>
        {label}
      </Text>
      
      <Pressable
        onPress={() => setShowModal(true)}
        android_disableSound={true}
        style={{
          borderWidth: 1,
          borderColor: value ? theme.colors.primary : theme.colors.border,
          borderRadius: 8,
          padding: 12,
          backgroundColor: theme.colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ 
          color: value ? theme.colors.text : theme.colors.textSecondary,
          fontSize: 14,
          flex: 1,
        }}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
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
            backgroundColor: theme.colors.background,
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 10,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.colors.text,
                textAlign: 'center',
                flex: 1,
              }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <Pressable
                onPress={() => setShowModal(false)}
                android_disableSound={true}
                style={{
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            {/* Month Navigation */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Pressable
                onPress={() => navigateMonth('prev')}
                android_disableSound={true}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => {
                  setCurrentMonth(new Date());
                }}
                android_disableSound={true}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: theme.colors.primary + '20',
                }}
              >
                <Text style={{
                  color: theme.colors.primary,
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  Today
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigateMonth('next')}
                android_disableSound={true}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              </Pressable>
            </View>

            {/* Days of Week Header */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 12,
            }}>
              {dayNames.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                  }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ marginBottom: 20 }}>
              {Array.from({ length: Math.ceil(getDaysInMonth(currentMonth).length / 7) }, (_, weekIndex) => (
                <View key={weekIndex} style={{ flexDirection: 'row', marginBottom: 8, gap: 4 }}>
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
                            height: 48,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 12,
                            backgroundColor: isSelectedDate 
                              ? theme.colors.primary 
                              : isTodayDate 
                              ? theme.colors.primary + '20'
                              : pressed 
                              ? theme.colors.surface 
                              : 'transparent',
                            borderWidth: isSelectedDate ? 0 : 1,
                            borderColor: theme.colors.border + '30',
                          })}
                        >
                          <Text style={{
                            fontSize: 16,
                            fontWeight: isSelectedDate || isTodayDate ? '700' : '500',
                            color: isSelectedDate 
                              ? '#FFFFFF'
                              : isCurrentMonthDay 
                              ? theme.colors.text
                              : theme.colors.textSecondary,
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
              gap: 12,
            }}>
              <Pressable
                onPress={() => setShowModal(false)}
                android_disableSound={true}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text style={{ 
                  color: theme.colors.text,
                  fontWeight: '600',
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
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ 
                  color: '#fff',
                  fontWeight: '600',
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