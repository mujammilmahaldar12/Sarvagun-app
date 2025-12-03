/**
 * WebSocket Service
 * Real-time communication for collaboration features
 */

import { useAuthStore } from '@/store/authStore';

export type WebSocketEvent = 
  | 'user_joined'
  | 'user_left'
  | 'user_typing'
  | 'user_stopped_typing'
  | 'message_received'
  | 'notification_received'
  | 'task_updated'
  | 'project_updated'
  | 'comment_added'
  | 'presence_update'
  | 'connection_established'
  | 'connection_lost';

export interface WebSocketMessage {
  type: WebSocketEvent;
  payload: any;
  timestamp: number;
  userId?: string;
  userName?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
  currentScreen?: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  contextId: string; // project, task, or chat ID
  contextType: 'project' | 'task' | 'chat';
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<WebSocketEvent, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private isConnected = false;
  private currentUserId: string | null = null;

  // WebSocket URL - adjust based on your backend
  private getWebSocketUrl(): string {
    // For development, use your local backend
    const WS_BASE_URL = 'ws://localhost:8000/ws';
    return WS_BASE_URL;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, token?: string): void {
    if (this.isConnecting || this.isConnected) {
      console.log('📡 WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.currentUserId = userId;

    try {
      const url = `${this.getWebSocketUrl()}/user/${userId}${token ? `?token=${token}` : ''}`;
      console.log('🔌 Connecting to WebSocket:', url);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connection_established', { userId });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message.type);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('connection_lost', { userId });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send message through WebSocket
   */
  send(type: WebSocketEvent, payload: any): void {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, message not sent:', type);
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      userId: this.currentUserId || undefined,
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent WebSocket message:', type);
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(callback => callback(message.payload));
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: WebSocketEvent, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: WebSocketEvent, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get connection status
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================================
  // PRESENCE METHODS
  // ============================================================================

  /**
   * Update user presence
   */
  updatePresence(status: UserPresence['status'], currentScreen?: string): void {
    this.send('presence_update', { status, currentScreen });
  }

  /**
   * Broadcast typing indicator
   */
  startTyping(contextId: string, contextType: TypingIndicator['contextType']): void {
    this.send('user_typing', { contextId, contextType });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(contextId: string, contextType: TypingIndicator['contextType']): void {
    this.send('user_stopped_typing', { contextId, contextType });
  }

  // ============================================================================
  // COLLABORATION METHODS
  // ============================================================================

  /**
   * Join a collaboration room (project, task, etc.)
   */
  joinRoom(roomId: string, roomType: 'project' | 'task' | 'chat'): void {
    this.send('user_joined', { roomId, roomType });
  }

  /**
   * Leave a collaboration room
   */
  leaveRoom(roomId: string, roomType: 'project' | 'task' | 'chat'): void {
    this.send('user_left', { roomId, roomType });
  }

  /**
   * Send live update
   */
  sendUpdate(entityType: 'task' | 'project' | 'comment', entityId: string, data: any): void {
    const eventMap = {
      task: 'task_updated' as const,
      project: 'project_updated' as const,
      comment: 'comment_added' as const,
    };

    this.send(eventMap[entityType], { entityId, data });
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
