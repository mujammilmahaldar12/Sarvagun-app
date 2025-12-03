/**
 * Notification Preferences Screen
 * Allows users to customize their notification settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable, Card, Button, GlassCard } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationQueries';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PreferenceSection {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  preferences: PreferenceItem[];
}

interface PreferenceItem {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const { data: preferences, isLoading } = useNotificationPreferences();
  const { mutate: updatePreferences, isPending: isSaving } = useUpdateNotificationPreferences();

  const [localPrefs, setLocalPrefs] = useState(preferences || {});

  React.useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: string, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePreferences(localPrefs);
  };

  const sections: PreferenceSection[] = [
    {
      title: 'Tasks & Projects',
      icon: 'checkmark-circle',
      color: '#8B5CF6',
      preferences: [
        {
          key: 'notify_task_assigned',
          label: 'Task Assigned',
          description: 'When a new task is assigned to you',
          value: localPrefs.notify_task_assigned || false,
        },
        {
          key: 'notify_task_due_tomorrow',
          label: 'Task Due Tomorrow',
          description: 'Reminder 24 hours before task deadline',
          value: localPrefs.notify_task_due_tomorrow || false,
        },
        {
          key: 'notify_task_overdue',
          label: 'Task Overdue',
          description: 'When a task passes its deadline',
          value: localPrefs.notify_task_overdue || false,
        },
        {
          key: 'notify_task_completed',
          label: 'Task Completed',
          description: 'When someone completes your assigned task',
          value: localPrefs.notify_task_completed || false,
        },
        {
          key: 'notify_project_updates',
          label: 'Project Updates',
          description: 'Updates on projects you are part of',
          value: localPrefs.notify_project_updates || false,
        },
      ],
    },
    {
      title: 'Events',
      icon: 'calendar',
      color: '#3B82F6',
      preferences: [
        {
          key: 'notify_event_created',
          label: 'New Events',
          description: 'When a new event is created',
          value: localPrefs.notify_event_created || false,
        },
        {
          key: 'notify_event_updates',
          label: 'Event Updates',
          description: 'Changes to events you are involved in',
          value: localPrefs.notify_event_updates || false,
        },
        {
          key: 'notify_event_reminder',
          label: 'Event Reminders',
          description: 'Reminder before event starts',
          value: localPrefs.notify_event_reminder || false,
        },
      ],
    },
    {
      title: 'Leave & HR',
      icon: 'time',
      color: '#A855F7',
      preferences: [
        {
          key: 'notify_leave_approved',
          label: 'Leave Approved',
          description: 'When your leave request is approved',
          value: localPrefs.notify_leave_approved || false,
        },
        {
          key: 'notify_leave_rejected',
          label: 'Leave Rejected',
          description: 'When your leave request is rejected',
          value: localPrefs.notify_leave_rejected || false,
        },
        {
          key: 'notify_leave_request',
          label: 'Leave Requests (Managers)',
          description: 'When team members request leave',
          value: localPrefs.notify_leave_request || false,
        },
        {
          key: 'notify_attendance_alert',
          label: 'Attendance Alerts',
          description: 'Reminders for clock in/out',
          value: localPrefs.notify_attendance_alert || false,
        },
      ],
    },
    {
      title: 'Team & Collaboration',
      icon: 'people',
      color: '#10B981',
      preferences: [
        {
          key: 'notify_team_task_updates',
          label: 'Team Task Updates',
          description: 'Updates on tasks in your team',
          value: localPrefs.notify_team_task_updates || false,
        },
        {
          key: 'notify_mentions',
          label: 'Mentions',
          description: 'When someone @mentions you',
          value: localPrefs.notify_mentions || false,
        },
        {
          key: 'notify_comments',
          label: 'Comments',
          description: 'Comments on your tasks or projects',
          value: localPrefs.notify_comments || false,
        },
      ],
    },
    {
      title: 'Performance & Recognition',
      icon: 'trophy',
      color: '#F59E0B',
      preferences: [
        {
          key: 'notify_rating_requests',
          label: 'Rating Requests',
          description: 'When asked to rate completed tasks',
          value: localPrefs.notify_rating_requests || false,
        },
        {
          key: 'notify_task_rated',
          label: 'Task Rated',
          description: 'When your work is rated',
          value: localPrefs.notify_task_rated || false,
        },
        {
          key: 'notify_achievements',
          label: 'Achievements',
          description: 'When you unlock achievements or badges',
          value: localPrefs.notify_achievements || false,
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <AnimatedPressable onPress={() => router.back()} hapticType="light">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notification Preferences
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose what notifications you want to receive
        </Text>

        {sections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(sectionIndex * 100).duration(400)}
          >
            <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.lg }}>
              {/* Section Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <View style={[styles.sectionIcon, { backgroundColor: section.color + '15' }]}>
                  <Ionicons name={section.icon} size={20} color={section.color} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {section.title}
                </Text>
              </View>

              {/* Preferences */}
              {section.preferences.map((pref, index) => (
                <View
                  key={pref.key}
                  style={[
                    styles.preferenceItem,
                    {
                      borderBottomWidth: index < section.preferences.length - 1 ? 1 : 0,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={[styles.prefLabel, { color: theme.text }]}>
                      {pref.label}
                    </Text>
                    <Text style={[styles.prefDescription, { color: theme.textSecondary }]}>
                      {pref.description}
                    </Text>
                  </View>
                  <Switch
                    value={pref.value}
                    onValueChange={(value) => handleToggle(pref.key, value)}
                    trackColor={{ false: theme.border, true: theme.primary + '60' }}
                    thumbColor={pref.value ? theme.primary : theme.textSecondary}
                  />
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        ))}

        {/* Save Button */}
        <Button
          title={isSaving ? 'Saving...' : 'Save Preferences'}
          onPress={handleSave}
          disabled={isSaving}
          size="lg"
          variant="primary"
          style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...getTypographyStyle('lg', 'semibold'),
  },
  scrollContent: {
    padding: spacing.lg,
  },
  subtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...getTypographyStyle('base', 'semibold'),
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  prefLabel: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: 4,
  },
  prefDescription: {
    ...getTypographyStyle('xs', 'regular'),
    lineHeight: 16,
  },
});
