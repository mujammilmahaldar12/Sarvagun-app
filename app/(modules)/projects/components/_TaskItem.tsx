import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';

const { spacing, typography, borderRadius } = designSystem;

interface TaskItemProps {
    task: any;
    sectionId: number;
    onUpdate: (sectionId: number, taskId: string | number, field: string, value: any) => void;
    onDelete: (taskId: number) => void;
    onRate: (task: any) => void;
    onDateClick: (taskId: string | number, sectionId: number, currentDate?: string) => void;
    onPriorityClick: (taskId: string | number, sectionId: number, currentPriority?: string) => void;
    canRate: boolean;
    userId?: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    sectionId,
    onUpdate,
    onDelete,
    onRate,
    onDateClick,
    onPriorityClick,
    canRate,
    userId
}) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    borderBottomColor: theme.border + '15',
                    backgroundColor: task.status === 'Completed' ? theme.success + '08' : theme.background,
                    shadowColor: theme.shadow,
                }
            ]}
        >
            {/* Completion Checkbox */}
            <TouchableOpacity
                style={[
                    styles.checkbox,
                    {
                        backgroundColor: task.status === 'Completed' ? theme.success + '12' : 'transparent'
                    }
                ]}
                onPress={() => onUpdate(sectionId, task.id, 'status', task.status === 'Completed' ? 'In Progress' : 'Completed')}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={task.status === 'Completed' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={task.status === 'Completed' ? theme.success : theme.textTertiary}
                />
            </TouchableOpacity>

            {/* Task Title - Editable */}
            <View style={styles.titleContainer}>
                <TextInput
                    style={[
                        styles.titleInput,
                        {
                            color: task.status === 'Completed' ? theme.textSecondary : theme.text,
                            textDecorationLine: task.status === 'Completed' ? 'line-through' : 'none',
                            opacity: task.status === 'Completed' ? 0.6 : 1,
                        }
                    ]}
                    defaultValue={task.title || task.task_title || ''}
                    onChangeText={(text) => onUpdate(sectionId, task.id, 'title', text)}
                    placeholder="Click to edit task title..."
                    placeholderTextColor={theme.textTertiary + '60'}
                    multiline
                    numberOfLines={2}
                />
            </View>

            {/* Due Date - Editable */}
            <View style={[styles.dateContainer, { backgroundColor: theme.surface + '40', borderColor: theme.border + '30' }]}>
                <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.surface + '40' }]}
                    onPress={() => onDateClick(task.id, sectionId, task.due_date)}
                >
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        }) : 'Set Date'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Priority Picker */}
            <TouchableOpacity
                style={[
                    styles.priorityButton,
                    {
                        backgroundColor: task.priority_level === 'P1' ? theme.error + '20' :
                            task.priority_level === 'P2' ? theme.warning + '20' :
                                task.priority_level === 'P3' ? theme.success + '20' : theme.primary + '20',
                    }
                ]}
                onPress={() => onPriorityClick(task.id, sectionId, task.priority_level)}
            >
                <Text style={[
                    styles.priorityText,
                    {
                        color: task.priority_level === 'P1' ? theme.error :
                            task.priority_level === 'P2' ? theme.warning :
                                task.priority_level === 'P3' ? theme.success : theme.primary,
                    }
                ]}>
                    {task.priority_level || 'P3'}
                </Text>
            </TouchableOpacity>

            {/* Status */}
            <View style={styles.statusContainer}>
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: task.status === 'Completed' ? theme.success + '20' : theme.primary + '20',
                    }
                ]}>
                    <Text style={[
                        styles.statusText,
                        {
                            color: task.status === 'Completed' ? theme.success : theme.primary,
                        }
                    ]}>
                        {task.status === 'Completed' ? 'Done' : 'Active'}
                    </Text>
                </View>
            </View>

            {/* Delete Task Button */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    onPress={() => onDelete(task.id)}
                    style={styles.actionButton}
                >
                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                </TouchableOpacity>
            </View>

            {/* Rating Button */}
            <View style={styles.ratingContainer}>
                {task.average_rating ? (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <Ionicons name="star" size={14} color={theme.warning} />
                            <Text style={{ fontSize: typography.sizes.xs, color: theme.text, fontWeight: '600' }}>
                                {task.average_rating.toFixed(1)}
                            </Text>
                        </View>
                        {task.user_rating?.feedback && (
                            <Ionicons name="chatbox" size={10} color={theme.primary} style={{ marginBottom: 2 }} />
                        )}
                        {canRate && task.status === 'Completed' && task.user !== userId && (
                            <TouchableOpacity onPress={() => onRate(task)}>
                                <Text style={{ fontSize: typography.sizes.xs, color: theme.primary }}>
                                    {task.user_rating ? 'Edit' : 'Rate'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : canRate && task.status === 'Completed' && task.user !== userId ? (
                    <TouchableOpacity onPress={() => onRate(task)}>
                        <Ionicons name="star-outline" size={16} color={theme.warning} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderBottomWidth: 1,
        marginVertical: 0.5,
        borderRadius: 4,
        elevation: 0.5,
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.03,
        shadowRadius: 1
    },
    checkbox: {
        width: 30,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 16,
    },
    titleContainer: {
        flex: 1,
        minWidth: 200,
        maxWidth: 350
    },
    titleInput: {
        width: '100%',
        fontSize: typography.sizes.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        backgroundColor: 'transparent',
        borderRadius: 6,
        minHeight: 44,
        fontWeight: '400',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    dateContainer: {
        width: 85,
        alignItems: 'center',
        borderRadius: 6,
        paddingVertical: 3,
        borderWidth: 0.5,
    },
    dateButton: {
        borderRadius: 6,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dateText: {
        fontSize: typography.sizes.xs,
        fontWeight: '500',
        textAlign: 'center'
    },
    priorityButton: {
        width: 50,
        alignItems: 'center',
        paddingVertical: 4,
        borderRadius: 4
    },
    priorityText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600'
    },
    statusContainer: {
        width: 70,
        alignItems: 'center'
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    statusText: {
        fontSize: typography.sizes.xs,
        fontWeight: '500'
    },
    actionContainer: {
        width: 35,
        alignItems: 'center'
    },
    actionButton: {
        padding: spacing.xs
    },
    ratingContainer: {
        width: 60,
        alignItems: 'center'
    }
});


export default TaskItem;
