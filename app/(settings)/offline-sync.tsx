/**
 * Offline & Sync Settings Screen
 * Manage offline data, cache, and synchronization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable, GlassCard, Button, SyncStatusCard } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useCache, useNetworkStatus, useSyncStatus } from '@/hooks/useOffline';
import { syncManager } from '@/utils/syncManager';

export default function OfflineSyncScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isOnline } = useNetworkStatus();
  const { queueLength, sync } = useSyncStatus();
  const { stats, clearCache, refreshStats } = useCache();
  
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all offline cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline');
      return;
    }

    try {
      const result = await sync();
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.success} items${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`
      );
    } catch (error) {
      Alert.alert('Sync Failed', 'An error occurred during sync');
    }
  };

  const handleRefreshCache = async () => {
    try {
      await syncManager.refreshCache();
      await refreshStats();
      Alert.alert('Success', 'Cache refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh cache');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatAge = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
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
        colors={isDark ? ['#1F2937', '#111827'] : [theme.primary + '15', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AnimatedPressable onPress={() => router.back()} hapticType="light">
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Offline & Sync
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Manage offline data and synchronization
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sync Status */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <SyncStatusCard />
        </Animated.View>

        {/* Settings */}
        <GlassCard variant="default" intensity="medium" style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Sync Settings
          </Text>

          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Auto Sync
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Automatically sync when online
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={autoSync ? theme.primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Offline Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Prefer cached data over network
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={offlineMode ? theme.primary : '#f4f3f4'}
            />
          </View>
        </GlassCard>

        {/* Cache Statistics */}
        <GlassCard variant="default" intensity="medium" style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Cache Statistics
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="file-tray-full" size={32} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats.totalItems}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Cached Items
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="save" size={32} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatBytes(stats.totalSize)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Storage Used
              </Text>
            </View>
          </View>

          {stats.items.length > 0 && (
            <View style={styles.cacheList}>
              <Text style={[styles.cacheListTitle, { color: theme.text }]}>
                Cached Data
              </Text>
              {stats.items.slice(0, 5).map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.cacheItem,
                    { borderBottomColor: theme.border },
                    index === stats.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cacheItemKey, { color: theme.text }]}>
                      {item.key.replace('@offline/', '')}
                    </Text>
                    <Text style={[styles.cacheItemMeta, { color: theme.textSecondary }]}>
                      {formatBytes(item.size)} • {formatAge(item.age)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Force Sync Now"
            onPress={handleForceSync}
            variant="primary"
            size="lg"
            leftIcon="sync"
            disabled={!isOnline || queueLength === 0}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            title="Refresh Cache"
            onPress={handleRefreshCache}
            variant="outline"
            size="lg"
            leftIcon="refresh"
            disabled={!isOnline}
            style={{ marginBottom: spacing.sm }}
          />

          <Button
            title="Clear All Cache"
            onPress={handleClearCache}
            variant="outline"
            size="lg"
            leftIcon="trash-outline"
            style={{ marginBottom: spacing.sm }}
          />
        </View>

        {/* Info */}
        <GlassCard variant="default" intensity="light" style={{ marginTop: spacing.lg }}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              About Offline Mode
            </Text>
          </View>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            When offline, the app will use cached data to provide a seamless experience. 
            Any actions you take will be queued and synced automatically when you're back online.
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing['2xl'],
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLabel: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: 2,
  },
  settingDescription: {
    ...getTypographyStyle('sm', 'regular'),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    ...getTypographyStyle('xl', 'bold'),
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
    textAlign: 'center',
  },
  cacheList: {
    marginTop: spacing.md,
  },
  cacheListTitle: {
    ...getTypographyStyle('sm', 'semibold'),
    marginBottom: spacing.sm,
  },
  cacheItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cacheItemKey: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: 2,
  },
  cacheItemMeta: {
    ...getTypographyStyle('xs', 'regular'),
  },
  actionsSection: {
    marginTop: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    ...getTypographyStyle('sm', 'semibold'),
  },
  infoText: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 20,
  },
});
