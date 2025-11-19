import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-employee',
    title: 'Add Employee',
    description: 'Register new employee',
    icon: 'person-add',
    route: '/(modules)/hr/add',
    color: '#3B82F6',
  },
  {
    id: 'create-event',
    title: 'Create Event',
    description: 'Schedule new event',
    icon: 'calendar-sharp',
    route: '/(modules)/events/add',
    color: '#8B5CF6',
  },
  {
    id: 'add-expense',
    title: 'Add Expense',
    description: 'Record new expense',
    icon: 'receipt',
    route: '/(modules)/finance/add',
    color: '#10B981',
  },
  {
    id: 'create-project',
    title: 'Create Project',
    description: 'Start new project',
    icon: 'folder-open',
    route: '/(modules)/projects/add',
    color: '#F59E0B',
  },
  {
    id: 'apply-leave',
    title: 'Apply Leave',
    description: 'Submit leave request',
    icon: 'time',
    route: '/(modules)/leave/add',
    color: '#EF4444',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    description: 'Check in/out',
    icon: 'checkmark-circle',
    route: '/(modules)/hr/attendance',
    color: '#06B6D4',
  },
];

export default function QuickAddScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const handleActionPress = (route: string) => {
    // router.push(route);
    console.log('Quick action:', route);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 48,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.text }}
        >
          Quick Actions
        </Text>
        <Text
          className="text-base"
          style={{ color: theme.colors.textSecondary }}
        >
          Perform common tasks quickly
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
      >
        <View className="flex-row flex-wrap justify-between">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleActionPress(action.route)}
              className="mb-4"
              style={({ pressed }) => ({
                width: '48%',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <View
                className="rounded-2xl p-5 items-center"
                style={{
                  backgroundColor: theme.colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                  minHeight: 140,
                }}
              >
                {/* Icon */}
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${action.color}15`,
                  }}
                >
                  <Ionicons name={action.icon} size={32} color={action.color} />
                </View>

                {/* Title */}
                <Text
                  className="text-base font-bold text-center mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {action.title}
                </Text>

                {/* Description */}
                <Text
                  className="text-xs text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {action.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
