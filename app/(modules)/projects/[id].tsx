import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { getShadowStyle } from '@/utils/styleHelpers';
import { Badge, Button } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useTask, useTaskRatings, useRateTask, useUpdateTask, useCompleteTask } from '@/hooks/useProjectQueries';
import type { Task, TaskRating } from '@/types/project';

const { spacing, borderRadius, typography } = designSystem;

export default function TaskDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const taskId = parseInt(id as string);

  const [ratingValue, setRatingValue] = useState<'1' | '2' | '3' | '4' | '5'>('5');
  const [feedback, setFeedback] = useState('');
  const [isRating, setIsRating] = useState(false);

  // Fetch data
  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const { data: ratings = [], refetch: refetchRatings } = useTaskRatings(taskId, !!task);
  
  // Mutations
  const rateTaskMutation = useRateTask();
  const updateTaskMutation = useUpdateTask();
  const completeTaskMutation = useCompleteTask();

  const handleSubmitRating = async () => {
    if (!feedback.trim()) {
      Alert.alert('Validation', 'Please provide feedback');
      return;
    }

    try {
      await rateTaskMutation.mutateAsync({
        task_id: taskId,
        rating: ratingValue,
        feedback: feedback.trim(),
      });

      Alert.alert('Success', 'Rating submitted successfully');
      setIsRating(false);
      setFeedback('');
      refetchRatings();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit rating');
    }
  };

  const handleCompleteTask = () => {
    Alert.alert(
      'Complete Task',
      'Mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeTaskMutation.mutateAsync(taskId);
              Alert.alert('Success', 'Task marked as completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete task');
            }
          },
        },
      ]
    );
  };

  const handleToggleStar = async () => {
    if (!task) return;
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        data: { starred: !task.starred },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const renderStarRating = (value: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= value ? 'star' : 'star-outline'}
            size={16}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const renderRatingSelector = () => {
    return (
      <View style={{ flexDirection: 'row', gap: spacing[2], justifyContent: 'center', marginVertical: spacing[3] }}>
        {(['1', '2', '3', '4', '5'] as const).map((star) => (
          <Button
            key={star}
            title=""
            onPress={() => setRatingValue(star)}
            variant={ratingValue === star ? 'primary' : 'outline'}
            size="sm"
            iconName={parseInt(star) <= parseInt(ratingValue) ? 'star' : 'star-outline'}
          />
        ))}
      </View>
    );
  };

  if (taskLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: spacing[2] }}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: spacing[2] }}>Task not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" size="sm" style={{ marginTop: spacing[4] }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Button iconName="arrow-back" onPress={() => router.back()} variant="ghost" size="sm" />
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: designSystem.typography.weights.bold,
              color: theme.text,
              flex: 1,
              marginLeft: spacing[2],
            }}
            numberOfLines={1}
          >
            Task Details
          </Text>
        </View>
        <Button
          iconName={task.starred ? 'star' : 'star-outline'}
          onPress={handleToggleStar}
          variant="ghost"
          size="sm"
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8] }}>
        {/* Task Info Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            marginBottom: spacing[4],
            borderWidth: 1,
            borderColor: theme.border,
            ...getShadowStyle('md'),
          }}
        >
          <Text
            style={{
              fontSize: typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              color: theme.text,
              marginBottom: spacing[3],
            }}
          >
            {task.task_title}
          </Text>

          <View style={{ gap: spacing[2], marginBottom: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Ionicons name="briefcase-outline" size={16} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>
                {task.project_name} › {task.section_name}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>
                {task.user_name} ({task.user_designation})
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>
                Due: {new Date(task.due_date).toLocaleDateString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
            <Badge label={task.status} status={task.status} size="sm" />
            {task.priority_level && <Badge label={task.priority_level} status="In Progress" size="sm" />}
            {task.average_rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {renderStarRating(Math.round(task.average_rating))}
                <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.xs }}>
                  ({task.average_rating.toFixed(1)})
                </Text>
              </View>
            )}
          </View>

          {task.comments && (
            <View style={{ marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: theme.border }}>
              <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>{task.comments}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {task.status === 'In Progress' && (
          <Button
            title="Mark as Completed"
            iconName="checkmark-circle-outline"
            onPress={handleCompleteTask}
            variant="primary"
            size="md"
            style={{ marginBottom: spacing[4] }}
          />
        )}

        {/* Rating Section */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            marginBottom: spacing[4],
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: designSystem.typography.weights.bold,
              color: theme.text,
              marginBottom: spacing[3],
            }}
          >
            Ratings & Feedback
          </Text>

          {task.user_rating && (
            <View
              style={{
                backgroundColor: `${theme.primary}10`,
                padding: spacing[3],
                borderRadius: borderRadius.md,
                marginBottom: spacing[3],
              }}
            >
              <Text style={{ color: theme.text, fontSize: typography.sizes.sm, fontWeight: '600', marginBottom: spacing[1] }}>
                Your Rating
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
                {renderStarRating(parseInt(task.user_rating.rating))}
              </View>
              {task.user_rating.feedback && (
                <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>{task.user_rating.feedback}</Text>
              )}
            </View>
          )}

          {!isRating && !task.user_rating && (
            <Button title="Add Rating" iconName="star-outline" onPress={() => setIsRating(true)} variant="outline" size="sm" />
          )}

          {isRating && (
            <View style={{ gap: spacing[3] }}>
              <Text style={{ color: theme.text, fontSize: typography.sizes.sm, fontWeight: '600' }}>Select Rating</Text>
              {renderRatingSelector()}

              <Text style={{ color: theme.text, fontSize: typography.sizes.sm, fontWeight: '600' }}>Feedback</Text>
              <TextInput
                placeholder="Enter your feedback..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: borderRadius.md,
                  padding: spacing[3],
                  fontSize: typography.sizes.sm,
                  color: theme.text,
                  backgroundColor: theme.background,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={theme.textSecondary}
              />

              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <Button title="Submit" onPress={handleSubmitRating} variant="primary" size="sm" style={{ flex: 1 }} />
                <Button title="Cancel" onPress={() => {setIsRating(false); setFeedback('');}} variant="outline" size="sm" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {/* All Ratings List */}
          {ratings.length > 0 && (
            <View style={{ marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: theme.border }}>
              <Text style={{ color: theme.text, fontSize: typography.sizes.base, fontWeight: '600', marginBottom: spacing[2] }}>
                All Ratings ({ratings.length})
              </Text>
              {ratings.map((rating: TaskRating) => (
                <View
                  key={rating.id}
                  style={{
                    backgroundColor: theme.background,
                    padding: spacing[3],
                    borderRadius: borderRadius.md,
                    marginBottom: spacing[2],
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[2] }}>
                    <View>
                      <Text style={{ color: theme.text, fontSize: typography.sizes.sm, fontWeight: '600' }}>
                        {rating.rating_from_name}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.xs }}>
                        {rating.rating_from_designation} · {rating.rating_from_category}
                      </Text>
                    </View>
                    {renderStarRating(parseInt(rating.rating))}
                  </View>
                  {rating.feedback && (
                    <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.sm }}>{rating.feedback}</Text>
                  )}
                  <Text style={{ color: theme.textSecondary, fontSize: typography.sizes.xs, marginTop: spacing[1] }}>
                    {new Date(rating.created_at).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


