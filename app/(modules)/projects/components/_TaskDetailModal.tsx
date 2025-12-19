/**
 * TaskDetailModal Component
 * Shows full task details when a task is tapped
 * Includes: Title, Section, Due Date, Priority, Status, Comments, Rating
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    TextInput,
    Alert
} from 'react-native';
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
import { Calendar } from '@/components/core/Calendar';

const { spacing, typography, borderRadius } = designSystem;

interface TaskDetailModalProps {
    visible: boolean;
    task: Task | null;
    sections: any[]; // Using any to avoid type complexity for now, or import TaskSection
    priorities: any[];
    onClose: () => void;
    onComplete: (taskId: number) => void;
    onUncomplete: (taskId: number) => void;
    onDelete: (taskId: number) => void;
    onRate: (task: Task) => void;
    onSave: (taskId: number, data: any) => void;
    canRate: boolean;
    userId?: number;
    isTeamLeadView?: boolean; // True when viewing team member tasks
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    visible,
    task,
    sections,
    priorities,
    onClose,
    onComplete,
    onUncomplete,
    onDelete,
    onRate,
    onSave,
    canRate,
    userId,
    isTeamLeadView = false,
}) => {
    const { theme } = useTheme();
    const [isEditing, setIsEditing] = React.useState(false);

    // Edit State
    const [editTitle, setEditTitle] = React.useState('');
    const [editSection, setEditSection] = React.useState<number | null>(null);
    const [editPriority, setEditPriority] = React.useState<number | null>(null);
    const [editDueDate, setEditDueDate] = React.useState('');
    const [editComments, setEditComments] = React.useState('');

    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [showSectionDropdown, setShowSectionDropdown] = React.useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = React.useState(false);

    // Initialize state when opening or task changes
    React.useEffect(() => {
        if (task) {
            setEditTitle(task.task_title);
            setEditSection(task.section); // Assuming task has section ID
            setEditPriority(task.priority || null);
            setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
            setEditComments(task.comments === 'No additional comments' ? '' : task.comments || '');
            setIsEditing(false); // Reset to view mode on new task
        }
    }, [task, visible]);

    if (!task) return null;

    const handleSave = () => {
        if (!editTitle.trim()) {
            // Alert.alert('Validation', 'Title is required');
            return;
        }
        onSave(task.id, {
            task_title: editTitle,
            section: editSection,
            priority: editPriority,
            due_date: editDueDate,
            comments: editComments
        });
        setIsEditing(false);
    };

    const isCompleted = task.status === 'Completed';
    const urgencyColor = getUrgencyColor(task.due_date, isCompleted);
    const priorityColor = getPriorityColor(task.priority_level);
    const priorityLabel = getPriorityLabel(task.priority_level);
    const formattedDate = formatDueDate(task.due_date);

    // Show rate button: user must have permission, task completed, AND not their own task
    const isOwnTask = task.user === userId;
    const showRateButton = canRate && isCompleted && !isOwnTask;

    // Debug logging for rate button visibility
    console.log('🔍 Show Rate Button Debug:', {
        canRate,
        isCompleted,
        taskUser: task.user,
        currentUserId: userId,
        isOwnTask,
        showRateButton,
        taskTitle: task.task_title,
        taskStatus: task.status
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={[styles.container, { backgroundColor: theme.surface }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.statusIndicator, { backgroundColor: urgencyColor }]} />
                            <Text style={[styles.headerTitle, { color: theme.text }]}>Task Details</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {!isEditing && !isTeamLeadView && (
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerActionButton}>
                                    <Ionicons name="pencil" size={20} color={theme.text} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Task Title */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>TASK</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    value={editTitle}
                                    onChangeText={setEditTitle}
                                    placeholder="Task Title"
                                    placeholderTextColor={theme.textTertiary}
                                />
                            ) : (
                                <Text style={[
                                    styles.taskTitle,
                                    {
                                        color: isCompleted ? theme.textSecondary : theme.text,
                                        textDecorationLine: isCompleted ? 'line-through' : 'none'
                                    }
                                ]}>
                                    {task.task_title}
                                </Text>
                            )}
                        </View>

                        {/* Section & Status Row */}
                        <View style={styles.row}>
                            <View style={[styles.section, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>SECTION</Text>
                                {isEditing ? (
                                    <View style={{ zIndex: 20 }}>
                                        <TouchableOpacity
                                            style={[styles.dropdownButton, { borderColor: theme.border }]}
                                            onPress={() => setShowSectionDropdown(!showSectionDropdown)}
                                        >
                                            <Text style={{ color: theme.text }}>
                                                {(sections || []).find(s => s.id === editSection)?.section_name || 'Select Section'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                        {showSectionDropdown && (
                                            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                {(sections || [])
                                                    .filter(s => !['Completed', 'Overdue'].includes(s.section_name))
                                                    .map(s => (
                                                        <TouchableOpacity
                                                            key={s.id}
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                setEditSection(s.id);
                                                                setShowSectionDropdown(false);
                                                            }}
                                                        >
                                                            <Text style={{ color: theme.text }}>{s.section_name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                                        <Text style={[styles.badgeText, { color: theme.primary }]}>
                                            {task?.section_name || 'General'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.section, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>STATUS</Text>
                                <View style={[
                                    styles.badge,
                                    { backgroundColor: isCompleted ? '#DCFCE7' : '#DBEAFE' }
                                ]}>
                                    <Text style={[
                                        styles.badgeText,
                                        { color: isCompleted ? '#166534' : '#1E40AF' }
                                    ]}>
                                        {task.status}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Due Date & Priority Row */}
                        <View style={[styles.row, { zIndex: 10 }]}>
                            <View style={[styles.section, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>DUE DATE</Text>
                                {isEditing ? (
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        style={[styles.input, { paddingVertical: 8, justifyContent: 'center' }]}
                                    >
                                        <Text style={{ color: theme.text }}>
                                            {editDueDate ? formatDueDate(editDueDate) : 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.dateContainer}>
                                        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                                        <Text style={[styles.value, { color: theme.text }]}>
                                            {formattedDate}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.section, { flex: 1 }]}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>PRIORITY</Text>
                                {isEditing ? (
                                    <View style={{ zIndex: 30 }}>
                                        <TouchableOpacity
                                            style={[styles.dropdownButton, { borderColor: theme.border }]}
                                            onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                {editPriority && (
                                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getPriorityColor((priorities || []).find(p => p.id === editPriority)?.level) }} />
                                                )}
                                                <Text style={{ color: theme.text }}>
                                                    {editPriority
                                                        ? (priorities || []).find(p => p.id === editPriority)?.level || 'Select'
                                                        : 'None'}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                        {showPriorityDropdown && (
                                            <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                                {/* None Option */}
                                                <TouchableOpacity
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setEditPriority(null);
                                                        setShowPriorityDropdown(false);
                                                    }}
                                                >
                                                    <Text style={{ color: theme.textSecondary }}>None</Text>
                                                </TouchableOpacity>
                                                {/* Priority Options */}
                                                {(priorities || []).length > 0 ? (
                                                    (priorities || []).map(p => (
                                                        <TouchableOpacity
                                                            key={p.id}
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                setEditPriority(p.id);
                                                                setShowPriorityDropdown(false);
                                                            }}
                                                        >
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getPriorityColor(p.level) }} />
                                                                <Text style={{ color: theme.text }}>{p.level}</Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))
                                                ) : (
                                                    <Text style={{ color: theme.textTertiary, padding: 8, fontSize: 12 }}>No priorities available</Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
                                        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                                        <Text style={[styles.priorityText, { color: theme.text }]}>
                                            {priorityLabel}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Rating */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>RATING</Text>
                            {task.average_rating && task.average_rating > 0 ? (
                                <View style={styles.ratingContainer}>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= Math.round(task.average_rating!) ? 'star' : 'star-outline'}
                                                size={24}
                                                color={theme.warning}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.ratingValue, { color: theme.text }]}>
                                        {task.average_rating.toFixed(1)} / 5
                                    </Text>
                                    <Text style={[styles.ratingCount, { color: theme.textSecondary }]}>
                                        ({task.rating_count || 1} rating{task.rating_count !== 1 ? 's' : ''})
                                    </Text>
                                    {task.user_rating?.feedback && (
                                        <View style={[styles.feedbackBox, { backgroundColor: theme.background }]}>
                                            <Ionicons name="chatbox-outline" size={14} color={theme.textSecondary} />
                                            <Text style={[styles.feedbackText, { color: theme.text }]}>
                                                "{task.user_rating.feedback}"
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <Text style={[styles.noRating, { color: theme.textTertiary }]}>
                                    No ratings yet
                                </Text>
                            )}
                        </View>

                        {/* Comments */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>COMMENTS</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
                                    value={editComments}
                                    onChangeText={setEditComments}
                                    multiline
                                    placeholder="Add comments..."
                                    placeholderTextColor={theme.textTertiary}
                                />
                            ) : (
                                <Text style={[styles.value, { color: theme.text, lineHeight: 22 }]}>
                                    {task.comments || 'No additional comments'}
                                </Text>
                            )}
                        </View>

                        {/* Assigned To */}
                        {task.user_name && (
                            <View style={styles.section}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>ASSIGNED TO</Text>
                                <View style={styles.infoRow}>
                                    <View style={[styles.avatar, { backgroundColor: theme.primary + '30' }]}>
                                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                                            {task.user_name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.userName, { color: theme.text }]}>
                                            {task.user_name}
                                        </Text>
                                        {task.user_designation && (
                                            <Text style={[styles.userDesignation, { color: theme.textSecondary }]}>
                                                {task.user_designation}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Created Date */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>CREATED</Text>
                            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                {task.date_of_entry ? new Date(task.date_of_entry).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Unknown'}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer Actions - Edit Mode */}
                    {isEditing ? (
                        <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: 24 }]}>
                            <TouchableOpacity
                                onPress={() => setIsEditing(false)}
                                style={[styles.footerButton, { backgroundColor: theme.border }]}
                            >
                                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.footerButton, { backgroundColor: theme.primary }]}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Footer Actions - View Mode */
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            {showRateButton && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.warning + '20' }]}
                                    onPress={() => onRate(task)}
                                >
                                    <Ionicons name="star" size={20} color={theme.warning} />
                                    <Text style={[styles.actionButtonText, { color: theme.warning }]}>Rate</Text>
                                </TouchableOpacity>
                            )}

                            {!isCompleted ? (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
                                    onPress={() => onComplete(task.id)}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                                    <Text style={[styles.actionButtonText, { color: theme.success }]}>Complete</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                                    onPress={() => onUncomplete(task.id)}
                                >
                                    <Ionicons name="refresh-circle" size={20} color={theme.primary} />
                                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Re-open</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                                onPress={() => onDelete(task.id)}
                            >
                                <Ionicons name="trash" size={20} color={theme.error} />
                                <Text style={[styles.actionButtonText, { color: theme.error }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date Picker Modal */}
                    <Modal visible={showDatePicker} transparent animationType="fade">
                        <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
                            <TouchableOpacity
                                style={styles.backdrop}
                                activeOpacity={1}
                                onPress={() => setShowDatePicker(false)}
                            />
                            <View style={[styles.calendarContainer, { backgroundColor: theme.surface }]}>
                                <Calendar
                                    selectedDate={editDueDate ? new Date(editDueDate) : new Date()}
                                    onSelectDate={(date: Date) => {
                                        setEditDueDate(date.toISOString().split('T')[0]);
                                        setShowDatePicker(false);
                                    }}
                                    minDate={new Date()}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(false)}
                                    style={{ padding: 16, alignItems: 'center' }}
                                >
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        maxHeight: '85%',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    headerTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '600',
    },
    closeButton: {
        padding: spacing.xs,
    },
    headerActionButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.md,
    },
    section: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    taskTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '600',
        lineHeight: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    infoText: {
        fontSize: typography.sizes.base,
    },
    dateDetail: {
        fontSize: typography.sizes.xs,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    priorityText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    statusText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
    },
    completedDate: {
        fontSize: typography.sizes.xs,
        marginTop: spacing.xs,
    },
    ratingContainer: {
        gap: spacing.xs,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingValue: {
        fontSize: typography.sizes.lg,
        fontWeight: '700',
        marginTop: spacing.xs,
    },
    ratingCount: {
        fontSize: typography.sizes.xs,
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    feedbackText: {
        flex: 1,
        fontSize: typography.sizes.sm,
        fontStyle: 'italic',
    },
    noRating: {
        fontSize: typography.sizes.sm,
        fontStyle: 'italic',
    },
    commentsBox: {
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    commentsText: {
        fontSize: typography.sizes.sm,
        lineHeight: 20,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: typography.sizes.base,
        fontWeight: '700',
    },
    userName: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
    },
    userDesignation: {
        fontSize: typography.sizes.xs,
    },
    actions: {
        flexDirection: 'row',
        padding: spacing.md,
        borderTopWidth: 1,
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    actionButtonText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        fontSize: typography.sizes.base,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.sm,
        borderWidth: 1,
        borderRadius: borderRadius.md,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        marginTop: 4,
        padding: 4,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    dropdownItem: {
        padding: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    footer: {
        flexDirection: 'row',
        padding: spacing.md,
        borderTopWidth: 1,
        gap: spacing.sm,
    },
    footerButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.xs,
    },
    calendarContainer: {
        width: '90%',
        maxWidth: 360,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    value: {
        fontSize: typography.sizes.base,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
    },
});

export default TaskDetailModal;
