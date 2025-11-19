import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'approval' | 'announcement' | 'alert';
  time: string;
  isRead: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Leave Request Pending',
    message: 'Your leave request for 22-25 Nov is pending approval',
    type: 'approval',
    time: '2 hours ago',
    isRead: false,
    icon: 'time',
    color: '#F59E0B',
  },
  {
    id: '2',
    title: 'New Project Assigned',
    message: 'You have been assigned to "Website Redesign" project',
    type: 'task',
    time: '5 hours ago',
    isRead: false,
    icon: 'briefcase',
    color: '#3B82F6',
  },
  {
    id: '3',
    title: 'Company Event Tomorrow',
    message: 'Annual Day celebration at 10 AM in main hall',
    type: 'announcement',
    time: '1 day ago',
    isRead: true,
    icon: 'megaphone',
    color: '#8B5CF6',
  },
  {
    id: '4',
    title: 'Attendance Reminder',
    message: 'Please mark your attendance before 10 AM',
    type: 'alert',
    time: '2 days ago',
    isRead: true,
    icon: 'alarm',
    color: '#EF4444',
  },
];

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {/* Header */}
      <View
        className="px-6 pt-12 pb-4"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 48,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: theme.colors.text }}
            >
              Notifications
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary, fontSize: 14 }}
            >
              {unreadCount} unread notifications
            </Text>
          </View>
          
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead}>
              <Text
                className="text-sm font-semibold"
                style={{ color: theme.colors.primary }}
              >
                Mark all read
              </Text>
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setFilter('all')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: filter === 'all' ? theme.colors.primary : 'transparent',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: filter === 'all' ? '#FFFFFF' : theme.colors.textSecondary,
              }}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('unread')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: filter === 'unread' ? theme.colors.primary : 'transparent',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: filter === 'unread' ? '#FFFFFF' : theme.colors.textSecondary,
              }}
            >
              Unread ({unreadCount})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      >
        {filteredNotifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text
              className="text-lg font-semibold mt-4"
              style={{ color: theme.colors.textSecondary }}
            >
              No notifications
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => markAsRead(notification.id)}
              className="px-6 py-4 border-b"
              style={{
                backgroundColor: notification.isRead
                  ? theme.colors.background
                  : isDark
                  ? '#1F293710'
                  : '#F3F4F610',
                borderBottomColor: isDark ? '#374151' : '#E5E7EB',
              }}
            >
              <View className="flex-row">
                {/* Icon */}
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: `${notification.color}15`,
                  }}
                >
                  <Ionicons
                    name={notification.icon}
                    size={24}
                    color={notification.color}
                  />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-start justify-between mb-1">
                    <Text
                      className="text-base font-bold flex-1"
                      style={{ color: theme.colors.text }}
                    >
                      {notification.title}
                    </Text>
                    {!notification.isRead && (
                      <View
                        className="w-2 h-2 rounded-full ml-2"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    )}
                  </View>
                  <Text
                    className="text-sm mb-2"
                    style={{ color: theme.colors.textSecondary, fontSize: 14 }}
                  >
                    {notification.message}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.colors.textSecondary, fontSize: 12, opacity: 0.8 }}
                  >
                    {notification.time}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
