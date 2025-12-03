import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { designSystem } from '@/constants/designSystem';
import type { TaskProject } from '@/types/project';

const { spacing, typography, borderRadius } = designSystem;

interface ProjectListProps {
    projects: TaskProject[];
    selectedProject: TaskProject | null;
    onSelectProject: (project: TaskProject) => void;
    onEditProject: () => void;
    onDeleteProject: () => void;
    showDropdown: boolean;
    onToggleDropdown: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
    projects,
    selectedProject,
    onSelectProject,
    onEditProject,
    onDeleteProject,
    showDropdown,
    onToggleDropdown
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
                SELECT PROJECT
            </Text>

            <TouchableOpacity
                onPress={onToggleDropdown}
                style={[styles.selector, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.projectName, { color: theme.text }]}>
                        {selectedProject?.project_name || 'Select a project'}
                    </Text>
                    {selectedProject && (
                        <Text style={[styles.projectMeta, { color: theme.textSecondary }]}>
                            {/* Meta info can be passed here */}
                            Active Project
                        </Text>
                    )}
                </View>
                <View style={styles.actions}>
                    {selectedProject && (
                        <>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onEditProject();
                                }}
                                style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                            >
                                <Ionicons name="pencil" size={16} color={theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onDeleteProject();
                                }}
                                style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                            >
                                <Ionicons name="trash-outline" size={16} color={theme.error} />
                            </TouchableOpacity>
                        </>
                    )}
                    <Ionicons
                        name={showDropdown ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.primary}
                    />
                </View>
            </TouchableOpacity>

            {/* Dropdown List */}
            {showDropdown && (
                <View style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {projects.map((project, index) => (
                            <TouchableOpacity
                                key={project.id}
                                onPress={() => onSelectProject(project)}
                                style={[
                                    styles.dropdownItem,
                                    {
                                        borderBottomWidth: index < projects.length - 1 ? 1 : 0,
                                        borderBottomColor: theme.border,
                                        backgroundColor: selectedProject?.id === project.id ? theme.primary + '15' : 'transparent'
                                    }
                                ]}
                            >
                                <View style={styles.dropdownContent}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[
                                            styles.dropdownItemText,
                                            {
                                                color: selectedProject?.id === project.id ? theme.primary : theme.text,
                                                fontWeight: selectedProject?.id === project.id ? '600' : '400'
                                            }
                                        ]}>
                                            {project.project_name}
                                        </Text>
                                        {project.description && (
                                            <Text style={[styles.dropdownItemDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                                                {project.description}
                                            </Text>
                                        )}
                                    </View>
                                    {selectedProject?.id === project.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
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
    label: {
        fontSize: typography.sizes.xs,
        marginBottom: spacing.xs,
        fontWeight: '600'
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    projectName: {
        fontSize: typography.sizes.base,
        fontWeight: '600'
    },
    projectMeta: {
        fontSize: typography.sizes.xs,
        marginTop: 2
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs
    },
    actionButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.sm
    },
    dropdown: {
        marginTop: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        maxHeight: 300
    },
    dropdownItem: {
        padding: spacing.md,
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dropdownItemText: {
        fontSize: typography.sizes.sm,
    },
    dropdownItemDesc: {
        fontSize: typography.sizes.xs,
        marginTop: 2
    }
});
