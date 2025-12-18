/**
 * TaskRowDense Component
 * Two-line dense task row for the redesigned Task Tracker
 * Shows: Priority color bar | Checkbox | Title (line 1) | Date • Priority • Section (line 2)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RectButton, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import type { Task } from '@/types/project';
import {
    formatDueDate,
    getUrgencyColor,
    getPriorityColor,
    getPriorityLabel
} from '@/utils/taskGrouping';

const { spacing, typography, borderRadius } = designSystem;

interface TaskRowDenseProps {
    task: Task;
    onToggleComplete: (taskId: number, currentStatus: string) => void;
    onPress: (task: Task) => void;
    onLongPress?: (task: Task) => void;
}

/**
 * Dense two-line task row component
 * Optimized for displaying many tasks with essential info visible
 */
export const TaskRowDense = memo(({
    task,
    onToggleComplete,
    onPress,
    onLongPress
}: TaskRowDenseProps) => {
    const { theme } = useTheme();
    const isCompleted = task.status === 'Completed';
    const urgencyColor = getUrgencyColor(task.due_date, isCompleted);
    const priorityColor = getPriorityColor(task.priority_level);
    const priorityLabel = getPriorityLabel(task.priority_level);
    const formattedDate = formatDueDate(task.due_date);

    return (
        <RectButton
            onPress={() => onPress(task)}
            style={[
                styles.container,
                {
                    backgroundColor: isCompleted ? theme.surface + '80' : theme.surface,
                    borderLeftColor: urgencyColor,
                }
            ]}
        >
            {/* Priority/Urgency Color Bar - Left side */}
            <View style={[styles.colorBar, { backgroundColor: urgencyColor }]} />

            {/* Checkbox */}
            <GHTouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => onToggleComplete(task.id, task.status)}
            >
                <View style={[
                    styles.checkbox,
                    {
                        borderColor: isCompleted ? theme.success : theme.border,
                        backgroundColor: isCompleted ? theme.success : 'transparent',
                    }
                ]}>
                    {isCompleted && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                </View>
            </GHTouchableOpacity>

            {/* Task Content */}
            <View style={styles.content}>
                {/* Line 1: Task Title */}
                <Text
                    style={[
                        styles.title,
                        {
                            color: isCompleted ? theme.textSecondary : theme.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.7 : 1,
                        }
                    ]}
                    numberOfLines={1}
                >
                    {task.task_title}
                </Text>

                {/* Line 2: Metadata */}
                <View style={styles.metadataRow}>
                    {/* Due Date */}
                    <Text style={[
                        styles.metadataText,
                        { color: urgencyColor }
                    ]}>
                        {formattedDate}
                    </Text>

                    <Text style={[styles.separator, { color: theme.textTertiary }]}>•</Text>

                    {/* Priority */}
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                        <Text style={[styles.priorityText, { color: priorityColor }]}>
                            {task.priority_level || 'P3'} {priorityLabel}
                        </Text>
                    </View>

                    {/* Section Name */}
                    {task.section_name && (
                        <>
                            <Text style={[styles.separator, { color: theme.textTertiary }]}>•</Text>
                            <Text style={[styles.metadataText, { color: theme.textSecondary }]} numberOfLines={1}>
                                {task.section_name}
                            </Text>
                        </>
                    )}

                    {/* Rating if exists */}
                    {task.average_rating && task.average_rating > 0 && (
                        <>
                            <Text style={[styles.separator, { color: theme.textTertiary }]}>•</Text>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={12} color={theme.warning} />
                                <Text style={[styles.ratingText, { color: theme.text }]}>
                                    {task.average_rating.toFixed(1)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Right Arrow Indicator */}
            <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textTertiary}
                style={styles.arrow}
            />
        </RectButton>
    );
});

TaskRowDense.displayName = 'TaskRowDense';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingRight: spacing.sm,
        borderLeftWidth: 4,
        marginBottom: 1,
        minHeight: 56,
    },
    colorBar: {
        width: 0, // Hidden, using borderLeftWidth instead
        height: '100%',
    },
    checkboxContainer: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    title: {
        fontSize: typography.sizes.sm,
        fontWeight: '500',
        marginBottom: 2,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metadataText: {
        fontSize: typography.sizes.xs,
        fontWeight: '500',
    },
    separator: {
        marginHorizontal: 6,
        fontSize: typography.sizes.xs,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '600',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
    },
    arrow: {
        marginLeft: spacing.xs,
    },
});

export default TaskRowDense;
