/**
 * Sync Manager
 * Handles synchronization of offline data when connection is restored
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage, SyncQueueItem, STORAGE_KEYS } from './offlineStorage';
import api from '@/services/api';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}

class SyncManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private syncListeners: Set<(status: SyncStatus, result?: SyncResult) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  private initialize(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;

      console.log(`📶 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
      
      // Update offline mode in storage
      offlineStorage.setOfflineMode(!this.isOnline);

      // Notify listeners
      this.notifyListeners(this.isOnline);

      // Auto-sync when connection is restored
      if (!wasOnline && this.isOnline) {
        console.log('🔄 Connection restored, initiating auto-sync...');
        this.syncAll();
      }
    });
  }

  /**
   * Subscribe to network status changes
   */
  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus, result?: SyncResult) => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  /**
   * Notify network listeners
   */
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline));
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(status: SyncStatus, result?: SyncResult): void {
    this.syncListeners.forEach(listener => listener(status, result));
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Check if currently syncing
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending actions
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return { success: 0, failed: 0, errors: [] };
    }

    if (!this.isOnline) {
      console.log('📵 Cannot sync: offline');
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    this.notifySyncListeners('syncing');

    try {
      const queue = await offlineStorage.getSyncQueue();
      console.log(`🔄 Starting sync: ${queue.length} items in queue`);

      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifySyncListeners('success', { success: 0, failed: 0, errors: [] });
        return { success: 0, failed: 0, errors: [] };
      }

      // Sort by priority and timestamp
      const sortedQueue = this.sortQueue(queue);
      
      const result: SyncResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process queue items
      for (const item of sortedQueue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          result.success++;
          console.log(`✅ Synced: ${item.action}`);
        } catch (error: any) {
          console.error(`❌ Sync failed: ${item.action}`, error);
          
          // Increment retry count
          item.retryCount++;
          
          if (item.retryCount >= item.maxRetries) {
            // Max retries reached, remove from queue
            await offlineStorage.removeFromSyncQueue(item.id);
            result.failed++;
            result.errors.push({
              itemId: item.id,
              error: error.message || 'Unknown error',
            });
          } else {
            // Update retry count
            await offlineStorage.updateSyncQueueItem(item.id, {
              retryCount: item.retryCount,
            });
          }
        }
      }

      // Update last sync timestamp
      await offlineStorage.setLastSync();

      console.log(`✅ Sync complete: ${result.success} succeeded, ${result.failed} failed`);
      
      this.isSyncing = false;
      this.notifySyncListeners('success', result);
      
      return result;
    } catch (error) {
      console.error('❌ Sync error:', error);
      this.isSyncing = false;
      this.notifySyncListeners('error');
      return { success: 0, failed: 0, errors: [] };
    }
  }

  /**
   * Sort queue by priority and timestamp
   */
  private sortQueue(queue: SyncQueueItem[]): SyncQueueItem[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return [...queue].sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process a single sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { method, endpoint, data } = item;

    switch (method) {
      case 'GET':
        await api.get(endpoint);
        break;
      case 'POST':
        await api.post(endpoint, data);
        break;
      case 'PUT':
        await api.put(endpoint, data);
        break;
      case 'PATCH':
        await api.patch(endpoint, data);
        break;
      case 'DELETE':
        await api.delete(endpoint);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Add action to sync queue
   */
  async queueAction(
    action: string,
    endpoint: string,
    method: SyncQueueItem['method'],
    data?: any,
    priority: SyncQueueItem['priority'] = 'medium'
  ): Promise<void> {
    await offlineStorage.addToSyncQueue({
      action,
      endpoint,
      method,
      data,
      priority,
      maxRetries: 3,
    });

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncAll();
    }
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus(): Promise<{
    queueLength: number;
    lastSync: number | null;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const queue = await offlineStorage.getSyncQueue();
    const lastSync = await offlineStorage.getLastSync();

    return {
      queueLength: queue.length,
      lastSync,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Force refresh cached data
   */
  async refreshCache(): Promise<void> {
    if (!this.isOnline) {
      console.log('📵 Cannot refresh cache: offline');
      return;
    }

    console.log('🔄 Refreshing cache...');
    
    // Clear old cache
    await offlineStorage.clearAllCache();
    
    // Trigger re-fetch of all data
    // This would typically be handled by React Query's refetch
    console.log('✅ Cache refresh initiated');
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    localData: any,
    serverData: any,
    strategy: 'local' | 'server' | 'merge' = 'server'
  ): Promise<any> {
    switch (strategy) {
      case 'local':
        console.log('🔀 Conflict resolved: using local data');
        return localData;
      
      case 'server':
        console.log('🔀 Conflict resolved: using server data');
        return serverData;
      
      case 'merge':
        console.log('🔀 Conflict resolved: merging data');
        // Simple merge strategy - prefer server for conflicts
        return { ...localData, ...serverData };
      
      default:
        return serverData;
    }
  }
}

export const syncManager = new SyncManager();
export default syncManager;
