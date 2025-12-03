import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationsStore } from '@/store/notificationsStore';

interface NotificationBellProps {
  size?: number;
  color?: string;
}

export function NotificationBell({ size = 24, color }: NotificationBellProps) {
  const { theme } = useTheme();
  const { stats, fetchStats } = useNotificationsStore();
  const scale = useSharedValue(1);

  const iconColor = color || theme.text;

  useEffect(() => {
    // Fetch stats on mount
    fetchStats();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animate bell when unread count changes
    if (stats && stats.unread > 0) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 5 }),
        withSpring(1)
      );
    }
  }, [stats?.unread]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push('/(modules)/notifications');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Ionicons
          name={stats && stats.unread > 0 ? 'notifications' : 'notifications-outline'}
          size={size}
          color={iconColor}
        />
        {stats && stats.unread > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <Text style={styles.badgeText}>
              {stats.unread > 99 ? '99+' : stats.unread}
            </Text>
          </View>
        )}
        {stats && stats.high_priority > 0 && (
          <View style={[styles.priorityDot, { backgroundColor: '#ef4444' }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  priorityDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
