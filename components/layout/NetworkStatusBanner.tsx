/**
 * Network Status Banner
 * Displays offline/sync status indicator
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeOutUp,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useNetworkStatus, useSyncStatus } from '@/hooks/useOffline';
import { spacing } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { formatDistanceToNow } from 'date-fns';

export const NetworkStatusBanner: React.FC = () => {
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, queueLength, lastSync, sync } = useSyncStatus();
  const [showBanner, setShowBanner] = useState(!isOnline);
  const [wasOffline, setWasOffline] = useState(false);

  // Animation for syncing indicator
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isSyncing, rotation]);

  const syncIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Connection restored - show for 3 seconds then hide
      setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner && queueLength === 0) return null;

  const getBannerColor = () => {
    if (!isOnline) return '#EF4444'; // Red for offline
    if (isSyncing) return '#F59E0B'; // Orange for syncing
    if (queueLength > 0) return '#3B82F6'; // Blue for pending
    return '#10B981'; // Green for online
  };

  const getBannerText = () => {
    if (!isOnline) return 'You are offline';
    if (isSyncing) return 'Syncing data...';
    if (queueLength > 0) return `${queueLength} action${queueLength > 1 ? 's' : ''} pending`;
    if (wasOffline) return 'Back online';
    return 'All data synced';
  };

  const getBannerIcon = () => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    if (queueLength > 0) return 'cloud-upload';
    return 'cloud-done';
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.banner,
        {
          backgroundColor: getBannerColor(),
          top: Platform.OS === 'ios' ? 44 : 0,
        },
      ]}
    >
      <Pressable
        style={styles.bannerContent}
        onPress={() => {
          if (queueLength > 0 && isOnline) {
            sync();
          }
        }}
      >
        <Animated.View style={syncIconStyle}>
          <Ionicons name={getBannerIcon() as any} size={18} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.bannerText}>{getBannerText()}</Text>
        {lastSync && isOnline && !isSyncing && (
          <Text style={styles.bannerSubtext}>
            Last synced {formatDistanceToNow(lastSync, { addSuffix: true })}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

/**
 * Compact network status indicator (for use in headers)
 */
export const NetworkStatusIndicator: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, queueLength } = useSyncStatus();

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isSyncing || !isOnline) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isSyncing, isOnline, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const getColor = () => {
    if (!isOnline) return '#EF4444';
    if (isSyncing) return '#F59E0B';
    if (queueLength > 0) return '#3B82F6';
    return '#10B981';
  };

  const getIcon = () => {
    if (!isOnline) return 'cloud-offline-outline';
    if (isSyncing) return 'sync-outline';
    if (queueLength > 0) return 'cloud-upload-outline';
    return 'cloud-done-outline';
  };

  return (
    <Animated.View style={[styles.indicator, pulseStyle]}>
      <Ionicons name={getIcon() as any} size={size} color={getColor()} />
    </Animated.View>
  );
};

/**
 * Sync status card (for settings/debug)
 */
export const SyncStatusCard: React.FC = () => {
  const { theme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { isSyncing, queueLength, lastSync, sync } = useSyncStatus();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Ionicons 
          name={isOnline ? 'wifi' : 'wifi-off'} 
          size={24} 
          color={isOnline ? '#10B981' : '#EF4444'} 
        />
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
            Sync Status
          </Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>
            {isSyncing ? 'Syncing...' : 'Idle'}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
            Pending Actions
          </Text>
          <Text style={[styles.cardValue, { color: theme.text }]}>
            {queueLength}
          </Text>
        </View>

        {lastSync && (
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
              Last Synced
            </Text>
            <Text style={[styles.cardValue, { color: theme.text }]}>
              {formatDistanceToNow(lastSync, { addSuffix: true })}
            </Text>
          </View>
        )}
      </View>

      {queueLength > 0 && isOnline && (
        <Pressable
          onPress={() => sync()}
          style={[styles.syncButton, { backgroundColor: theme.primary }]}
          disabled={isSyncing}
        >
          <Ionicons name="sync" size={16} color="#FFFFFF" />
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerText: {
    ...getTypographyStyle('sm', 'semibold'),
    color: '#FFFFFF',
    flex: 1,
  },
  bannerSubtext: {
    ...getTypographyStyle('xs', 'regular'),
    color: '#FFFFFF',
    opacity: 0.9,
  },
  indicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  cardBody: {
    gap: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    ...getTypographyStyle('sm', 'regular'),
  },
  cardValue: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  syncButtonText: {
    ...getTypographyStyle('sm', 'semibold'),
    color: '#FFFFFF',
  },
});

export default NetworkStatusBanner;
