/**
 * Task Tracker Screen - Redesigned
 * Smart Grouped View (Overdue/Today/This Week/Later/Completed)
 * + Two-Line Dense List + Swipe Gestures
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    StyleSheet,
    RefreshControl
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { ModuleHeader } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { Calendar } from '@/components/core/Calendar';
import type { TaskSection, TaskProject, Task } from '@/types/project';
import {
    useMyProjects,
    useTeamMemberProjects,
    useSectionsByProject,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useCreateSection,
    useDeleteSection,
    useUpdateProject,
    useDeleteProject,
    usePriorities,
    useRateTask,
} from '@/hooks/useProjectQueries';
import { useAuthStore } from '@/store/authStore';

// New components
import { SwipeableTaskRow } from './components/_SwipeableTaskRow';
import { UrgencySection } from './components/_UrgencySection';
import { TaskDetailModal } from './components/_TaskDetailModal';
import {
    groupTasksByUrgency,
    URGENCY_SECTIONS,
    type GroupedTasks,
    type UrgencyGroup
} from '@/utils/taskGrouping';

const { spacing, borderRadius, typography } = designSystem;

// Helper function to generate consistent color from string
const getAvatarColor = (name: string): string => {
    const colors = [
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
        '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#FF9800',
        '#FF5722', '#795548', '#607D8B', '#F44336', '#E040FB',
        '#00E676', '#FF6D00', '#6200EA', '#0091EA', '#00C853'
    ];

    // Generate a consistent index based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

// Helper function to get first letter
const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
};

// Filter tab type
type FilterTab = 'all' | 'active' | 'completed';

export default function ProjectsScreen() {
    const { theme } = useTheme();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Team lead context
    const teamMemberId = params.teamMemberId as string;
    const teamMemberName = params.teamMemberName as string;
    const isTeamLead = params.isTeamLead === 'true';

    // Core state
    const [selectedProject, setSelectedProject] = useState<TaskProject | null>(null);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // New UI state
    const [filterTab, setFilterTab] = useState<FilterTab>('active');
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | null>(null);
    const [showSectionFilterDropdown, setShowSectionFilterDropdown] = useState(false);

    // Modals
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedSectionForTask, setSelectedSectionForTask] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<number | null>(null);
    const [newTaskComments, setNewTaskComments] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    // Project edit
    const [showEditProject, setShowEditProject] = useState(false);
    const [editProjectName, setEditProjectName] = useState('');
    const [editProjectDescription, setEditProjectDescription] = useState('');

    // Rating
    const [showRating, setShowRating] = useState(false);
    const [selectedTaskForRating, setSelectedTaskForRating] = useState<Task | null>(null);
    const [ratingValue, setRatingValue] = useState<'1' | '2' | '3' | '4' | '5'>('5');
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

    // Task Detail Modal
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

    // Data hooks
    const { data: myProjects, isLoading: myProjectsLoading, refetch: refetchMyProjects } = useMyProjects();
    const { data: teamMemberProjects, isLoading: teamMemberProjectsLoading, refetch: refetchTeamMemberProjects } = useTeamMemberProjects(teamMemberId);

    const projects = isTeamLead && teamMemberId ? teamMemberProjects : myProjects;
    const projectsLoading = isTeamLead && teamMemberId ? teamMemberProjectsLoading : myProjectsLoading;
    const refetchProjects = isTeamLead && teamMemberId ? refetchTeamMemberProjects : refetchMyProjects;

    const { data: sectionsData, refetch: refetchSections, isLoading: sectionsLoading } = useSectionsByProject(
        selectedProject?.id || 0,
        !!selectedProject
    );
    const { data: priorities } = usePriorities();
    const user = useAuthStore((state) => state.user);

    // Normalize data
    const projectsList = Array.isArray(projects) ? projects : [];
    const sectionsList = Array.isArray(sectionsData) ? sectionsData : [];
    const prioritiesList = Array.isArray(priorities) ? priorities : [];

    // Mutations
    const createSectionMutation = useCreateSection();
    const deleteSectionMutation = useDeleteSection();
    const createTaskMutation = useCreateTask();
    const deleteTaskMutation = useDeleteTask();
    const updateTaskMutation = useUpdateTask();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();
    const rateTaskMutation = useRateTask();

    // Permissions
    const isLeadOrAdmin = user?.category === 'admin' || user?.category === 'manager';
    const canRateTasks = isLeadOrAdmin || (isTeamLead && teamMemberId);

    // Auto-select first project
    useEffect(() => {
        if (projectsList.length > 0 && !selectedProject) {
            setSelectedProject(projectsList[0]);
        }
    }, [projectsList]);

    // Flatten all tasks from sections
    const allTasks = useMemo(() => {
        const tasks: Task[] = [];
        sectionsList.forEach(section => {
            if (section.tasks) {
                // Inject section_name into task objects
                const tasksWithSection = section.tasks.map(t => ({
                    ...t,
                    section_name: section.section_name
                }));
                tasks.push(...tasksWithSection);
            }
        });
        return tasks;
    }, [sectionsList]);

    // Group tasks by urgency
    const groupedTasks = useMemo(() => {
        return groupTasksByUrgency(allTasks);
    }, [allTasks]);

    // Filter tasks based on selected tab AND section filter
    const filteredGroupedTasks = useMemo((): GroupedTasks => {
        let result: GroupedTasks = groupedTasks;

        // Apply section filter if set (only for 'all' tab)
        if (filterTab === 'all' && selectedSectionFilter !== null) {
            const filterBySection = (tasks: Task[]) =>
                tasks.filter(t => t.section === selectedSectionFilter);

            result = {
                overdue: filterBySection(groupedTasks.overdue),
                today: filterBySection(groupedTasks.today),
                thisWeek: filterBySection(groupedTasks.thisWeek),
                later: filterBySection(groupedTasks.later),
                completed: filterBySection(groupedTasks.completed),
            };
        } else if (filterTab === 'completed') {
            result = {
                overdue: [],
                today: [],
                thisWeek: [],
                later: [],
                completed: groupedTasks.completed,
            };
        } else if (filterTab === 'active') {
            result = {
                ...groupedTasks,
                completed: [],
            };
        }

        return result;
    }, [groupedTasks, filterTab, selectedSectionFilter]);

    // Task counts for filter tabs
    const taskCounts = useMemo(() => ({
        all: allTasks.length,
        active: groupedTasks.overdue.length + groupedTasks.today.length + groupedTasks.thisWeek.length + groupedTasks.later.length,
        completed: groupedTasks.completed.length,
        overdue: groupedTasks.overdue.length,
    }), [groupedTasks, allTasks]);

    // Initialize expanded sections
    useEffect(() => {
        if (sectionsList.length > 0 && expandedSections.length === 0) {
            setExpandedSections(sectionsList.map(s => s.id));
        }
    }, [sectionsList.length]);

    // Toggle section expansion
    const toggleSection = useCallback((sectionId: number) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    }, []);

    // Handle complete task
    const handleCompleteTask = useCallback((taskId: number) => {
        updateTaskMutation.mutate({
            taskId,
            data: {
                status: 'Completed',
                completed_date: new Date().toISOString()
            }
        }, {
            onSuccess: () => refetchSections()
        });
    }, [updateTaskMutation, refetchSections]);

    // Handle uncomplete task
    const handleUncompleteTask = useCallback((taskId: number) => {
        updateTaskMutation.mutate({
            taskId,
            data: {
                status: 'In Progress',
                completed_date: undefined
            }
        }, {
            onSuccess: () => refetchSections()
        });
    }, [updateTaskMutation, refetchSections]);

    // Handle delete task
    const handleDeleteTask = useCallback((taskId: number) => {
        deleteTaskMutation.mutate(taskId, {
            onSuccess: () => refetchSections()
        });
    }, [deleteTaskMutation, refetchSections]);

    // Handle task press - open detail modal
    const handleTaskPress = useCallback((task: Task) => {
        setSelectedTaskForDetail(task);
        setShowTaskDetail(true);
    }, []);

    // Handle rate task from detail modal
    const handleRateTask = useCallback((task: Task) => {
        setSelectedTaskForRating(task);
        setRatingValue(task.user_rating?.rating as any || '5');
        setRatingFeedback(task.user_rating?.feedback || '');
        setShowRating(true);
    }, []);


    // Pull to refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetchSections();
        setRefreshing(false);
    }, [refetchSections]);

    // Create section
    const handleCreateSection = useCallback(() => {
        if (!newSectionName.trim()) {
            Alert.alert('Validation', 'Please enter a section name');
            return;
        }
        if (!selectedProject) {
            Alert.alert('Error', 'No project selected');
            return;
        }

        createSectionMutation.mutate({
            section_name: newSectionName.trim(),
            project: selectedProject.id
        }, {
            onSuccess: () => {
                setNewSectionName('');
                setShowAddSection(false);
                refetchSections();
            }
        });
    }, [newSectionName, selectedProject, createSectionMutation, refetchSections]);

    // Create or Update task
    const handleCreateOrUpdateTask = useCallback(() => {
        if (!newTaskTitle.trim()) {
            Alert.alert('Validation', 'Please enter task title');
            return;
        }
        if (!selectedSectionForTask) {
            Alert.alert('Error', 'Please select a section');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        if (editingTaskId) {
            // Update existing task
            updateTaskMutation.mutate({
                taskId: editingTaskId,
                data: {
                    task_title: newTaskTitle.trim(),
                    section: selectedSectionForTask,
                    due_date: newTaskDueDate || today,
                    comments: newTaskComments.trim() || 'No additional comments',
                    priority: newTaskPriority || undefined,
                }
            }, {
                onSuccess: () => {
                    setNewTaskTitle('');
                    setNewTaskDueDate('');
                    setNewTaskPriority(null);
                    setNewTaskComments('');
                    setEditingTaskId(null);
                    setSelectedSectionForTask(null);
                    setShowAddTask(false);
                    refetchSections();
                }
            });
        } else {
            // Create new task
            createTaskMutation.mutate({
                task_title: newTaskTitle.trim(),
                section: selectedSectionForTask,
                due_date: newTaskDueDate || today,
                comments: newTaskComments.trim() || 'No additional comments',
                priority: newTaskPriority || undefined,
                starred: false
            }, {
                onSuccess: () => {
                    setNewTaskTitle('');
                    setNewTaskDueDate('');
                    setNewTaskPriority(null);
                    setNewTaskComments('');
                    setSelectedSectionForTask(null);
                    setShowAddTask(false);
                    refetchSections();
                }
            });
        }
    }, [newTaskTitle, selectedSectionForTask, newTaskDueDate, newTaskComments, newTaskPriority, editingTaskId, updateTaskMutation, createTaskMutation, refetchSections]);

    // Handle project edit
    const handleEditProject = useCallback(() => {
        if (!selectedProject) return;
        setEditProjectName(selectedProject.project_name);
        setEditProjectDescription(selectedProject.description || '');
        setShowEditProject(true);
    }, [selectedProject]);

    const handleUpdateProject = useCallback(() => {
        if (!editProjectName.trim() || !selectedProject) return;

        updateProjectMutation.mutate({
            projectId: selectedProject.id,
            data: {
                project_name: editProjectName.trim(),
                description: editProjectDescription.trim()
            }
        }, {
            onSuccess: () => {
                setShowEditProject(false);
                refetchProjects();
            }
        });
    }, [editProjectName, editProjectDescription, selectedProject, updateProjectMutation, refetchProjects]);

    const handleDeleteProject = useCallback(() => {
        if (!selectedProject) return;

        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${selectedProject.project_name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteProjectMutation.mutate(selectedProject.id, {
                            onSuccess: () => {
                                const remaining = projectsList.filter(p => p.id !== selectedProject.id);
                                setSelectedProject(remaining.length > 0 ? remaining[0] : null);
                                setShowProjectDropdown(false);
                                refetchProjects();
                            }
                        });
                    }
                }
            ]
        );
    }, [selectedProject, projectsList, deleteProjectMutation, refetchProjects]);

    // Handle add task from section header
    const handleAddTaskFromSection = useCallback((sectionId: number) => {
        setSelectedSectionForTask(sectionId);
        setShowAddTask(true);
    }, []);

    // Submit rating
    const handleSubmitRating = useCallback(() => {
        if (!selectedTaskForRating) return;

        rateTaskMutation.mutate({
            task_id: selectedTaskForRating.id,
            rating: ratingValue,
            feedback: ratingFeedback.trim()
        }, {
            onSuccess: () => {
                setShowRating(false);
                setSelectedTaskForRating(null);
                refetchSections();
            }
        });
    }, [selectedTaskForRating, ratingValue, ratingFeedback, rateTaskMutation, refetchSections]);

    // Render section data for FlatList - Threaded View
    const renderListData = useMemo(() => {
        const data: Array<{ type: 'section' | 'task'; key: string; data: any; sectionId: number }> = [];

        // 1. Determine base tasks based on filterTab
        let tasksToShow = allTasks;
        if (filterTab === 'active') {
            tasksToShow = allTasks.filter(t => t.status !== 'Completed');
        } else if (filterTab === 'completed') {
            tasksToShow = allTasks.filter(t => t.status === 'Completed');
        }

        // 2. Iterate through sections to build threads
        sectionsList.forEach(section => {
            // Skip if section selected in filter and this is not it
            if (selectedSectionFilter !== null && filterTab === 'all' && section.id !== selectedSectionFilter) {
                return;
            }

            // Get tasks for this section
            const sectionTasks = tasksToShow.filter(t => t.section === section.id);

            // determine if we should show this section
            // Show if it has tasks OR if we are in 'all' view with no dropdown filter (to show empty sections)
            // But actually, for cleaner view, let's only show if tasks exist or if it's the specific filtered section
            const shouldShow = sectionTasks.length > 0 || (selectedSectionFilter === section.id);

            if (shouldShow) {
                // Add Section Header (The "Thread Starter")
                data.push({
                    type: 'section',
                    key: `section-${section.id}`,
                    data: {
                        title: section.section_name,
                        count: sectionTasks.length,
                        color: section.priority ? URGENCY_SECTIONS.find(u => u.key === 'today')?.color || theme.text : theme.text, // Default color or priority color
                        icon: 'layers-outline'
                    },
                    sectionId: section.id,
                });

                // Add Tasks (The "Replies") if expanded
                if (expandedSections.includes(section.id)) {
                    sectionTasks.forEach(task => {
                        data.push({
                            type: 'task',
                            key: `task-${task.id}`,
                            data: task,
                            sectionId: section.id,
                        });
                    });
                }
            }
        });

        return data;
    }, [allTasks, sectionsList, filterTab, expandedSections, selectedSectionFilter, theme]);

    // Render item for FlatList
    const renderItem = useCallback(({ item }: { item: typeof renderListData[0] }) => {
        if (item.type === 'section') {
            return (
                <UrgencySection
                    groupKey={'today'} // Dummy key to pass TS check, filtering guided by section logic
                    title={item.data.title}
                    count={item.data.count}
                    color={theme.primary}
                    icon={item.data.icon}
                    isExpanded={expandedSections.includes(item.sectionId)}
                    onToggle={() => toggleSection(item.sectionId)}
                    sectionId={item.sectionId}
                    onAddTask={handleAddTaskFromSection}
                />
            );
        }

        return (
            <View style={styles.threadedTaskContainer}>
                <View style={[styles.threadLine, { backgroundColor: theme.border }]} />
                <View style={{ flex: 1 }}>
                    <SwipeableTaskRow
                        task={item.data}
                        onComplete={handleCompleteTask}
                        onUncomplete={handleUncompleteTask}
                        onDelete={handleDeleteTask}
                        onPress={handleTaskPress}
                    />
                </View>
            </View>
        );
    }, [expandedSections, toggleSection, handleCompleteTask, handleUncompleteTask, handleDeleteTask, handleTaskPress, handleAddTaskFromSection, theme]);

    // Loading state
    if (projectsLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <ModuleHeader title="Task Tracker" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // Empty state - no projects
    if (projectsList.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <ModuleHeader title="Task Tracker" />
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={theme.textTertiary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No projects found
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            const createUrl = isTeamLead && teamMemberId
                                ? `/projects/create-project?teamMemberId=${teamMemberId}&teamMemberName=${encodeURIComponent(teamMemberName)}&isTeamLead=true`
                                : '/projects/create-project';
                            router.push(createUrl);
                        }}
                        style={[styles.createButton, { backgroundColor: theme.primary }]}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text style={styles.createButtonText}>Create Your First Project</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <ModuleHeader
                        title={isTeamLead && teamMemberName ? `${teamMemberName}'s Tasks` : "Task Tracker"}
                    />

                    <View style={styles.content}>
                        {/* Project Selector */}
                        <TouchableOpacity
                            onPress={() => setShowProjectDropdown(!showProjectDropdown)}
                            style={[styles.projectSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            {/* Project Avatar */}
                            {selectedProject && (
                                <View style={[styles.projectAvatar, { backgroundColor: getAvatarColor(selectedProject.project_name) }]}>
                                    <Text style={styles.projectAvatarText}>
                                        {getInitial(selectedProject.project_name)}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.projectInfo}>
                                <Text style={[styles.projectLabel, { color: theme.textSecondary }]}>PROJECT</Text>
                                <Text style={[styles.projectName, { color: theme.text }]} numberOfLines={1}>
                                    {selectedProject?.project_name || 'Select project'}
                                </Text>
                            </View>
                            <View style={styles.projectActions}>
                                {selectedProject && (
                                    <>
                                        <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation(); handleEditProject(); }}
                                            style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
                                        >
                                            <Ionicons name="pencil" size={14} color={theme.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation(); handleDeleteProject(); }}
                                            style={[styles.iconButton, { backgroundColor: theme.error + '20' }]}
                                        >
                                            <Ionicons name="trash-outline" size={14} color={theme.error} />
                                        </TouchableOpacity>
                                    </>
                                )}
                                {/* Add Project Button */}
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        const createUrl = isTeamLead && teamMemberId
                                            ? `/projects/create-project?teamMemberId=${teamMemberId}&teamMemberName=${encodeURIComponent(teamMemberName)}&isTeamLead=true`
                                            : '/projects/create-project';
                                        router.push(createUrl as any);
                                    }}
                                    style={[styles.addSectionButtonInline, { backgroundColor: theme.primary }]}
                                >
                                    <Ionicons name="add" size={16} color="#fff" />
                                </TouchableOpacity>
                                <Ionicons
                                    name={showProjectDropdown ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color={theme.primary}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Project Dropdown */}
                        {showProjectDropdown && (
                            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                                    {projectsList.map((project) => (
                                        <TouchableOpacity
                                            key={project.id}
                                            onPress={() => {
                                                setSelectedProject(project);
                                                setShowProjectDropdown(false);
                                            }}
                                            style={[
                                                styles.dropdownItem,
                                                { borderBottomColor: theme.border },
                                                selectedProject?.id === project.id && { backgroundColor: theme.primary + '15' }
                                            ]}
                                        >
                                            {/* Project Avatar in dropdown */}
                                            <View style={[styles.projectAvatarSmall, { backgroundColor: getAvatarColor(project.project_name) }]}>
                                                <Text style={styles.projectAvatarTextSmall}>
                                                    {getInitial(project.project_name)}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.dropdownItemText,
                                                { color: selectedProject?.id === project.id ? theme.primary : theme.text, flex: 1 }
                                            ]}>
                                                {project.project_name}
                                            </Text>
                                            {selectedProject?.id === project.id && (
                                                <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Filter Tabs */}
                        <View style={[styles.filterTabs, { backgroundColor: theme.surface }]}>
                            {(['active', 'completed', 'all'] as FilterTab[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setFilterTab(tab)}
                                    style={[
                                        styles.filterTab,
                                        filterTab === tab && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterTabText,
                                        { color: filterTab === tab ? theme.primary : theme.textSecondary }
                                    ]}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Text>
                                    <View style={[
                                        styles.filterBadge,
                                        { backgroundColor: filterTab === tab ? theme.primary : theme.border }
                                    ]}>
                                        <Text style={[
                                            styles.filterBadgeText,
                                            { color: filterTab === tab ? '#fff' : theme.textSecondary }
                                        ]}>
                                            {taskCounts[tab]}
                                        </Text>
                                    </View>
                                    {tab === 'active' && taskCounts.overdue > 0 && (
                                        <View style={styles.overdueIndicator} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Section Filter Dropdown (only for All tab) */}
                        {filterTab === 'all' && (
                            <View style={{ marginTop: spacing.sm }}>
                                <TouchableOpacity
                                    onPress={() => setShowSectionFilterDropdown(!showSectionFilterDropdown)}
                                    style={[styles.sectionFilter, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                                        <Ionicons name="filter-outline" size={16} color={theme.primary} />
                                        <Text style={[styles.sectionFilterText, { color: theme.text }]}>
                                            {selectedSectionFilter === null
                                                ? 'All Sections'
                                                : sectionsList.find(s => s.id === selectedSectionFilter)?.section_name || 'All Sections'}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                                        {/* Add Section Button */}
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                setShowAddSection(true);
                                            }}
                                            style={[styles.addSectionButtonInline, { backgroundColor: theme.primary }]}
                                        >
                                            <Ionicons name="add" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <Ionicons
                                            name={showSectionFilterDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={theme.textSecondary}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {showSectionFilterDropdown && (
                                    <View style={[styles.sectionFilterDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        {/* All Sections option */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedSectionFilter(null);
                                                setShowSectionFilterDropdown(false);
                                            }}
                                            style={[
                                                styles.sectionFilterItem,
                                                selectedSectionFilter === null && { backgroundColor: theme.primary + '15' }
                                            ]}
                                        >
                                            <Text style={{ color: selectedSectionFilter === null ? theme.primary : theme.text }}>
                                                All Sections
                                            </Text>
                                            {selectedSectionFilter === null && (
                                                <Ionicons name="checkmark" size={16} color={theme.primary} />
                                            )}
                                        </TouchableOpacity>

                                        {/* Section options (excluding Completed and Overdue) */}
                                        {sectionsList
                                            .filter(s => !['Completed', 'Overdue'].includes(s.section_name))
                                            .map((section) => (
                                                <TouchableOpacity
                                                    key={section.id}
                                                    onPress={() => {
                                                        setSelectedSectionFilter(section.id);
                                                        setShowSectionFilterDropdown(false);
                                                    }}
                                                    style={[
                                                        styles.sectionFilterItem,
                                                        selectedSectionFilter === section.id && { backgroundColor: theme.primary + '15' }
                                                    ]}
                                                >
                                                    <Text style={{ color: selectedSectionFilter === section.id ? theme.primary : theme.text }}>
                                                        {section.section_name}
                                                    </Text>
                                                    {selectedSectionFilter === section.id && (
                                                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Task List */}
                        <FlatList
                            data={renderListData}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.key}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[theme.primary]}
                                    tintColor={theme.primary}
                                />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyListContainer}>
                                    <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.textTertiary} />
                                    <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
                                        {filterTab === 'completed' ? 'No completed tasks' : 'No tasks yet'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>

                    {/* Add Section Modal */}
                    <Modal visible={showAddSection} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Section</Text>
                                <TextInput
                                    value={newSectionName}
                                    onChangeText={setNewSectionName}
                                    placeholder="Section name"
                                    placeholderTextColor={theme.textTertiary}
                                    autoFocus
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => { setShowAddSection(false); setNewSectionName(''); }}
                                        style={[styles.modalButton, { backgroundColor: theme.border }]}
                                    >
                                        <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleCreateSection}
                                        disabled={createSectionMutation.isPending}
                                        style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                    >
                                        <Text style={styles.modalButtonTextWhite}>
                                            {createSectionMutation.isPending ? 'Creating...' : 'Create'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Add/Edit Task Modal */}
                    <Modal visible={showAddTask} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '80%' }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>
                                    {editingTaskId ? 'Edit Task' : 'Add Task'}
                                </Text>

                                {/* Section Selector */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Section *</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowAddSection(true)}
                                        style={[styles.addSectionButtonInline, { backgroundColor: theme.primary }]}
                                    >
                                        <Ionicons name="add" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.sectionPickerContainer, { borderColor: theme.border }]}>
                                    {sectionsList.map((section) => (
                                        <TouchableOpacity
                                            key={section.id}
                                            onPress={() => setSelectedSectionForTask(section.id)}
                                            style={[
                                                styles.sectionChip,
                                                { backgroundColor: selectedSectionForTask === section.id ? theme.primary : theme.background }
                                            ]}
                                        >
                                            <Text style={{
                                                color: selectedSectionForTask === section.id ? '#fff' : theme.text,
                                                fontSize: typography.sizes.xs,
                                                fontWeight: '600'
                                            }}>
                                                {section.section_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput
                                    value={newTaskTitle}
                                    onChangeText={setNewTaskTitle}
                                    placeholder="Task title *"
                                    placeholderTextColor={theme.textTertiary}
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />

                                {/* Due Date */}
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={[styles.input, styles.dateInput, { backgroundColor: theme.background, borderColor: theme.border }]}
                                >
                                    <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                                    <Text style={{ color: newTaskDueDate ? theme.text : theme.textTertiary, marginLeft: 8 }}>
                                        {newTaskDueDate || 'Select due date (optional)'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Priority Dropdown */}
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Priority</Text>
                                <View style={{ zIndex: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                        style={[styles.dropdownButton, { borderColor: theme.border, backgroundColor: theme.background }]}
                                    >
                                        <Text style={{ color: newTaskPriority ? theme.text : theme.textTertiary }}>
                                            {newTaskPriority
                                                ? prioritiesList.find(p => p.id === newTaskPriority)?.level
                                                : 'Select Priority'}
                                        </Text>
                                        <Ionicons name={showPriorityDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {showPriorityDropdown && (
                                        <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
                                            {prioritiesList.map((priority) => (
                                                <TouchableOpacity
                                                    key={priority.id}
                                                    onPress={() => {
                                                        setNewTaskPriority(priority.id);
                                                        setShowPriorityDropdown(false);
                                                    }}
                                                    style={[styles.modalDropdownItem, { borderBottomColor: theme.border }]}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <View style={{
                                                            width: 8, height: 8, borderRadius: 4,
                                                            backgroundColor: priority.level === 'P1' ? '#EF4444' : priority.level === 'P2' ? '#F59E0B' : priority.level === 'P3' ? '#10B981' : '#3B82F6'
                                                        }} />
                                                        <Text style={{ color: theme.text }}>{priority.level}</Text>
                                                    </View>
                                                    {newTaskPriority === priority.id && (
                                                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <TextInput
                                    value={newTaskComments}
                                    onChangeText={setNewTaskComments}
                                    placeholder="Comments (optional)"
                                    placeholderTextColor={theme.textTertiary}
                                    multiline
                                    numberOfLines={2}
                                    style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowAddTask(false);
                                            setNewTaskTitle('');
                                            setNewTaskDueDate('');
                                            setNewTaskPriority(null);
                                            setNewTaskComments('');
                                            setSelectedSectionForTask(null);
                                        }}
                                        style={[styles.modalButton, { backgroundColor: theme.border }]}
                                    >
                                        <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleCreateOrUpdateTask}
                                        disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                                        style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                    >
                                        <Text style={styles.modalButtonTextWhite}>
                                            {editingTaskId
                                                ? (updateTaskMutation.isPending ? 'Updating...' : 'Update Task')
                                                : (createTaskMutation.isPending ? 'Creating...' : 'Create Task')
                                            }
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Date Picker Modal */}
                    <Modal visible={showDatePicker} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.calendarModal, { backgroundColor: theme.surface }]}>
                                <View style={styles.calendarHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Due Date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Ionicons name="close" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <Calendar
                                    selectedDate={newTaskDueDate ? new Date(newTaskDueDate) : new Date()}
                                    onSelectDate={(date: Date) => {
                                        setNewTaskDueDate(date.toISOString().split('T')[0]);
                                        setShowDatePicker(false);
                                    }}
                                    minDate={new Date()}
                                />
                                {/* Quick Date Buttons */}
                                <View style={styles.quickDates}>
                                    {[
                                        { label: 'Today', days: 0 },
                                        { label: 'Tomorrow', days: 1 },
                                        { label: 'Next Week', days: 7 },
                                    ].map(({ label, days }) => (
                                        <TouchableOpacity
                                            key={label}
                                            onPress={() => {
                                                const date = new Date();
                                                date.setDate(date.getDate() + days);
                                                setNewTaskDueDate(date.toISOString().split('T')[0]);
                                                setShowDatePicker(false);
                                            }}
                                            style={[styles.quickDateButton, { backgroundColor: theme.primary + '15' }]}
                                        >
                                            <Text style={[styles.quickDateText, { color: theme.primary }]}>{label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Edit Project Modal */}
                    <Modal visible={showEditProject} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Project</Text>
                                <TextInput
                                    value={editProjectName}
                                    onChangeText={setEditProjectName}
                                    placeholder="Project name *"
                                    placeholderTextColor={theme.textTertiary}
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />
                                <TextInput
                                    value={editProjectDescription}
                                    onChangeText={setEditProjectDescription}
                                    placeholder="Description (optional)"
                                    placeholderTextColor={theme.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                    style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => setShowEditProject(false)}
                                        style={[styles.modalButton, { backgroundColor: theme.border }]}
                                    >
                                        <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleUpdateProject}
                                        disabled={updateProjectMutation.isPending}
                                        style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                    >
                                        <Text style={styles.modalButtonTextWhite}>
                                            {updateProjectMutation.isPending ? 'Updating...' : 'Update'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Rating Modal */}
                    <Modal visible={showRating} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>
                                    {selectedTaskForRating?.user_rating ? 'Edit Rating' : 'Rate Task'}
                                </Text>
                                <Text style={[styles.taskTitleInModal, { color: theme.textSecondary }]} numberOfLines={2}>
                                    {selectedTaskForRating?.task_title}
                                </Text>

                                {/* Star Rating */}
                                <View style={styles.starsContainer}>
                                    {(['1', '2', '3', '4', '5'] as const).map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setRatingValue(star)}
                                            style={styles.starButton}
                                        >
                                            <Ionicons
                                                name={parseInt(star) <= parseInt(ratingValue) ? 'star' : 'star-outline'}
                                                size={36}
                                                color={theme.warning}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput
                                    value={ratingFeedback}
                                    onChangeText={setRatingFeedback}
                                    placeholder="Feedback (optional)"
                                    placeholderTextColor={theme.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                    style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                />

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => { setShowRating(false); setSelectedTaskForRating(null); }}
                                        style={[styles.modalButton, { backgroundColor: theme.border }]}
                                    >
                                        <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSubmitRating}
                                        disabled={rateTaskMutation.isPending}
                                        style={[styles.modalButton, { backgroundColor: theme.warning }]}
                                    >
                                        <Text style={styles.modalButtonTextWhite}>
                                            {rateTaskMutation.isPending ? 'Submitting...' : 'Submit'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Task Detail Modal */}
                    <TaskDetailModal
                        visible={showTaskDetail}
                        task={selectedTaskForDetail}
                        onClose={() => {
                            setShowTaskDetail(false);
                            setSelectedTaskForDetail(null);
                        }}
                        onComplete={(taskId) => {
                            handleCompleteTask(taskId);
                            setShowTaskDetail(false);
                        }}
                        onUncomplete={(taskId) => {
                            handleUncompleteTask(taskId);
                            setShowTaskDetail(false);
                        }}
                        onDelete={(taskId) => {
                            Alert.alert(
                                'Delete Task',
                                'Are you sure you want to delete this task?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: () => {
                                            handleDeleteTask(taskId);
                                            setShowTaskDetail(false);
                                            setSelectedTaskForDetail(null);
                                        }
                                    }
                                ]
                            );
                        }}
                        onRate={handleRateTask}
                        onSave={(taskId, data) => {
                            updateTaskMutation.mutate({
                                taskId,
                                ...data
                            });
                            setShowTaskDetail(false);
                            setSelectedTaskForDetail(null);
                        }}
                        canRate={!!canRateTasks}
                        userId={user?.id}
                        sections={sectionsList}
                        priorities={prioritiesList}
                    />
                </View>
            </Animated.View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: typography.sizes.lg,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    createButtonText: {
        color: '#fff',
        fontSize: typography.sizes.base,
        fontWeight: '600',
    },
    projectSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    projectAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    projectAvatarText: {
        color: '#FFFFFF',
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
    },
    projectAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    projectAvatarTextSmall: {
        color: '#FFFFFF',
        fontSize: typography.sizes.sm,
        fontWeight: 'bold',
    },
    projectInfo: {
        flex: 1,
    },
    projectLabel: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 2,
        color: '#666',
    },
    projectName: {
        fontSize: typography.sizes.base,
        fontWeight: '600',
    },
    projectActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconButton: {
        padding: 6,
        borderRadius: 8,
    },
    dropdown: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dropdownItemText: {
        fontSize: typography.sizes.sm,
        fontWeight: '500',
    },
    filterTabs: {
        flexDirection: 'row',
        borderRadius: borderRadius.lg,
        padding: 3,
        marginBottom: spacing.md,
        gap: 6,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 5,
    },
    filterTabText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
    },
    filterBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    overdueIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    emptyListContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyListText: {
        marginTop: spacing.md,
        fontSize: typography.sizes.base,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.sizes.base,
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    sectionChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    priorityChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    modalButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    modalButtonText: {
        fontWeight: '600',
    },
    modalButtonTextWhite: {
        color: '#fff',
        fontWeight: '600',
    },
    calendarModal: {
        width: '95%',
        maxWidth: 380,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    quickDates: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.sm,
    },
    quickDateButton: {
        flex: 1,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    quickDateText: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
    },
    taskTitleInModal: {
        fontSize: typography.sizes.sm,
        marginBottom: spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    starButton: {
        padding: spacing.xs,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        zIndex: 1000,
        marginTop: 4,
        padding: spacing.xs,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    modalDropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
    },
    sectionFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    sectionFilterText: {
        fontSize: typography.sizes.sm,
        fontWeight: '500',
    },
    sectionFilterDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: borderRadius.md,
        zIndex: 1000,
        marginTop: 4,
        maxHeight: 200,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    sectionFilterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    threadedTaskContainer: {
        flexDirection: 'row',
        paddingLeft: spacing.md,
    },
    threadLine: {
        width: 2,
        marginRight: spacing.sm,
        marginTop: -4, // Connect to section header
        marginBottom: 4,
        borderRadius: 1,
    },
    addSectionButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    addSectionButtonInline: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
