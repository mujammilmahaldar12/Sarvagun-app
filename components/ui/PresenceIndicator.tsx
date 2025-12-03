/**
 * Presence Indicator Component
 * Shows online/offline/busy status for users
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserPresence } from '@/services/websocket.service';
import { useTheme } from '@/hooks/useTheme';

interface PresenceIndicatorProps {
  status: UserPresence['status'];
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  style,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const colorMap: Record<UserPresence['status'], string> = {
    online: '#10B981', // Green
    away: '#F59E0B', // Orange
    busy: '#EF4444', // Red
    offline: '#6B7280', // Gray
  };

  const labelMap: Record<UserPresence['status'], string> = {
    online: 'Online',
    away: 'Away',
    busy: 'Busy',
    offline: 'Offline',
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.indicator,
          {
            width: sizeMap[size],
            height: sizeMap[size],
            backgroundColor: colorMap[status],
            borderColor: theme.colors.background,
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {labelMap[status]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    borderRadius: 999,
    borderWidth: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

interface OnlineUsersListProps {
  users: UserPresence[];
  maxDisplay?: number;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  users,
  maxDisplay = 5,
}) => {
  const { theme } = useTheme();
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  return (
    <View style={styles.usersList}>
      {displayUsers.map((user) => (
        <View key={user.userId} style={styles.userItem}>
          <PresenceIndicator status={user.status} size="small" />
          <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>
            {user.userName}
          </Text>
        </View>
      ))}
      {remainingCount > 0 && (
        <Text style={[styles.remaining, { color: theme.colors.textSecondary }]}>
          +{remainingCount} more
        </Text>
      )}
    </View>
  );
};

const usersListStyles = StyleSheet.create({
  usersList: {
    gap: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  remaining: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

const styles2 = { ...styles, ...usersListStyles };
