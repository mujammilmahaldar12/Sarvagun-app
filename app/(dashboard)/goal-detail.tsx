/**
 * Goal Detail Screen
 * View and edit individual goal details with milestone management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable, GlassCard, Button, Badge, BottomSheet } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';

type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
  completedDate?: string;
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'milestone_completed' | 'comment';
  description: string;
  timestamp: string;
  user: string;
}

export default function GoalDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const goalId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [title, setTitle] = useState('Complete React Native Certification');
  const [description, setDescription] = useState('Finish the React Native advanced course and get certified');
  const [status, setStatus] = useState<GoalStatus>('in-progress');
  const [progress, setProgress] = useState(65);

  // Mock data - replace with API call
  const milestones: Milestone[] = [
    {
      id: 'm1',
      title: 'Complete modules 1-5',
      description: 'Finish all core modules covering basics to advanced topics',
      completed: true,
      dueDate: '2024-03-31',
      completedDate: '2024-03-28',
    },
    {
      id: 'm2',
      title: 'Build 3 projects',
      description: 'Create portfolio projects showcasing learned skills',
      completed: true,
      dueDate: '2024-06-30',
      completedDate: '2024-06-25',
    },
    {
      id: 'm3',
      title: 'Pass final exam',
      description: 'Score 90% or higher on certification exam',
      completed: false,
      dueDate: '2024-12-31',
    },
  ];

  const activities: Activity[] = [
    {
      id: 'a1',
      type: 'milestone_completed',
      description: 'Completed milestone: Build 3 projects',
      timestamp: '2024-06-25T10:30:00',
      user: 'You',
    },
    {
      id: 'a2',
      type: 'updated',
      description: 'Updated progress to 65%',
      timestamp: '2024-06-20T14:15:00',
      user: 'You',
    },
    {
      id: 'a3',
      type: 'milestone_completed',
      description: 'Completed milestone: Complete modules 1-5',
      timestamp: '2024-03-28T09:45:00',
      user: 'You',
    },
    {
      id: 'a4',
      type: 'created',
      description: 'Created goal',
      timestamp: '2024-01-01T08:00:00',
      user: 'You',
    },
  ];

  const getStatusColor = (status: GoalStatus) => {
    const colors: Record<GoalStatus, string> = {
      'not-started': '#6B7280',
      'in-progress': '#3B82F6',
      'completed': '#10B981',
      'blocked': '#EF4444',
    };
    return colors[status];
  };

  const getStatusLabel = (status: GoalStatus) => {
    const labels: Record<GoalStatus, string> = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'blocked': 'Blocked',
    };
    return labels[status];
  };

  const getActivityIcon = (type: Activity['type']) => {
    const icons: Record<Activity['type'], string> = {
      created: 'add-circle',
      updated: 'create',
      milestone_completed: 'checkmark-circle',
      comment: 'chatbubble',
    };
    return icons[type];
  };

  const handleToggleMilestone = (milestoneId: string) => {
    Alert.alert(
      'Toggle Milestone',
      'Mark this milestone as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => {
            // Handle milestone toggle
            console.log('Toggle milestone:', milestoneId);
          }
        },
      ]
    );
  };

  const handleSave = () => {
    // Handle save goal
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            router.back();
          }
        },
      ]
    );
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
              Goal Details
            </Text>
            <Badge
              label={getStatusLabel(status)}
              color={getStatusColor(status)}
              variant="solid"
            />
          </View>
          <AnimatedPressable
            onPress={() => setIsEditing(!isEditing)}
            hapticType="light"
            style={{ marginRight: spacing.sm }}
          >
            <Ionicons name={isEditing ? 'close' : 'create'} size={22} color={theme.text} />
          </AnimatedPressable>
          <AnimatedPressable onPress={handleDelete} hapticType="medium">
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </AnimatedPressable>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Info */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.md }}>
          {isEditing ? (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              />
            </>
          ) : (
            <>
              <Text style={[styles.goalTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                {description}
              </Text>
            </>
          )}

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Overall Progress
              </Text>
              <Text style={[styles.progressValue, { color: theme.text }]}>
                {progress}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`, 
                    backgroundColor: getStatusColor(status) 
                  }
                ]} 
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.editButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsEditing(false)}
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save Changes"
                onPress={handleSave}
                variant="primary"
                size="md"
                style={{ flex: 1, marginLeft: spacing.sm }}
              />
            </View>
          )}
        </GlassCard>

        {/* Milestones */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.md }}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                🎯 Milestones
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                {milestones.filter(m => m.completed).length} of {milestones.length} completed
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => setShowAddMilestone(true)}
              style={[styles.iconButton, { backgroundColor: theme.primary + '15' }]}
              hapticType="light"
            >
              <Ionicons name="add" size={20} color={theme.primary} />
            </AnimatedPressable>
          </View>

          {milestones.map((milestone, index) => (
            <Animated.View
              key={milestone.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <AnimatedPressable
                onPress={() => handleToggleMilestone(milestone.id)}
                style={[
                  styles.milestoneCard,
                  { 
                    backgroundColor: milestone.completed ? theme.primary + '08' : 'transparent',
                    borderColor: milestone.completed ? theme.primary + '30' : theme.border,
                  }
                ]}
                hapticType="light"
              >
                <Ionicons 
                  name={milestone.completed ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={24} 
                  color={milestone.completed ? '#10B981' : theme.textSecondary} 
                />
                <View style={{ flex: 1 }}>
                  <Text 
                    style={[
                      styles.milestoneTitle, 
                      { 
                        color: milestone.completed ? theme.textSecondary : theme.text,
                        textDecorationLine: milestone.completed ? 'line-through' : 'none',
                      }
                    ]}
                  >
                    {milestone.title}
                  </Text>
                  <Text style={[styles.milestoneDescription, { color: theme.textSecondary }]}>
                    {milestone.description}
                  </Text>
                  <View style={styles.milestoneFooter}>
                    <Text style={[styles.milestoneDate, { color: theme.textSecondary }]}>
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </Text>
                    {milestone.completedDate && (
                      <Text style={[styles.milestoneDate, { color: '#10B981' }]}>
                        ✓ Completed {new Date(milestone.completedDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>
          ))}
        </GlassCard>

        {/* Activity Timeline */}
        <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.md }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📋 Activity Timeline
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, marginBottom: spacing.md }]}>
            Recent updates and changes
          </Text>

          {activities.map((activity, index) => (
            <Animated.View
              key={activity.id}
              entering={FadeInUp.delay(index * 50).duration(300)}
              style={styles.activityItem}
            >
              <View 
                style={[
                  styles.activityIcon, 
                  { backgroundColor: theme.primary + '15' }
                ]}
              >
                <Ionicons 
                  name={getActivityIcon(activity.type) as any} 
                  size={16} 
                  color={theme.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityDescription, { color: theme.text }]}>
                  {activity.description}
                </Text>
                <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                  {new Date(activity.timestamp).toLocaleString()} • {activity.user}
                </Text>
              </View>
            </Animated.View>
          ))}
        </GlassCard>
      </ScrollView>

      {/* Add Milestone Bottom Sheet */}
      <BottomSheet
        visible={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        height={500}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Add Milestone</Text>
          <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            Break down your goal into achievable steps
          </Text>
          
          <TextInput
            placeholder="Milestone title"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          />
          
          <TextInput
            placeholder="Description"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          />

          <TextInput
            placeholder="Due date (YYYY-MM-DD)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          />

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={() => setShowAddMilestone(false)}
              variant="outline"
              size="lg"
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Add Milestone"
              onPress={() => {
                // Handle add milestone
                setShowAddMilestone(false);
              }}
              variant="primary"
              size="lg"
              style={{ flex: 1, marginLeft: spacing.sm }}
            />
          </View>
        </View>
      </BottomSheet>
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
    ...getTypographyStyle('lg', 'bold'),
    marginBottom: 4,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  label: {
    ...getTypographyStyle('xs', 'semibold'),
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    ...getTypographyStyle('base', 'regular'),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  goalTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.xs,
  },
  goalDescription: {
    ...getTypographyStyle('base', 'regular'),
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    ...getTypographyStyle('sm', 'medium'),
  },
  progressValue: {
    ...getTypographyStyle('sm', 'bold'),
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...getTypographyStyle('lg', 'bold'),
  },
  sectionSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  milestoneTitle: {
    ...getTypographyStyle('base', 'semibold'),
    marginBottom: 4,
  },
  milestoneDescription: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  milestoneDate: {
    ...getTypographyStyle('xs', 'regular'),
  },
  activityItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDescription: {
    ...getTypographyStyle('sm', 'medium'),
    marginBottom: 2,
  },
  activityTime: {
    ...getTypographyStyle('xs', 'regular'),
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});
