import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationsStore } from '@/store/notificationsStore';
import { EmptyState, LoadingState } from '@/components';
import { formatDate } from '@/utils/formatters';
import type { Notification } from '@/types/notifications';

type NotificationFilter = 'all' | 'unread' | 'high_priority';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    stats,
    loading,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotificationsStore();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    await Promise.all([
      fetchNotifications(filter === 'unread'),
      fetchStats(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      router.push(notification.action_url as any);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter((n) => !n.read);
    } else if (filter === 'high_priority') {
      filtered = notifications.filter((n) => n.priority === 'high' || n.priority === 'urgent');
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      lead_converted: 'checkmark-circle',
      event_created: 'calendar',
      event_updated: 'create',
      event_cancelled: 'close-circle',
      payment_received: 'cash',
      expense_added: 'trending-down',
      vendor_assigned: 'people',
      system: 'information-circle',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: theme.textSecondary,
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority] || theme.textSecondary;
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#94a3b8',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority] || '#94a3b8';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          {stats && stats.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadBadgeText}>{stats.unread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={markAllAsRead}
          style={[styles.markAllButton, { backgroundColor: theme.surface }]}
          disabled={!stats || stats.unread === 0}
        >
          <Ionicons
            name="checkmark-done"
            size={20}
            color={stats && stats.unread > 0 ? theme.primary : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && [styles.filterTabActive, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filter === 'all' ? theme.primary : theme.text },
            ]}
          >
            All
          </Text>
          {stats && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: filter === 'all' ? theme.primary + '20' : theme.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  { color: filter === 'all' ? theme.primary : theme.textSecondary },
                ]}
              >
                {stats.total}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && [styles.filterTabActive, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filter === 'unread' ? theme.primary : theme.text },
            ]}
          >
            Unread
          </Text>
          {stats && stats.unread > 0 && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: filter === 'unread' ? theme.primary : '#ef4444',
                },
              ]}
            >
              <Text style={styles.filterBadgeText}>{stats.unread}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'high_priority' &&
              [styles.filterTabActive, { borderBottomColor: theme.primary }],
          ]}
          onPress={() => setFilter('high_priority')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filter === 'high_priority' ? theme.primary : theme.text },
            ]}
          >
            Priority
          </Text>
          {stats && stats.high_priority > 0 && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor:
                    filter === 'high_priority' ? theme.primary + '20' : theme.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  { color: filter === 'high_priority' ? theme.primary : theme.textSecondary },
                ]}
              >
                {stats.high_priority}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading && !refreshing ? (
        <LoadingState variant="skeleton" skeletonCount={8} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={
            filter === 'unread'
              ? 'No Unread Notifications'
              : filter === 'high_priority'
              ? 'No Priority Notifications'
              : 'No Notifications'
          }
          subtitle={
            filter === 'unread'
              ? "You're all caught up!"
              : 'Notifications will appear here when you have new activity'
          }
        />
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                entering={SlideInRight.delay(index * 50)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.notificationCard,
                    {
                      backgroundColor: notification.read ? theme.surface : theme.primary + '10',
                      borderColor: notification.read ? theme.border : theme.primary + '30',
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  onLongPress={() => deleteNotification(notification.id)}
                >
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <View style={[styles.unreadIndicator, { backgroundColor: theme.primary }]} />
                  )}

                  <View style={styles.notificationContent}>
                    {/* Icon */}
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor:
                            getNotificationColor(notification.priority) + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={24}
                        color={getNotificationColor(notification.priority)}
                      />
                    </View>

                    {/* Content */}
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            { color: theme.text },
                            !notification.read && styles.notificationTitleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        {(notification.priority === 'high' || notification.priority === 'urgent') && (
                          <View
                            style={[
                              styles.priorityBadge,
                              {
                                backgroundColor:
                                  getPriorityBadgeColor(notification.priority) + '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                { color: getPriorityBadgeColor(notification.priority) },
                              ]}
                            >
                              {notification.priority.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[styles.notificationMessage, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>

                      <View style={styles.footer}>
                        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                          {formatDate(notification.created_at, 'relative')}
                        </Text>
                        {notification.action_label && (
                          <Text style={[styles.actionLabel, { color: theme.primary }]}>
                            {notification.action_label} →
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Clear Read Button */}
          {notifications.some((n) => n.read) && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: theme.surface }]}
              onPress={clearReadNotifications}
            >
              <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>
                Clear Read Notifications
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    left: 0,
    width: 4,
    height: '70%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
