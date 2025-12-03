/**
 * Push Notifications Test Screen
 * Test and configure push notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import pushNotificationService from '@/services/pushNotification.service';

export default function PushNotificationsTestScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { sendTestNotification, requestPermissions } = usePushNotifications();
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    const hasPerms = await pushNotificationService.hasNotificationPermissions();
    setHasPermission(hasPerms);
    
    const token = await pushNotificationService.getPushToken();
    setPushToken(token);
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
      await checkPermissionStatus();
    } else {
      Alert.alert('Denied', 'Notification permissions denied. Enable from device settings.');
    }
  };

  const handleSendTest = async () => {
    await sendTestNotification();
    Alert.alert('Sent!', 'Test notification has been sent');
  };

  const handleSendWithDelay = async () => {
    // Send notification after 5 seconds
    setTimeout(async () => {
      await pushNotificationService.sendLocalNotification(
        'Delayed Notification',
        'This notification arrived after 5 seconds',
        {
          type: 'test',
          delay: '5s',
        }
      );
    }, 5000);
    
    Alert.alert('Scheduled', 'Notification will arrive in 5 seconds');
  };

  const handleSendHighPriority = async () => {
    await pushNotificationService.sendLocalNotification(
      '🚨 Urgent Task',
      'High priority notification - Task due in 1 hour!',
      {
        type: 'task',
        priority: 'urgent',
        task_id: 123,
      }
    );
    Alert.alert('Sent!', 'High priority notification sent');
  };

  const handleSendLeaveApproval = async () => {
    await pushNotificationService.sendLocalNotification(
      '✅ Leave Approved',
      'Your leave request for Dec 25-26 has been approved',
      {
        type: 'leave_approved',
        leave_id: 456,
      }
    );
    Alert.alert('Sent!', 'Leave approval notification sent');
  };

  const handleSendEventReminder = async () => {
    await pushNotificationService.sendLocalNotification(
      '📅 Event Tomorrow',
      'Annual Meeting starts tomorrow at 10:00 AM',
      {
        type: 'event_reminder',
        event_id: 789,
      }
    );
    Alert.alert('Sent!', 'Event reminder sent');
  };

  const handleClearBadge = async () => {
    await pushNotificationService.clearBadgeCount();
    Alert.alert('Cleared', 'Badge count cleared');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Push Notifications Test',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
          
          <View style={styles.statusRow}>
            <Ionicons 
              name={hasPermission ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={hasPermission ? '#10B981' : '#EF4444'} 
            />
            <Text style={[styles.statusText, { color: theme.text }]}>
              Permissions: {hasPermission ? 'Granted' : 'Not Granted'}
            </Text>
          </View>

          {pushToken && (
            <View style={[styles.tokenBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.tokenLabel, { color: theme.textSecondary }]}>
                Push Token:
              </Text>
              <Text style={[styles.tokenText, { color: theme.text }]} numberOfLines={2}>
                {pushToken}
              </Text>
            </View>
          )}

          {!hasPermission && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleRequestPermissions}
            >
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Request Permissions</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Test Notifications */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Test Notifications</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary + '20' }]}
            onPress={handleSendTest}
          >
            <Ionicons name="send" size={20} color={theme.primary} />
            <Text style={[styles.testButtonText, { color: theme.primary }]}>
              Send Test Notification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#3B82F620' }]}
            onPress={handleSendWithDelay}
          >
            <Ionicons name="time" size={20} color="#3B82F6" />
            <Text style={[styles.testButtonText, { color: '#3B82F6' }]}>
              Send Delayed (5s)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#EF444420' }]}
            onPress={handleSendHighPriority}
          >
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.testButtonText, { color: '#EF4444' }]}>
              High Priority Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#10B98120' }]}
            onPress={handleSendLeaveApproval}
          >
            <Ionicons name="checkmark-done" size={20} color="#10B981" />
            <Text style={[styles.testButtonText, { color: '#10B981' }]}>
              Leave Approval
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#F59E0B20' }]}
            onPress={handleSendEventReminder}
          >
            <Ionicons name="calendar" size={20} color="#F59E0B" />
            <Text style={[styles.testButtonText, { color: '#F59E0B' }]}>
              Event Reminder
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.background }]}
            onPress={handleClearBadge}
          >
            <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>
              Clear Badge Count
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={theme.info} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Push notifications work like YouTube/WhatsApp - they appear even when the app is closed.
              Test them by minimizing the app after sending.
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
