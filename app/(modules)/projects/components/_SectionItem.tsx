import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import { TaskItem } from './_TaskItem';

const { spacing, typography, borderRadius } = designSystem;

interface SectionItemProps {
    section: any;
    expandedSections: number[];
    onToggleSection: (sectionId: number) => void;
    onDeleteSection: (sectionId: number) => void;
    onUpdateTask: (sectionId: number, taskId: string | number, field: string, value: any) => void;
    onDeleteTask: (taskId: number) => void;
    onRateTask: (task: any) => void;
    onDateClick: (taskId: string | number, sectionId: number, currentDate?: string) => void;
    onPriorityClick: (taskId: string | number, sectionId: number, currentPriority?: string) => void;
    canRate: boolean;
    userId?: string;
    tempTasks: { [sectionId: number]: any[] };
    newTaskForSection: { [sectionId: number]: boolean };
    onAddTaskToSection: (sectionId: number) => void;
    onSaveNewTask: (sectionId: number, task: any) => void;
    onTaskChange: (sectionId: number, taskId: string | number, field: string, value: any) => void;
    onDateClickNew: (taskId: string | number, sectionId: number) => void;
}

export const SectionItem: React.FC<SectionItemProps> = ({
    section,
    expandedSections,
    onToggleSection,
    onDeleteSection,
    onUpdateTask,
    onDeleteTask,
    onRateTask,
    onDateClick,
    onPriorityClick,
    canRate,
    userId,
    tempTasks,
    newTaskForSection,
    onAddTaskToSection,
    onSaveNewTask,
    onTaskChange,
    onDateClickNew
}) => {
    const { theme } = useTheme();
    const isExpanded = expandedSections.includes(section.id);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                }
            ]}
        >
            {/* Section Header */}
            <TouchableOpacity
                onPress={() => onToggleSection(section.id)}
                style={styles.header}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {section.section_name}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {section.tasks?.length || 0} tasks
                    </Text>
                </View>

                <View style={styles.actions}>
                    {/* Delete Section Button */}
                    <TouchableOpacity
                        onPress={() => onDeleteSection(section.id)}
                        style={[styles.deleteButton, { backgroundColor: theme.error + '20' }]}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                    </TouchableOpacity>

                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.textSecondary}
                    />
                </View>
            </TouchableOpacity>

            {/* Excel-like Task Table */}
            {isExpanded && (
                <View style={{ marginTop: spacing.md }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{ paddingHorizontal: 4 }}
                    >
                        <View style={{ minWidth: '100%', width: 600 }}>
                            {/* Existing Tasks */}
                            {section.tasks && section.tasks.map((task: any) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    sectionId={section.id}
                                    onUpdate={onUpdateTask}
                                    onDelete={onDeleteTask}
                                    onRate={onRateTask}
                                    onDateClick={onDateClick}
                                    onPriorityClick={onPriorityClick}
                                    canRate={canRate}
                                    userId={userId}
                                />
                            ))}

                            {/* Temp New Tasks */}
                            {tempTasks[section.id]?.map((task: any) => (
                                <View
                                    key={task.id}
                                    style={[
                                        styles.tempTaskContainer,
                                        {
                                            borderBottomColor: theme.primary + '20',
                                            backgroundColor: theme.primary + '08',
                                            borderLeftColor: theme.primary + '60'
                                        }
                                    ]}
                                >
                                    <View style={{ width: 30, alignItems: 'center' }}>
                                        <Ionicons name="ellipse-outline" size={20} color={theme.textTertiary} />
                                    </View>

                                    <TextInput
                                        style={[
                                            styles.tempTaskInput,
                                            {
                                                color: theme.text,
                                                borderColor: theme.primary + '50',
                                                backgroundColor: theme.background,
                                            }
                                        ]}
                                        defaultValue={task.task_title || ''}
                                        onChangeText={(text) => onTaskChange(section.id, task.id, 'task_title', text)}
                                        placeholder="Type your task here and press Enter to save..."
                                        placeholderTextColor={theme.textTertiary + '60'}
                                        multiline
                                        numberOfLines={2}
                                        autoFocus
                                        onSubmitEditing={() => onSaveNewTask(section.id, task)}
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                    />

                                    <TouchableOpacity
                                        style={[
                                            styles.tempDateButton,
                                            {
                                                backgroundColor: theme.surface + '60',
                                                borderColor: theme.primary + '30'
                                            }
                                        ]}
                                        onPress={() => onDateClickNew(task.id, section.id)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                                            <Text style={{
                                                fontSize: typography.sizes.xs,
                                                color: theme.textSecondary,
                                                fontWeight: '500'
                                            }}>
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'Set date'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={{ width: 50, alignItems: 'center' }}>
                                        <Text style={{ fontSize: typography.sizes.xs, color: theme.textSecondary }}>P3</Text>
                                    </View>

                                    <View style={{ width: 70, alignItems: 'center' }}>
                                        <Text style={{ fontSize: typography.sizes.xs, color: theme.textSecondary }}>New</Text>
                                    </View>

                                    <View style={{ width: 40 }} />
                                </View>
                            ))}

                            {/* Add New Task Row */}
                            {!newTaskForSection[section.id] && (
                                <TouchableOpacity
                                    onPress={() => onAddTaskToSection(section.id)}
                                    style={[
                                        styles.addTaskButton,
                                        {
                                            backgroundColor: theme.primary + '06',
                                            borderColor: theme.primary + '20'
                                        }
                                    ]}
                                >
                                    <Ionicons name="add" size={20} color={theme.primary} />
                                    <Text style={[styles.addTaskText, { color: theme.primary }]}>
                                        Add Task
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: typography.sizes.xs,
        marginTop: 2
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm
    },
    deleteButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.md
    },
    tempTaskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderBottomWidth: 1,
        borderRadius: 4,
        marginVertical: 1,
        borderLeftWidth: 3,
    },
    tempTaskInput: {
        flex: 1,
        minWidth: 200,
        maxWidth: 350,
        fontSize: typography.sizes.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: 1.5,
        borderRadius: 8,
        fontWeight: '500',
        minHeight: 44,
        textAlignVertical: 'top'
    },
    tempDateButton: {
        width: 90,
        alignItems: 'center',
        borderRadius: 6,
        paddingVertical: 6,
        borderWidth: 1,
    },
    addTaskButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.xs,
        borderRadius: 8,
        marginVertical: 4,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        gap: spacing.sm
    },
    addTaskText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600'
    }
});
export default SectionItem;
