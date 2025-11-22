import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { designSystem } from '@/constants/designSystem';
import {
  useNotifications,
  useNotificationStats,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/hooks/useNotificationQueries';
import {
  getNotificationIcon,
  formatNotificationTime,
  groupNotificationsByDate,
  handleNotificationPress,
  sortNotifications,
  filterNotificationsBySearch,
} from '@/utils/notificationHelpers';
import { Notification, NotificationStatus } from '@/types/notification';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SearchBar } from '@/components/ui/SearchBar';

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const [filter, setFilter] = useState<NotificationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useNotifications(filter !== 'all' ? { status: filter } : undefined);

  const { data: stats } = useNotificationStats();

  // Mutations
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  // Process notifications
  const processedNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery) {
      filtered = filterNotificationsBySearch(filtered, searchQuery);
    }

    // Sort notifications
    return sortNotifications(filtered);
  }, [notifications, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(processedNotifications),
    [processedNotifications]
  );

  const unreadCount = stats?.unread || 0;

  // Handlers
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.status === 'read') return;

    try {
      await markAsRead.mutateAsync(notification.id);
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllAsRead.mutateAsync();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark all as read');
    }
  };

  const handleNotificationTap = async (notification: Notification) => {
    // Mark as read
    await handleMarkAsRead(notification);

    // Navigate to target
    handleNotificationPress(notification);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification.mutateAsync(id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };


  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading notifications..." />;
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.background }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Notifications"
          description="Failed to load notifications. Please try again."
          actionTitle="Retry"
          onActionPress={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Header */}
      <View
        className="px-6 pt-12 pb-4"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 48,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold mb-1" style={{ color: theme.text }}>
              Notifications
            </Text>
            <Text
              className="text-sm"
              style={{ ...getTypographyStyle('sm', 'regular'), color: theme.textSecondary }}
            >
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllAsRead} disabled={markAllAsRead.isPending}>
              {markAllAsRead.isPending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
                  Mark all read
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Search Bar */}
        <View className="mb-3">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notifications..."
          />
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setFilter('all')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: filter === 'all' ? theme.primary : 'transparent',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: filter === 'all' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              All ({stats?.total || 0})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('unread')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: filter === 'unread' ? theme.primary : 'transparent',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: filter === 'unread' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              Unread ({unreadCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('read')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: filter === 'read' ? theme.primary : 'transparent',
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: filter === 'read' ? '#FFFFFF' : theme.textSecondary,
              }}
            >
              Read
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {processedNotifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <EmptyState
              icon="notifications-off-outline"
              title="No Notifications"
              description={
                searchQuery
                  ? 'No notifications match your search'
                  : filter === 'unread'
                  ? "You're all caught up!"
                  : 'No notifications to display'
              }
            />
          </View>
        ) : (
          groupedNotifications.map((group) => (
            <View key={group.date}>
              {/* Date Header */}
              <View className="px-6 py-2">
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  {group.date}
                </Text>
              </View>

              {/* Notifications */}
              {group.notifications.map((notification) => {
                const iconConfig = getNotificationIcon(notification.type);
                const isUnread = notification.status === 'unread';

                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationTap(notification)}
                    onLongPress={() => handleDelete(notification.id)}
                    className="px-6 py-4 border-b"
                    style={{
                      backgroundColor: isUnread
                        ? isDark
                          ? '#1F293710'
                          : '#F3F4F610'
                        : theme.background,
                      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                    }}
                  >
                    <View className="flex-row">
                      {/* Icon */}
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: iconConfig.backgroundColor,
                        }}
                      >
                        <Ionicons
                          name={iconConfig.name as any}
                          size={24}
                          color={iconConfig.color}
                        />
                      </View>

                      {/* Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-1">
                          <Text
                            className="text-base font-bold flex-1"
                            style={{ color: theme.text }}
                            numberOfLines={2}
                          >
                            {notification.title}
                          </Text>
                          {isUnread && (
                            <View
                              className="w-2 h-2 rounded-full ml-2 mt-1"
                              style={{ backgroundColor: theme.primary }}
                            />
                          )}
                        </View>
                        <Text
                          className="text-sm mb-2"
                          style={{
                            ...getTypographyStyle('sm', 'regular'),
                            color: theme.textSecondary,
                          }}
                          numberOfLines={3}
                        >
                          {notification.message}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-xs"
                            style={{
                              ...getTypographyStyle('xs', 'regular'),
                              color: theme.textSecondary,
                              opacity: 0.8,
                            }}
                          >
                            {formatNotificationTime(notification.created_at)}
                          </Text>
                          {notification.actor_name && (
                            <Text
                              className="text-xs"
                              style={{
                                ...getTypographyStyle('xs', 'medium'),
                                color: theme.primary,
                              }}
                            >
                              by {notification.actor_name}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
