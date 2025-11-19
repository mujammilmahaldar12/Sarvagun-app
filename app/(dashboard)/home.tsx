import React from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  change?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const STATS: StatCard[] = [
  {
    id: 'attendance',
    title: 'Attendance',
    value: '95%',
    icon: 'checkmark-circle',
    color: '#10B981',
    bgColor: '#ECFDF5',
    change: '+2.5%',
  },
  {
    id: 'leaves',
    title: 'Leave Balance',
    value: '12 Days',
    icon: 'calendar',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'tasks',
    title: 'Active Tasks',
    value: '8',
    icon: 'list',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'projects',
    title: 'Projects',
    value: '3',
    icon: 'briefcase',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'attendance',
    title: 'Mark Attendance',
    icon: 'finger-print',
    route: '/attendance',
    color: '#10B981',
  },
  {
    id: 'leave',
    title: 'Apply Leave',
    icon: 'time',
    route: '/(modules)/leave/add',
    color: '#EF4444',
  },
  {
    id: 'expense',
    title: 'Add Expense',
    icon: 'receipt',
    route: '/(modules)/finance/add',
    color: '#F59E0B',
  },
  {
    id: 'task',
    title: 'New Task',
    icon: 'add-circle',
    route: '/(modules)/projects/add',
    color: '#3B82F6',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Section */}
        <View
          className="px-6 pb-6"
          style={{
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 56,
            backgroundColor: theme.colors.surface,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Greeting & Profile */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text
                className="text-sm mb-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {getGreeting()} 👋
              </Text>
              <Text
                className="text-2xl font-bold"
                style={{ color: theme.colors.text }}
              >
                {user?.full_name || 'User'}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {user?.designation} • {user?.category}
              </Text>
            </View>
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-xl font-bold text-white">
                {getInitials(user?.full_name)}
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row justify-between">
            {STATS.slice(0, 2).map((stat) => (
              <View
                key={stat.id}
                className="rounded-2xl p-4"
                style={{
                  width: '48%',
                  minHeight: 100,
                  backgroundColor: isDark ? '#1F2937' : stat.bgColor,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                  {stat.change && (
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: stat.color }}
                    >
                      {stat.change}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {stat.value}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {stat.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-bold"
              style={{ color: theme.colors.text }}
            >
              Quick Actions
            </Text>
            <Pressable onPress={() => router.push('/(dashboard)/quick-add')}>
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.primary }}
              >
                View All
              </Text>
            </Pressable>
          </View>
          <View className="flex-row justify-between flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => console.log('Action:', action.route)}
                style={({ pressed }) => ({
                  width: '48%',
                  marginBottom: 12,
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <View
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{
                    minHeight: 72,
                    backgroundColor: theme.colors.surface,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: `${action.color}15`,
                    }}
                  >
                    <Ionicons name={action.icon} size={20} color={action.color} />
                  </View>
                  <Text
                    className="text-sm font-semibold flex-1"
                    style={{ color: theme.colors.text }}
                  >
                    {action.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* More Stats */}
        <View className="px-6 mt-4">
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: theme.colors.text }}
          >
            Overview
          </Text>
          <View className="flex-row justify-between flex-wrap">
            {STATS.slice(2).map((stat) => (
              <View
                key={stat.id}
                className="rounded-2xl p-4"
                style={{
                  width: '48%',
                  minHeight: 120,
                  marginBottom: 12,
                  backgroundColor: theme.colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                  style={{
                    backgroundColor: isDark ? `${stat.color}20` : stat.bgColor,
                  }}
                >
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.colors.text }}
                >
                  {stat.value}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {stat.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6">
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: theme.colors.text }}
          >
            Recent Activity
          </Text>
          <View
            className="rounded-2xl p-4"
            style={{
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {[
              {
                title: 'Leave Request Approved',
                time: '2 hours ago',
                icon: 'checkmark-circle' as const,
                color: '#10B981',
              },
              {
                title: 'New Task Assigned',
                time: '5 hours ago',
                icon: 'briefcase' as const,
                color: '#3B82F6',
              },
              {
                title: 'Attendance Marked',
                time: '1 day ago',
                icon: 'finger-print' as const,
                color: '#8B5CF6',
              },
            ].map((activity, index, arr) => (
              <View
                key={index}
                className="flex-row items-center py-3"
                style={{
                  borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: `${activity.color}15`,
                  }}
                >
                  <Ionicons name={activity.icon} size={20} color={activity.color} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: theme.colors.text }}
                  >
                    {activity.title}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {activity.time}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
