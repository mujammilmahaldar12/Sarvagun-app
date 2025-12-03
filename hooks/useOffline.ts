/**
 * Offline & Sync Hooks
 * React hooks for offline functionality and sync management
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncManager, SyncStatus, SyncResult } from '@/utils/syncManager';
import { offlineStorage, STORAGE_KEYS } from '@/utils/offlineStorage';

/**
 * Hook to monitor network status
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(syncManager.getNetworkStatus());

  useEffect(() => {
    const unsubscribe = syncManager.onNetworkChange(setIsOnline);
    return unsubscribe;
  }, []);

  return { isOnline, isOffline: !isOnline };
};

/**
 * Hook to monitor sync status
 */
export const useSyncStatus = () => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncManager.onSyncStatusChange((newStatus, newResult) => {
      setStatus(newStatus);
      if (newResult) {
        setResult(newResult);
      }
      setIsSyncing(newStatus === 'syncing');
    });

    // Load initial status
    const loadStatus = async () => {
      const syncStatus = await syncManager.getSyncStatus();
      setQueueLength(syncStatus.queueLength);
      setLastSync(syncStatus.lastSync);
      setIsSyncing(syncStatus.isSyncing);
    };

    loadStatus();

    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    const syncResult = await syncManager.syncAll();
    const syncStatus = await syncManager.getSyncStatus();
    setQueueLength(syncStatus.queueLength);
    setLastSync(syncStatus.lastSync);
    return syncResult;
  }, []);

  return {
    status,
    result,
    queueLength,
    lastSync,
    isSyncing,
    sync,
  };
};

/**
 * Hook to queue offline actions
 */
export const useOfflineQueue = () => {
  const queueAction = useCallback(
    async (
      action: string,
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      data?: any,
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      await syncManager.queueAction(action, endpoint, method, data, priority);
    },
    []
  );

  return { queueAction };
};

/**
 * Hook for offline-first data fetching
 */
export const useOfflineData = <T,>(
  storageKey: string,
  fetchFn: () => Promise<T>,
  options?: {
    maxAge?: number;
    enableCache?: boolean;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useNetworkStatus();

  const maxAge = options?.maxAge || 5 * 60 * 1000; // 5 minutes default
  const enableCache = options?.enableCache !== false;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get cached data first
      if (enableCache) {
        const cached = await offlineStorage.getCache<T>(storageKey, maxAge);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          
          // If online, refresh in background
          if (isOnline) {
            try {
              const fresh = await fetchFn();
              setData(fresh);
              await offlineStorage.saveCache(storageKey, fresh);
            } catch (err) {
              // Keep cached data if refresh fails
              console.log('Background refresh failed, using cached data');
            }
          }
          return;
        }
      }

      // No cache or cache disabled, fetch fresh data
      if (isOnline) {
        const fresh = await fetchFn();
        setData(fresh);
        if (enableCache) {
          await offlineStorage.saveCache(storageKey, fresh);
        }
      } else {
        throw new Error('No cached data and offline');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, fetchFn, maxAge, enableCache, isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isStale: !isOnline && enableCache,
  };
};

/**
 * Hook to manage cache
 */
export const useCache = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalSize: 0,
    items: [] as Array<{ key: string; size: number; age: number }>,
  });

  const loadStats = useCallback(async () => {
    const cacheStats = await offlineStorage.getCacheStats();
    setStats(cacheStats);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const clearCache = useCallback(async () => {
    await offlineStorage.clearAllCache();
    await loadStats();
  }, [loadStats]);

  const removeCache = useCallback(
    async (key: string) => {
      await offlineStorage.removeCache(key);
      await loadStats();
    },
    [loadStats]
  );

  return {
    stats,
    clearCache,
    removeCache,
    refreshStats: loadStats,
  };
};

/**
 * Hook for optimistic updates with offline support
 */
export const useOptimisticUpdate = <T,>() => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { queueAction } = useOfflineQueue();

  const updateOptimistically = useCallback(
    async (
      queryKey: any[],
      updater: (old: T) => T,
      mutationFn: () => Promise<any>,
      options?: {
        endpoint: string;
        method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        data?: any;
        action: string;
        priority?: 'high' | 'medium' | 'low';
      }
    ) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update cache
      if (previousData) {
        queryClient.setQueryData(queryKey, updater(previousData));
      }

      try {
        if (isOnline) {
          // Online: execute mutation immediately
          const result = await mutationFn();
          queryClient.invalidateQueries({ queryKey });
          return result;
        } else {
          // Offline: queue for later
          if (options) {
            await queueAction(
              options.action,
              options.endpoint,
              options.method,
              options.data,
              options.priority
            );
          }
          return null;
        }
      } catch (error) {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }
        throw error;
      }
    },
    [queryClient, isOnline, queueAction]
  );

  return { updateOptimistically };
};

/**
 * Hook to check if data is stale
 */
export const useDataFreshness = (lastFetchTime?: number) => {
  const [isStale, setIsStale] = useState(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!lastFetchTime) {
      setIsStale(true);
      return;
    }

    const now = Date.now();
    const age = now - lastFetchTime;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    setIsStale(age > maxAge || !isOnline);
  }, [lastFetchTime, isOnline]);

  return { isStale, isOnline };
};
