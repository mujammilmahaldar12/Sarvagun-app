/**
 * Collaboration Indicators
 * Visual indicators for real-time collaboration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserPresence } from '@/services/websocket.service';
import { useTheme } from '@/hooks/useTheme';
import { PresenceIndicator } from './PresenceIndicator';

interface ActiveUsersIndicatorProps {
  users: UserPresence[];
  maxDisplay?: number;
  onPress?: () => void;
}

/**
 * Shows active users with avatars
 */
export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({
  users,
  maxDisplay = 3,
  onPress,
}) => {
  const { theme } = useTheme();
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  if (users.length === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.activeUsers, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.avatarsContainer}>
        {displayUsers.map((user, index) => (
          <View
            key={user.userId}
            style={[
              styles.avatar,
              {
                marginLeft: index > 0 ? -8 : 0,
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.surface,
                zIndex: displayUsers.length - index,
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {user.userName.charAt(0).toUpperCase()}
            </Text>
            <View style={styles.presenceWrapper}>
              <PresenceIndicator status={user.status} size="small" />
            </View>
          </View>
        ))}
      </View>
      {remainingCount > 0 && (
        <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
          +{remainingCount}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activeUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  avatarsContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  presenceWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

interface LiveEditingIndicatorProps {
  userName: string;
  fieldName?: string;
}

/**
 * Shows when someone is editing
 */
export const LiveEditingIndicator: React.FC<LiveEditingIndicatorProps> = ({
  userName,
  fieldName,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.editingIndicator, { backgroundColor: theme.colors.warning + '20' }]}>
      <Ionicons name="pencil" size={14} color={theme.colors.warning} />
      <Text style={[styles.editingText, { color: theme.colors.warning }]}>
        {userName} is editing{fieldName ? ` ${fieldName}` : ''}
      </Text>
    </View>
  );
};

const editingStyles = StyleSheet.create({
  editingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

interface ViewingIndicatorProps {
  viewers: UserPresence[];
}

/**
 * Shows who's viewing the current screen
 */
export const ViewingIndicator: React.FC<ViewingIndicatorProps> = ({ viewers }) => {
  const { theme } = useTheme();

  if (viewers.length === 0) return null;

  const getViewersText = () => {
    if (viewers.length === 1) {
      return `${viewers[0].userName} is viewing`;
    } else if (viewers.length === 2) {
      return `${viewers[0].userName} and ${viewers[1].userName} are viewing`;
    } else {
      return `${viewers[0].userName} and ${viewers.length - 1} others are viewing`;
    }
  };

  return (
    <View style={[styles.viewingIndicator, { backgroundColor: theme.colors.info + '20' }]}>
      <Ionicons name="eye-outline" size={14} color={theme.colors.info} />
      <Text style={[styles.viewingText, { color: theme.colors.info }]}>
        {getViewersText()}
      </Text>
    </View>
  );
};

const viewingStyles = StyleSheet.create({
  viewingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  viewingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

interface RealtimeUpdateBadgeProps {
  show: boolean;
  onPress?: () => void;
}

/**
 * Badge that appears when there are new updates
 */
export const RealtimeUpdateBadge: React.FC<RealtimeUpdateBadgeProps> = ({ show, onPress }) => {
  const { theme } = useTheme();

  if (!show) return null;

  return (
    <TouchableOpacity
      style={[styles.updateBadge, { backgroundColor: theme.colors.primary }]}
      onPress={onPress}
    >
      <Ionicons name="arrow-up" size={12} color="#FFFFFF" />
      <Text style={styles.updateBadgeText}>New updates</Text>
    </TouchableOpacity>
  );
};

const badgeStyles = StyleSheet.create({
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

const allStyles = { ...styles, ...editingStyles, ...viewingStyles, ...badgeStyles };
