import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AnimatedPressable, Card, Badge, Button } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotificationQueries';

// Notification types
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mention' | 'task' | 'event' | 'leave' | 'project';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  avatar?: string;
  user_name?: string;
  action_url?: string;
}

const NotificationIcon = ({ type, isRead }: { type: NotificationType; isRead: boolean }) => {
  const getIconConfig = () => {
    switch (type) {
      case 'mention':
        return { name: 'at-circle' as const, color: '#6366F1' };
      case 'task':
        return { name: 'checkmark-circle' as const, color: '#10B981' };
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981' };
      case 'warning':
        return { name: 'alert-circle' as const, color: '#F59E0B' };
      case 'error':
        return { name: 'close-circle' as const, color: '#EF4444' };
      case 'event':
        return { name: 'calendar' as const, color: '#3B82F6' };
      case 'leave':
        return { name: 'airplane' as const, color: '#A855F7' };
      case 'project':
        return { name: 'briefcase' as const, color: '#4F46E5' };
      default:
        return { name: 'notifications' as const, color: '#6B7280' };
    }
  };

  const { name, color } = getIconConfig();

  return (
    <View style={[styles.iconContainer, { backgroundColor: color + '12' }]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
};

const NotificationItemComponent = ({ notification, onPress, onMarkAsRead }: {
  notification: NotificationItem;
  onPress: () => void;
  onMarkAsRead: () => void;
}) => {
  const { theme, isDark } = useTheme();

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <AnimatedPressable
      onPress={onPress}
      springConfig="smooth"
      hapticType="light"
    >
      <View style={[
        styles.notificationCard,
        { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' },
        notification.is_read && { backgroundColor: isDark ? '#111827' : '#F9FAFB', borderLeftColor: isDark ? '#4B5563' : '#D1D5DB' }
      ]}>
        <View style={styles.cardContent}>
          <NotificationIcon type={notification.type} isRead={notification.is_read} />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: notification.is_read ? '500' : '600',
                color: notification.is_read ? theme.textSecondary : theme.text,
                lineHeight: 19,
                marginBottom: 3,
              }}
              numberOfLines={2}
            >
              {notification.title}
            </Text>

            {notification.message && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 18,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {notification.message}
              </Text>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.textTertiary,
                }}
              >
                {timeAgo}{notification.user_name && ` • ${notification.user_name}`}
              </Text>
              {!notification.is_read && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.primary,
                }} />
              )}
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch real notifications from API
  const {
    data: notificationsData = [],
    isLoading,
    refetch,
    isRefetching
  } = useNotifications(filter === 'unread' ? { status: 'unread' } : undefined);

  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  // Transform API data to match our interface
  const notifications: NotificationItem[] = notificationsData.map((n: any) => ({
    id: n.id,
    type: (n.notification?.type_name || n.type || 'info') as NotificationType,
    title: n.notification?.title || 'Notification',
    message: n.notification?.message || '',
    created_at: n.notification?.created_at || new Date().toISOString(),
    is_read: n.read !== undefined ? n.read : false,
    avatar: n.actor_avatar || n.avatar,
    user_name: n.actor_name || n.user_name || n.sender_name,
    action_url: n.notification?.url || n.action_url,
  }));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleNotificationPress = (notification: NotificationItem) => {
    // Mark as read via API
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page if action_url exists
    if (notification.action_url) {
      router.push(notification.action_url as any);
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <AnimatedPressable
              onPress={() => setFilter('all')}
              hapticType="light"
              style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: filter === 'all' ? theme.primary + '15' : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: filter === 'all' ? theme.primary : theme.textSecondary }}>
                All
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setFilter('unread')}
              hapticType="light"
              style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: filter === 'unread' ? theme.primary + '15' : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: filter === 'unread' ? theme.primary : theme.textSecondary }}>
                Unread
              </Text>
            </AnimatedPressable>
            {unreadCount > 0 && (
              <AnimatedPressable
                onPress={handleMarkAllAsRead}
                hapticType="light"
                style={{ paddingVertical: 4, paddingHorizontal: 6 }}
              >
                <Ionicons name="checkmark-done" size={18} color={theme.primary} />
              </AnimatedPressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <NotificationItemComponent
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
              {filter === 'unread'
                ? "You've read all your notifications"
                : "We'll notify you when something new arrives"}
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 54,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  notificationsList: {
    paddingHorizontal: 0,
  },
  notificationWrapper: {
    marginBottom: 0,
  },
  notificationCard: {
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...getTypographyStyle('sm', 'regular'),
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    ...getTypographyStyle('base', 'medium'),
    marginTop: spacing.base,
  },
});
