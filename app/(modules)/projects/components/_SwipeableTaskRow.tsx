/**
 * SwipeableTaskRow Component
 * Wraps TaskRowDense with swipe gesture support
 * Swipe Right → Complete task (green)
 * Swipe Left → Delete task (red)
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Alert } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import { TaskRowDense } from './_TaskRowDense';
import type { Task } from '@/types/project';

const { spacing, typography } = designSystem;

interface SwipeableTaskRowProps {
    task: Task;
    onComplete: (taskId: number) => void;
    onUncomplete: (taskId: number) => void;
    onDelete: (taskId: number) => void;
    onPress: (task: Task) => void;
    onLongPress?: (task: Task) => void;
}

/**
 * Swipeable task row with gesture-based actions
 */
export const SwipeableTaskRow: React.FC<SwipeableTaskRowProps> = ({
    task,
    onComplete,
    onUncomplete,
    onDelete,
    onPress,
    onLongPress,
}) => {
    const { theme } = useTheme();
    const swipeableRef = useRef<Swipeable>(null);
    const isCompleted = task.status === 'Completed';

    // Close swipeable after action
    const closeSwipeable = useCallback(() => {
        swipeableRef.current?.close();
    }, []);

    // Handle toggle complete
    const handleToggleComplete = useCallback((taskId: number, currentStatus: string) => {
        closeSwipeable();
        if (currentStatus === 'Completed') {
            onUncomplete(taskId);
        } else {
            onComplete(taskId);
        }
    }, [onComplete, onUncomplete, closeSwipeable]);

    // Handle swipe complete action
    const handleSwipeComplete = useCallback(() => {
        closeSwipeable();
        if (!isCompleted) {
            onComplete(task.id);
        } else {
            onUncomplete(task.id);
        }
    }, [task.id, isCompleted, onComplete, onUncomplete, closeSwipeable]);

    // Handle swipe delete action
    const handleSwipeDelete = useCallback(() => {
        closeSwipeable();
        onDelete(task.id);
    }, [task.id, onDelete, closeSwipeable]);

    // Render right action (Delete - red)
    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });

        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View
                style={[
                    styles.rightActionContainer,
                    { transform: [{ translateX }] }
                ]}
            >
                <RectButton
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleSwipeDelete}
                >
                    <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
                        <Ionicons name="trash-outline" size={22} color="#fff" />
                        <Text style={styles.actionText}>Delete</Text>
                    </Animated.View>
                </RectButton>
            </Animated.View>
        );
    };

    // Render left action (Complete/Undo - green)
    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [-80, 0],
            extrapolate: 'clamp',
        });

        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View
                style={[
                    styles.leftActionContainer,
                    { transform: [{ translateX }] }
                ]}
            >
                <RectButton
                    style={[
                        styles.actionButton,
                        isCompleted ? styles.undoButton : styles.completeButton
                    ]}
                    onPress={handleSwipeComplete}
                >
                    <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
                        <Ionicons
                            name={isCompleted ? "arrow-undo" : "checkmark-circle"}
                            size={22}
                            color="#fff"
                        />
                        <Text style={styles.actionText}>
                            {isCompleted ? 'Undo' : 'Done'}
                        </Text>
                    </Animated.View>
                </RectButton>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            friction={2}
            leftThreshold={40}
            rightThreshold={40}
            overshootLeft={false}
            overshootRight={false}
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}
            containerStyle={[
                styles.swipeableContainer,
                { backgroundColor: theme.background }
            ]}
        >
            <TaskRowDense
                task={task}
                onToggleComplete={handleToggleComplete}
                onPress={onPress}
                onLongPress={onLongPress}
            />
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    swipeableContainer: {
        marginBottom: 1,
    },
    rightActionContainer: {
        width: 80,
        flexDirection: 'row',
    },
    leftActionContainer: {
        width: 80,
        flexDirection: 'row',
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    completeButton: {
        backgroundColor: '#10B981',
    },
    undoButton: {
        backgroundColor: '#F59E0B',
    },
    actionText: {
        color: '#fff',
        fontSize: typography.sizes.xs,
        fontWeight: '600',
        marginTop: 2,
    },
});

export default SwipeableTaskRow;
