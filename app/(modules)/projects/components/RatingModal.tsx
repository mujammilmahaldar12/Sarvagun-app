import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import type { Task } from '@/types/project';

const { spacing, borderRadius } = designSystem;

type RatingValue = '1' | '2' | '3' | '4' | '5';

interface RatingModalProps {
    visible: boolean;
    task: Task | null;
    rating: RatingValue;
    feedback: string;
    onRatingChange: (value: RatingValue) => void;
    onFeedbackChange: (text: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function RatingModal({
    visible,
    task,
    rating,
    feedback,
    onRatingChange,
    onFeedbackChange,
    onSubmit,
    onClose,
}: RatingModalProps) {
    const { theme } = useTheme();

    const ratingOptions: RatingValue[] = ['1', '2', '3', '4', '5'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Rate Task
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Task Info */}
                        {task && (
                            <View style={[styles.taskInfo, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={[styles.taskTitle, { color: theme.text }]}>
                                    {task.task_title}
                                </Text>
                                {task.section_name && (
                                    <Text style={[styles.taskMeta, { color: theme.textSecondary }]}>
                                        Section: {task.section_name}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Star Rating */}
                        <View style={styles.ratingSection}>
                            <Text style={[styles.sectionLabel, { color: theme.text }]}>
                                Rating *
                            </Text>
                            <View style={styles.starsContainer}>
                                {ratingOptions.map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        onPress={() => onRatingChange(value)}
                                        style={styles.starButton}
                                    >
                                        <Ionicons
                                            name={parseInt(value) <= parseInt(rating) ? 'star' : 'star-outline'}
                                            size={40}
                                            color={parseInt(value) <= parseInt(rating) ? '#FFD700' : theme.textSecondary}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                                {rating} {parseInt(rating) === 1 ? 'Star' : 'Stars'}
                            </Text>
                        </View>

                        {/* Feedback */}
                        <View style={styles.feedbackSection}>
                            <Text style={[styles.sectionLabel, { color: theme.text }]}>
                                Feedback (Optional)
                            </Text>
                            <TextInput
                                style={[
                                    styles.feedbackInput,
                                    {
                                        backgroundColor: theme.background,
                                        borderColor: theme.border,
                                        color: theme.text,
                                    },
                                ]}
                                placeholder="Provide feedback on this task..."
                                placeholderTextColor={theme.textSecondary}
                                value={feedback}
                                onChangeText={onFeedbackChange}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={onSubmit}
                        >
                            <Text style={styles.submitButtonText}>Submit Rating</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    taskInfo: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.lg,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    taskMeta: {
        fontSize: 14,
    },
    ratingSection: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    starButton: {
        padding: spacing.xs,
    },
    ratingText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
    },
    feedbackSection: {
        marginBottom: spacing.lg,
    },
    feedbackInput: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 15,
        minHeight: 100,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
