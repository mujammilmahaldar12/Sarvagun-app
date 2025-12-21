import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import type { TaskProject } from '@/types/project';

const { spacing, borderRadius } = designSystem;

interface ProjectSelectorProps {
    projects: TaskProject[];
    selectedProject: TaskProject | null;
    onSelectProject: (project: TaskProject) => void;
    onEditProject: () => void;
    onDeleteProject: (project: { id: number; name: string }) => void;
    visible: boolean;
    onClose: () => void;
}

export function ProjectSelector({
    projects,
    selectedProject,
    onSelectProject,
    onEditProject,
    onDeleteProject,
    visible,
    onClose,
}: ProjectSelectorProps) {
    const { theme } = useTheme();

    const handleSelectProject = (project: TaskProject) => {
        onSelectProject(project);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[styles.modalContent, { backgroundColor: theme.surface }]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            Select Project
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Project List */}
                    <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
                        {projects.map((project) => {
                            const isSelected = selectedProject?.id === project.id;

                            return (
                                <View
                                    key={project.id}
                                    style={[
                                        styles.projectItem,
                                        { borderColor: theme.border },
                                        isSelected && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.projectInfo}
                                        onPress={() => handleSelectProject(project)}
                                    >
                                        <View style={styles.projectText}>
                                            <Text
                                                style={[
                                                    styles.projectName,
                                                    { color: isSelected ? theme.primary : theme.text },
                                                ]}
                                            >
                                                {project.project_name}
                                            </Text>
                                            {project.description && (
                                                <Text
                                                    style={[styles.projectDescription, { color: theme.textSecondary }]}
                                                    numberOfLines={1}
                                                >
                                                    {project.description}
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                        )}
                                    </TouchableOpacity>

                                    {/* Project Actions */}
                                    {isSelected && (
                                        <View style={styles.projectActions}>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => {
                                                    onClose();
                                                    onEditProject();
                                                }}
                                            >
                                                <Ionicons name="create-outline" size={20} color={theme.primary} />
                                                <Text style={[styles.actionText, { color: theme.primary }]}>
                                                    Edit
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => {
                                                    onClose();
                                                    onDeleteProject({ id: project.id, name: project.project_name });
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                                                <Text style={[styles.actionText, { color: theme.error }]}>
                                                    Delete
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    projectList: {
        maxHeight: 400,
    },
    projectItem: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    projectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    projectText: {
        flex: 1,
        marginRight: spacing.sm,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    projectDescription: {
        fontSize: 14,
    },
    projectActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
