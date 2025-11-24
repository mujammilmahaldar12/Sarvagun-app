import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AnimatedPressable, Card, Badge, Button } from '@/components';
import { spacing, borderRadius, iconSizes } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { formatDistanceToNow } from 'date-fns';

// Notification types
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mention' | 'task' | 'event' | 'leave' | 'project';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  userName?: string;
  actionUrl?: string;
}

// Dummy notifications data
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Rajesh Kumar mentioned you',
    message: 'Rajesh mentioned you in a comment on "Q4 Marketing Campaign"',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    userName: 'Rajesh Kumar',
  },
  {
    id: '2',
    type: 'task',
    title: 'New task assigned',
    message: 'You have been assigned to "Update user dashboard UI"',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Leave approved',
    message: 'Your leave request for Dec 25-27 has been approved by HR',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '4',
    type: 'event',
    title: 'Upcoming event reminder',
    message: 'Team Building Workshop starts in 2 days',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '5',
    type: 'project',
    title: 'Project milestone completed',
    message: 'Mobile App Development - Phase 1 has been completed',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '6',
    type: 'warning',
    title: 'Task deadline approaching',
    message: '"API Integration" is due in 2 hours',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '7',
    type: 'info',
    title: 'New announcement',
    message: 'Company holiday schedule updated for next month',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

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

const NotificationItem = ({ notification, onPress, onMarkAsRead }: { 
  notification: Notification; 
  onPress: () => void;
  onMarkAsRead: () => void;
}) => {
  const { theme } = useTheme();
  
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
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
      style={!notification.isRead ? { backgroundColor: theme.primary + '08' } : undefined}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <NotificationIcon type={notification.type} isRead={notification.isRead} />
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
            <Text 
              style={[
                { 
                  fontSize: 14, 
                  fontWeight: !notification.isRead ? '700' : '600',
                  color: theme.text,
                  flex: 1,
                  marginRight: spacing.xs,
                }
              ]} 
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.isRead && (
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
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    // Navigate to relevant page if actionUrl exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {filteredNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <NotificationItem
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
});
