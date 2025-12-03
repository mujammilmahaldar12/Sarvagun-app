import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import notificationsService from '@/services/notifications.service';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export default function NotificationBell({ size = 24, color }: NotificationBellProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const iconColor = color || theme.text;

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      console.log('🔔 NotificationBell: Fetching unread count...');
      setLoading(true);
      const count = await notificationsService.getUnreadCount();
      console.log('🔔 NotificationBell: Received count:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    router.push('/(dashboard)/notifications');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <>
            <Ionicons 
              name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
              size={size} 
              color={iconColor} 
            />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.error }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
