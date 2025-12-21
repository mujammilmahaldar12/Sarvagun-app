/**
 * Goals & OKRs Management Screen
 * Create, track, and manage personal and professional goals
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
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { AnimatedPressable, GlassCard, Button, Badge, BottomSheet } from '@/components';
import { spacing, borderRadius } from '@/constants/designSystem';
import { getTypographyStyle } from '@/utils/styleHelpers';
import { useUserGoals } from '@/hooks/useHRQueries';

type GoalCategory = 'personal' | 'quarterly' | 'annual' | 'team';
type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  startDate: string;
  targetDate: string;
  milestones: Milestone[];
  tags: string[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export default function GoalsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals from API
  const { data: apiGoals = [], isLoading, refetch } = useUserGoals(user?.id!);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Mock goals data (replace with API data)
  const mockGoals: Goal[] = [
    {
      id: '1',
      title: 'Complete React Native Certification',
      description: 'Finish the React Native advanced course and get certified',
      category: 'personal',
      status: 'in-progress',
      progress: 65,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      milestones: [
        { id: 'm1', title: 'Complete modules 1-5', completed: true, dueDate: '2024-03-31' },
        { id: 'm2', title: 'Build 3 projects', completed: true, dueDate: '2024-06-30' },
        { id: 'm3', title: 'Pass final exam', completed: false, dueDate: '2024-12-31' },
      ],
      tags: ['learning', 'mobile-dev'],
    },
    {
      id: '2',
      title: 'Q1 Revenue Target - $500K',
      description: 'Achieve first quarter revenue target through client projects',
      category: 'quarterly',
      status: 'in-progress',
      progress: 78,
      startDate: '2024-01-01',
      targetDate: '2024-03-31',
      milestones: [
        { id: 'm4', title: 'Close 5 enterprise deals', completed: true, dueDate: '2024-02-15' },
        { id: 'm5', title: 'Deliver 3 major projects', completed: true, dueDate: '2024-03-15' },
        { id: 'm6', title: 'Achieve $500K revenue', completed: false, dueDate: '2024-03-31' },
      ],
      tags: ['revenue', 'sales'],
    },
    {
      id: '3',
      title: 'Annual Innovation Target',
      description: 'Launch 2 new products and improve 5 existing features',
      category: 'annual',
      status: 'in-progress',
      progress: 42,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      milestones: [
        { id: 'm7', title: 'Product 1 Launch', completed: true, dueDate: '2024-06-30' },
        { id: 'm8', title: 'Feature improvements', completed: false, dueDate: '2024-09-30' },
        { id: 'm9', title: 'Product 2 Launch', completed: false, dueDate: '2024-12-31' },
      ],
      tags: ['innovation', 'product'],
    },
    {
      id: '4',
      title: 'Team Skill Development',
      description: 'Train team on new technologies and improve overall expertise',
      category: 'team',
      status: 'in-progress',
      progress: 55,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      milestones: [
        { id: 'm10', title: 'Conduct 12 workshops', completed: false, dueDate: '2024-12-31' },
        { id: 'm11', title: 'Team certifications', completed: false, dueDate: '2024-12-31' },
      ],
      tags: ['team', 'training'],
    },
  ];

  const goals = apiGoals.length > 0 ? apiGoals : mockGoals;

  const filteredGoals = selectedCategory === 'all'
    ? goals
    : goals.filter(g => g.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Goals', icon: 'list', color: theme.primary },
    { value: 'personal', label: 'Personal', icon: 'person', color: '#10B981' },
    { value: 'quarterly', label: 'Quarterly', icon: 'calendar', color: '#6366F1' },
    { value: 'annual', label: 'Annual', icon: 'calendar-number', color: '#8B5CF6' },
    { value: 'team', label: 'Team', icon: 'people', color: '#F59E0B' },
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
              🎯 Goals & OKRs
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Track your objectives and key results
            </Text>
          </View>
          <AnimatedPressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            hapticType="medium"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </AnimatedPressable>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              onPress={() => setSelectedCategory(category.value as any)}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: selectedCategory === category.value ? category.color : 'transparent',
                  borderColor: selectedCategory === category.value ? category.color : theme.border,
                },
              ]}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.value ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === category.value ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <GlassCard variant="default" intensity="light" style={{ flex: 1, marginRight: spacing.sm }}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.text }]}>{goals.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Goals</Text>
            </View>
          </GlassCard>
          <GlassCard variant="default" intensity="light" style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {goals.filter(g => g.status === 'completed').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
            </View>
          </GlassCard>
        </View>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Goals Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Start by creating your first goal
            </Text>
            <Button
              title="Create Goal"
              onPress={() => setShowCreateModal(true)}
              variant="primary"
              size="md"
              style={{ marginTop: spacing.md }}
            />
          </Animated.View>
        ) : (
          filteredGoals.map((goal, index) => (
            <Animated.View
              key={goal.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <AnimatedPressable
                onPress={() => setSelectedGoal(goal)}
                hapticType="light"
              >
                <GlassCard variant="default" intensity="medium" style={{ marginBottom: spacing.md }}>
                  {/* Goal Header */}
                  <View style={styles.goalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalTitle, { color: theme.text }]}>
                        {goal.title}
                      </Text>
                      <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                        {goal.description}
                      </Text>
                    </View>
                    <Badge
                      label={getStatusLabel(goal.status)}
                      color={getStatusColor(goal.status)}
                      variant="filled"
                    />
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                        Progress
                      </Text>
                      <Text style={[styles.progressValue, { color: theme.text }]}>
                        {goal.progress}%
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${goal.progress}%`,
                            backgroundColor: getStatusColor(goal.status)
                          }
                        ]}
                      />
                    </View>
                  </View>

                  {/* Milestones */}
                  <View style={styles.milestonesSection}>
                    <Text style={[styles.milestonesTitle, { color: theme.textSecondary }]}>
                      Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
                    </Text>
                    {goal.milestones.map((milestone) => (
                      <View key={milestone.id} style={styles.milestoneItem}>
                        <Ionicons
                          name={milestone.completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={milestone.completed ? '#10B981' : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.milestoneText,
                            {
                              color: milestone.completed ? theme.textSecondary : theme.text,
                              textDecorationLine: milestone.completed ? 'line-through' : 'none'
                            }
                          ]}
                        >
                          {milestone.title}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer */}
                  <View style={styles.goalFooter}>
                    <View style={styles.tags}>
                      {goal.tags.map((tag) => (
                        <View
                          key={tag}
                          style={[styles.tag, { backgroundColor: theme.primary + '15' }]}
                        >
                          <Text style={[styles.tagText, { color: theme.primary }]}>
                            #{tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
                      Due: {new Date(goal.targetDate).toLocaleDateString()}
                    </Text>
                  </View>
                </GlassCard>
              </AnimatedPressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Goal Bottom Sheet */}
      <BottomSheet
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        height={600}
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Goal</Text>
          <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
            Define your objective and key results
          </Text>

          <TextInput
            placeholder="Goal title"
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

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={() => setShowCreateModal(false)}
              variant="outline"
              size="lg"
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Create Goal"
              onPress={() => {
                // Handle create
                setShowCreateModal(false);
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
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...getTypographyStyle('xl', 'bold'),
  },
  headerSubtitle: {
    ...getTypographyStyle('sm', 'regular'),
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...getTypographyStyle('2xl', 'bold'),
    marginBottom: 4,
  },
  statLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    ...getTypographyStyle('xl', 'bold'),
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...getTypographyStyle('sm', 'regular'),
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  goalTitle: {
    ...getTypographyStyle('base', 'bold'),
    marginBottom: 4,
  },
  goalDescription: {
    ...getTypographyStyle('sm', 'regular'),
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...getTypographyStyle('xs', 'medium'),
  },
  progressValue: {
    ...getTypographyStyle('xs', 'bold'),
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestonesSection: {
    marginBottom: spacing.md,
  },
  milestonesTitle: {
    ...getTypographyStyle('xs', 'semibold'),
    marginBottom: spacing.xs,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  milestoneText: {
    ...getTypographyStyle('sm', 'regular'),
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...getTypographyStyle('xs', 'medium'),
  },
  dueDate: {
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
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
});
