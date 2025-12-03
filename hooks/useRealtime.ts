/**
 * Real-time Collaboration Hooks
 * React hooks for WebSocket and real-time features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { webSocketService, WebSocketEvent, UserPresence, TypingIndicator } from '@/services/websocket.service';

/**
 * Hook to manage WebSocket connection
 */
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to WebSocket
    webSocketService.connect(user.id.toString());

    // Listen for connection events
    const unsubscribeConnected = webSocketService.on('connection_established', () => {
      setIsConnected(true);
    });

    const unsubscribeLost = webSocketService.on('connection_lost', () => {
      setIsConnected(false);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, reconnect if needed
        if (!webSocketService.isConnectionActive()) {
          webSocketService.connect(user.id.toString());
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background, update presence
        webSocketService.updatePresence('away');
      }
      appState.current = nextAppState;
    });

    return () => {
      unsubscribeConnected();
      unsubscribeLost();
      subscription.remove();
      webSocketService.disconnect();
    };
  }, [user?.id]);

  return { isConnected };
};

/**
 * Hook to listen for real-time events
 */
export const useWebSocketEvent = <T = any>(
  event: WebSocketEvent,
  callback: (data: T) => void
) => {
  useEffect(() => {
    const unsubscribe = webSocketService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
};

/**
 * Hook to manage user presence
 */
export const usePresence = (currentScreen?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Update own presence
    webSocketService.updatePresence('online', currentScreen);

    // Listen for presence updates
    const unsubscribe = webSocketService.on('presence_update', (data: UserPresence) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        if (data.status === 'offline') {
          return filtered;
        }
        return [...filtered, data];
      });
    });

    return () => {
      webSocketService.updatePresence('offline');
      unsubscribe();
    };
  }, [user, currentScreen]);

  const updateStatus = useCallback((status: UserPresence['status']) => {
    webSocketService.updatePresence(status, currentScreen);
  }, [currentScreen]);

  return {
    onlineUsers,
    updateStatus,
  };
};

/**
 * Hook for typing indicators
 */
export const useTypingIndicator = (
  contextId: string,
  contextType: TypingIndicator['contextType']
) => {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const unsubscribeTyping = webSocketService.on('user_typing', (data: TypingIndicator) => {
      if (data.contextId === contextId && data.userId !== user?.id?.toString()) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, data];
        });

        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    });

    const unsubscribeStopped = webSocketService.on('user_stopped_typing', (data: TypingIndicator) => {
      if (data.contextId === contextId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeStopped();
    };
  }, [contextId, user?.id]);

  const startTyping = useCallback(() => {
    webSocketService.startTyping(contextId, contextType);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.stopTyping(contextId, contextType);
    }, 3000);
  }, [contextId, contextType]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    webSocketService.stopTyping(contextId, contextType);
  }, [contextId, contextType]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
};

/**
 * Hook to join/leave collaboration rooms
 */
export const useCollaborationRoom = (
  roomId: string,
  roomType: 'project' | 'task' | 'chat'
) => {
  const [participants, setParticipants] = useState<UserPresence[]>([]);

  useEffect(() => {
    // Join room
    webSocketService.joinRoom(roomId, roomType);

    // Listen for user join/leave
    const unsubscribeJoin = webSocketService.on('user_joined', (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(prev => [...prev, data.user]);
      }
    });

    const unsubscribeLeave = webSocketService.on('user_left', (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      }
    });

    return () => {
      webSocketService.leaveRoom(roomId, roomType);
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, [roomId, roomType]);

  return { participants };
};

/**
 * Hook for live data updates
 */
export const useLiveUpdates = <T = any>(
  entityType: 'task' | 'project' | 'comment',
  entityId: string,
  onUpdate: (data: T) => void
) => {
  useEffect(() => {
    const eventMap = {
      task: 'task_updated' as const,
      project: 'project_updated' as const,
      comment: 'comment_added' as const,
    };

    const unsubscribe = webSocketService.on(eventMap[entityType], (data: any) => {
      if (data.entityId === entityId) {
        onUpdate(data.data);
      }
    });

    return unsubscribe;
  }, [entityType, entityId, onUpdate]);

  const sendUpdate = useCallback((data: T) => {
    webSocketService.sendUpdate(entityType, entityId, data);
  }, [entityType, entityId]);

  return { sendUpdate };
};

/**
 * Hook for real-time notifications
 */
export const useRealtimeNotifications = (onNotification: (notification: any) => void) => {
  useWebSocketEvent('notification_received', onNotification);
};

/**
 * Hook to get connection status
 */
export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnectionActive());

  useEffect(() => {
    const unsubscribeConnected = webSocketService.on('connection_established', () => {
      setIsConnected(true);
    });

    const unsubscribeLost = webSocketService.on('connection_lost', () => {
      setIsConnected(false);
    });

    // Check current status
    setIsConnected(webSocketService.isConnectionActive());

    return () => {
      unsubscribeConnected();
      unsubscribeLost();
    };
  }, []);

  return { isConnected };
};
