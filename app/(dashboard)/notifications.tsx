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
        return { name: 'checkmark-circle' as const, color: '#8B5CF6' };
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981' };
      case 'warning':
        return { name: 'warning' as const, color: '#F59E0B' };
      case 'error':
        return { name: 'close-circle' as const, color: '#EF4444' };
      case 'event':
        return { name: 'calendar' as const, color: '#3B82F6' };
      case 'leave':
        return { name: 'time' as const, color: '#A855F7' };
      case 'project':
        return { name: 'briefcase' as const, color: '#4F46E5' };
      default:
        return { name: 'information-circle' as const, color: '#6B7280' };
    }
  };

  const { name, color } = getIconConfig();

  return (
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={name} size={24} color={color} />
      {!isRead && <View style={styles.unreadDot} />}
    </View>
  );
};

const NotificationItemComponent = ({ notification, onPress, onMarkAsRead }: { 
  notification: NotificationItem; 
  onPress: () => void;
  onMarkAsRead: () => void;
}) => {
  const { theme } = useTheme();
  
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  return (
    <Card
      onPress={onPress}
      variant="elevated"
      shadow="sm"
      padding="base"
      animated={true}
      style={!notification.is_read ? { backgroundColor: theme.primary + '08' } : undefined}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <NotificationIcon type={notification.type} isRead={notification.is_read} />
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
            <Text 
              style={[
                { 
                  fontSize: 14, 
                  fontWeight: !notification.is_read ? '700' : '600',
                  color: theme.text,
                  flex: 1,
                  marginRight: spacing.xs,
                }
              ]} 
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.is_read && (
              <Badge variant="dot" size="sm" color={theme.primary} />
            )}
          </View>
          
          <Text 
            style={{ 
              fontSize: 13, 
              color: theme.textSecondary,
              lineHeight: 18,
              marginBottom: spacing.xs,
            }} 
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {timeAgo}
            </Text>
          </View>
        </View>
      </View>
    </Card>
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
    type: (n.type || 'info') as NotificationType,
    title: n.title || 'Notification',
    message: n.message || n.content || '',
    created_at: n.created_at || n.timestamp || new Date().toISOString(),
    is_read: n.is_read || n.read || false,
    avatar: n.avatar,
    user_name: n.user_name || n.sender_name,
    action_url: n.action_url || n.url,
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
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [theme.primary + '10', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge 
                label={unreadCount.toString()} 
                variant="filled" 
                size="sm" 
                color={theme.primary}
              />
            )}
          </View>
          
          {unreadCount > 0 && (
            <AnimatedPressable
              onPress={handleMarkAllAsRead}
              hapticType="light"
              springConfig="bouncy"
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>
                Mark all read
              </Text>
            </AnimatedPressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            title="All"
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilter('all')}
            style={{ flex: 1 }}
          />
          
          <Button
            title={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setFilter('unread')}
            style={{ flex: 1 }}
          />
        </View>
      </LinearGradient>

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
            {notifications.map((notification) => (
              <NotificationItemComponent
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
              />
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.lg : spacing['4xl'],
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  headerTitle: {
    ...getTypographyStyle('2xl', 'bold'),
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  notificationsList: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
