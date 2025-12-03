/**
 * Offline Storage Utility
 * Manages offline data caching with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  // Cached Data
  DASHBOARD_DATA: '@offline/dashboard_data',
  USER_PROFILE: '@offline/user_profile',
  PROJECTS: '@offline/projects',
  TASKS: '@offline/tasks',
  ATTENDANCE: '@offline/attendance',
  LEAVE_BALANCE: '@offline/leave_balance',
  NOTIFICATIONS: '@offline/notifications',
  LEADERBOARD: '@offline/leaderboard',
  TEAM_MEMBERS: '@offline/team_members',
  ACTIVITIES: '@offline/activities',
  GOALS: '@offline/goals',
  PERFORMANCE: '@offline/performance',
  
  // Sync Queue
  SYNC_QUEUE: '@offline/sync_queue',
  PENDING_ACTIONS: '@offline/pending_actions',
  
  // Metadata
  LAST_SYNC: '@offline/last_sync',
  CACHE_TIMESTAMPS: '@offline/cache_timestamps',
  OFFLINE_MODE: '@offline/offline_mode',
} as const;

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

class OfflineStorage {
  /**
   * Save data to cache with timestamp
   */
  async saveCache<T>(key: string, data: T): Promise<void> {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
      console.log(`✅ Cached data saved: ${key}`);
    } catch (error) {
      console.error(`❌ Error saving cache ${key}:`, error);
    }
  }

  /**
   * Get cached data
   */
  async getCache<T>(key: string, maxAge?: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cachedData: CachedData<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (maxAge && Date.now() - cachedData.timestamp > maxAge) {
        console.log(`⏰ Cache expired: ${key}`);
        await this.removeCache(key);
        return null;
      }

      console.log(`✅ Cache hit: ${key}`);
      return cachedData.data;
    } catch (error) {
      console.error(`❌ Error reading cache ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove cached data
   */
  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cache removed: ${key}`);
    } catch (error) {
      console.error(`❌ Error removing cache ${key}:`, error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@offline/'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️ All cache cleared (${cacheKeys.length} items)`);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get cache size and statistics
   */
  async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: number;
    items: Array<{ key: string; size: number; age: number }>;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@offline/'));
      
      const items = await Promise.all(
        cacheKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          const size = value ? new Blob([value]).size : 0;
          
          try {
            const cached: CachedData = JSON.parse(value || '{}');
            const age = Date.now() - (cached.timestamp || 0);
            return { key, size, age };
          } catch {
            return { key, size, age: 0 };
          }
        })
      );

      return {
        totalItems: items.length,
        totalSize: items.reduce((sum, item) => sum + item.size, 0),
        items,
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return { totalItems: 0, totalSize: 0, items: [] };
    }
  }

  // ============================================================================
  // SYNC QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Add action to sync queue
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const newItem: SyncQueueItem = {
        ...item,
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newItem);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      console.log(`➕ Added to sync queue: ${newItem.action}`);
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('❌ Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
      console.log(`➖ Removed from sync queue: ${itemId}`);
    } catch (error) {
      console.error('❌ Error removing from sync queue:', error);
    }
  }

  /**
   * Update sync queue item (for retry count)
   */
  async updateSyncQueueItem(itemId: string, updates: Partial<SyncQueueItem>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const index = queue.findIndex(item => item.id === itemId);
      
      if (index !== -1) {
        queue[index] = { ...queue[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
        console.log(`✏️ Updated sync queue item: ${itemId}`);
      }
    } catch (error) {
      console.error('❌ Error updating sync queue item:', error);
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
      console.log('🗑️ Sync queue cleared');
    } catch (error) {
      console.error('❌ Error clearing sync queue:', error);
    }
  }

  // ============================================================================
  // METADATA MANAGEMENT
  // ============================================================================

  /**
   * Set last sync timestamp
   */
  async setLastSync(timestamp: number = Date.now()): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('❌ Error setting last sync:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('❌ Error getting last sync:', error);
      return null;
    }
  }

  /**
   * Set offline mode flag
   */
  async setOfflineMode(isOffline: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(isOffline));
    } catch (error) {
      console.error('❌ Error setting offline mode:', error);
    }
  }

  /**
   * Get offline mode flag
   */
  async getOfflineMode(): Promise<boolean> {
    try {
      const mode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
      return mode ? JSON.parse(mode) : false;
    } catch (error) {
      console.error('❌ Error getting offline mode:', error);
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
