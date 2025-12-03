/**
 * Real-time Collaboration Demo Screen
 * Demonstrates WebSocket features
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import {
  useWebSocket,
  usePresence,
  useTypingIndicator,
  useCollaborationRoom,
  useConnectionStatus,
  useRealtimeNotifications,
} from '@/hooks/useRealtime';
import { PresenceIndicator, OnlineUsersList } from '@/components/ui/PresenceIndicator';
import { TypingIndicator, MiniTypingIndicator } from '@/components/ui/TypingIndicator';
import {
  ActiveUsersIndicator,
  LiveEditingIndicator,
  ViewingIndicator,
  RealtimeUpdateBadge,
} from '@/components/ui/CollaborationIndicators';
import { UserPresence } from '@/services/websocket.service';

export default function RealtimeDemoScreen() {
  const { theme } = useTheme();
  const { isConnected: wsConnected } = useWebSocket();
  const { isConnected } = useConnectionStatus();
  const { onlineUsers, updateStatus } = usePresence('realtime-demo');
  const [demoRoomId] = useState('demo-room-1');
  const { participants } = useCollaborationRoom(demoRoomId, 'chat');
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(demoRoomId, 'chat');
  const [message, setMessage] = useState('');
  const [currentStatus, setCurrentStatus] = useState<UserPresence['status']>('online');
  const [showUpdateBadge, setShowUpdateBadge] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Listen for real-time notifications
  useRealtimeNotifications(
    useCallback((notification: any) => {
      setNotificationCount((prev) => prev + 1);
      setShowUpdateBadge(true);
      Alert.alert('Real-time Notification', JSON.stringify(notification, null, 2));
    }, [])
  );

  const handleStatusChange = (status: UserPresence['status']) => {
    setCurrentStatus(status);
    updateStatus(status);
  };

  const handleTyping = () => {
    startTyping();
  };

  const handleStopTyping = () => {
    stopTyping();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, send message through WebSocket
      setMessage('');
      stopTyping();
    }
  };

  const statusOptions: UserPresence['status'][] = ['online', 'away', 'busy', 'offline'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Real-time Collaboration',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isConnected ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              WebSocket Connection
            </Text>
          </View>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          {notificationCount > 0 && (
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Notifications received: {notificationCount}
            </Text>
          )}
        </View>

        {/* Update Badge Demo */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Real-time Update Badge
          </Text>
          <View style={styles.centered}>
            <RealtimeUpdateBadge
              show={showUpdateBadge}
              onPress={() => {
                setShowUpdateBadge(false);
                Alert.alert('Updates loaded!');
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowUpdateBadge(true)}
          >
            <Text style={styles.buttonText}>Simulate Update</Text>
          </TouchableOpacity>
        </View>

        {/* Presence Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Presence Status
          </Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  {
                    backgroundColor:
                      currentStatus === status
                        ? theme.colors.primary + '20'
                        : theme.colors.background,
                    borderColor: currentStatus === status ? theme.colors.primary : '#E5E7EB',
                  },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <PresenceIndicator status={status} showLabel size="medium" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Online Users */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Online Users ({onlineUsers.length})
          </Text>
          {onlineUsers.length > 0 ? (
            <>
              <ActiveUsersIndicator users={onlineUsers} maxDisplay={5} />
              <View style={{ height: 12 }} />
              <OnlineUsersList users={onlineUsers} maxDisplay={10} />
            </>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No other users online
            </Text>
          )}
        </View>

        {/* Room Participants */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Room Participants ({participants.length})
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Room: {demoRoomId}
          </Text>
          {participants.length > 0 ? (
            <OnlineUsersList users={participants} maxDisplay={10} />
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No participants in room
            </Text>
          )}
        </View>

        {/* Typing Indicator Demo */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Typing Indicators
          </Text>
          <View
            style={[styles.chatContainer, { backgroundColor: theme.colors.background }]}
          >
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (text.length > 0) {
                  handleTyping();
                } else {
                  handleStopTyping();
                }
              }}
              onBlur={handleStopTyping}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TypingIndicator typingUsers={typingUsers} />
          {typingUsers.length === 0 && (
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Start typing to broadcast typing indicator
            </Text>
          )}
        </View>

        {/* Mini Typing Indicator */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Mini Typing Indicator
          </Text>
          <MiniTypingIndicator />
        </View>

        {/* Live Editing Indicator */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Live Editing Indicator
          </Text>
          <LiveEditingIndicator userName="John Doe" fieldName="Project Title" />
          <View style={{ height: 8 }} />
          <LiveEditingIndicator userName="Jane Smith" />
        </View>

        {/* Viewing Indicator */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Viewing Indicator
          </Text>
          <ViewingIndicator viewers={onlineUsers.slice(0, 3)} />
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              This screen demonstrates real-time collaboration features using WebSocket.
              Connect to see live updates, typing indicators, and presence information.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  chatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
});
