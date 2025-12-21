import { useState } from 'react';
import { Alert } from 'react-native';
import type { Task } from '@/types/project';
import { useRateTask } from '@/hooks/useProjectQueries';

type RatingValue = '1' | '2' | '3' | '4' | '5';

interface UseRatingManagementProps {
    canRateTasks?: boolean;
    onRatingSuccess?: () => void;
}

interface UseRatingManagementReturn {
    // Rating state
    showRating: boolean;
    selectedTaskForRating: Task | null;
    ratingValue: RatingValue;
    ratingFeedback: string;

    // Rating actions
    setShowRating: (show: boolean) => void;
    setSelectedTaskForRating: (task: Task | null) => void;
    setRatingValue: (value: RatingValue) => void;
    setRatingFeedback: (feedback: string) => void;

    openRating: (task: Task) => void;
    handleSubmitRating: () => Promise<void>;

    // Permission
    canRate: boolean;
}

/**
 * Custom hook to manage task rating operations
 * Handles rating modal state and submission
 */
export function useRatingManagement({
    canRateTasks = false,
    onRatingSuccess,
}: UseRatingManagementProps = {}): UseRatingManagementReturn {

    // State
    const [showRating, setShowRating] = useState(false);
    const [selectedTaskForRating, setSelectedTaskForRating] = useState<Task | null>(null);
    const [ratingValue, setRatingValue] = useState<RatingValue>('5');
    const [ratingFeedback, setRatingFeedback] = useState('');

    // Mutation
    const rateTaskMutation = useRateTask();

    // Open rating modal
    const openRating = (task: Task) => {
        if (!canRateTasks) {
            Alert.alert(
                'Permission Denied',
                'You do not have permission to rate tasks. Only team leads can rate their team members\' tasks.'
            );
            return;
        }

        setSelectedTaskForRating(task);
        setRatingValue('5');
        setRatingFeedback('');
        setShowRating(true);
    };

    // Submit rating
    const handleSubmitRating = async () => {
        if (!selectedTaskForRating) return;

        try {
            await rateTaskMutation.mutateAsync({
                task_id: selectedTaskForRating.id,
                rating: ratingValue,
                feedback: ratingFeedback,
            });

            setShowRating(false);
            setSelectedTaskForRating(null);
            setRatingValue('5');
            setRatingFeedback('');

            Alert.alert('Success', 'Task rated successfully!');

            // Call success callback if provided
            if (onRatingSuccess) {
                onRatingSuccess();
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || 'Failed to rate task';
            Alert.alert('Error', errorMessage);
            console.error('Rating error:', error);
        }
    };

    return {
        // Rating state
        showRating,
        selectedTaskForRating,
        ratingValue,
        ratingFeedback,

        // Rating actions
        setShowRating,
        setSelectedTaskForRating,
        setRatingValue,
        setRatingFeedback,

        openRating,
        handleSubmitRating,

        // Permission
        canRate: canRateTasks,
    };
}
