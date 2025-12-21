import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import type { Task, TaskSection } from '@/types/project';
import {
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    usePriorities,
} from '@/hooks/useProjectQueries';
import { groupTasksByUrgency, type GroupedTasks } from '@/utils/taskGrouping';

type FilterTab = 'active' | 'completed' | 'all';

interface UseTaskManagementProps {
    sections: TaskSection[];
}

interface UseTaskManagementReturn {
    // Task data
    allTasks: Task[];
    groupedTasks: GroupedTasks;
    filteredGroupedTasks: GroupedTasks;
    priorities: any[];

    // Filter  state
    filterTab: FilterTab;
    setFilterTab: (tab: FilterTab) => void;

    // Add/Edit task
    showAddTask: boolean;
    selectedSectionForTask: number | null;
    newTaskTitle: string;
    newTaskDueDate: string;
    newTaskPriority: number | null;
    newTaskComments: string;
    showDatePicker: boolean;
    showPriorityDropdown: boolean;
    editingTaskId: number | null;

    setShowAddTask: (show: boolean) => void;
    setSelectedSectionForTask: (sectionId: number | null) => void;
    setNewTaskTitle: (title: string) => void;
    setNewTaskDueDate: (date: string) => void;
    setNewTaskPriority: (priorityId: number | null) => void;
    setNewTaskComments: (comments: string) => void;
    setShowDatePicker: (show: boolean) => void;
    setShowPriorityDropdown: (show: boolean) => void;
    setEditingTaskId: (id: number | null) => void;

    openAddTask: (sectionId: number) => void;
    openEditTask: (task: Task) => void;
    handleCreateTask: () => Promise<void>;
    handleUpdateTask: () => Promise<void>;
    handleCompleteTask: (taskId: number) => Promise<void>;

    // Delete task
    showDeleteTaskConfirm: boolean;
    taskToDelete: number | null;
    setShowDeleteTaskConfirm: (show: boolean) => void;
    setTaskToDelete: (taskId: number | null) => void;
    confirmDeleteTask: (taskId: number) => void;
    handleDeleteTask: () => Promise<void>;

    // Task detail
    showTaskDetail: boolean;
    selectedTaskForDetail: Task | null;
    setShowTaskDetail: (show: boolean) => void;
    setSelectedTaskForDetail: (task: Task | null) => void;
    openTaskDetail: (task: Task) => void;

    // Refetch
    refetchSections: () => void;
}

/**
 * Custom hook to manage task operations
 * Handles task CRUD, filtering, grouping, and completion
 */
export function useTaskManagement({
    sections,
}: UseTaskManagementProps): UseTaskManagementReturn {

    // Filter state
    const [filterTab, setFilterTab] = useState<FilterTab>('active');

    // Add/Edit task
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedSectionForTask, setSelectedSectionForTask] = useState<number | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<number | null>(null);
    const [newTaskComments, setNewTaskComments] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

    // Delete task
    const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    // Task detail
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

    // Data hooks
    const { data: priorities } = usePriorities();
    const prioritiesList = Array.isArray(priorities) ? priorities : [];

    // Mutations
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();

    // Flatten all tasks from sections
    const allTasks = useMemo(() => {
        const tasks: Task[] = [];
        sections.forEach(section => {
            if (section.tasks) {
                const tasksWithSection = section.tasks.map(t => ({
                    ...t,
                    section_name: section.section_name,
                }));
                tasks.push(...tasksWithSection);
            }
        });
        return tasks;
    }, [sections]);

    // Group tasks by urgency
    const groupedTasks = useMemo(() => {
        return groupTasksByUrgency(allTasks);
    }, [allTasks]);

    // Filter tasks based on tab
    const filteredGroupedTasks = useMemo((): GroupedTasks => {
        if (filterTab === 'completed') {
            return {
                overdue: [],
                today: [],
                thisWeek: [],
                later: [],
                completed: groupedTasks.completed,
            };
        } else if (filterTab === 'active') {
            return {
                overdue: groupedTasks.overdue,
                today: groupedTasks.today,
                thisWeek: groupedTasks.thisWeek,
                later: groupedTasks.later,
                completed: [],
            };
        }
        return groupedTasks; // 'all'
    }, [filterTab, groupedTasks]);

    // Open add task modal
    const openAddTask = (sectionId: number) => {
        setSelectedSectionForTask(sectionId);
        setEditingTaskId(null);
        setNewTaskTitle('');
        setNewTaskDueDate('');
        setNewTaskPriority(null);
        setNewTaskComments('');
        setShowAddTask(true);
    };

    // Open edit task modal
    const openEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setSelectedSectionForTask(task.section);
        setNewTaskTitle(task.task_title);
        setNewTaskDueDate(task.due_date);
        setNewTaskPriority(task.priority || null);
        setNewTaskComments(task.comments);
        setShowAddTask(true);
    };

    // Create task
    const handleCreateTask = async () => {
        if (!selectedSectionForTask || !newTaskTitle.trim() || !newTaskDueDate) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        try {
            await createTaskMutation.mutateAsync({
                section: selectedSectionForTask,
                task_title: newTaskTitle,
                due_date: newTaskDueDate,
                priority: newTaskPriority,
                comments: newTaskComments,
            });

            setShowAddTask(false);
            setNewTaskTitle('');
            setNewTaskDueDate('');
            setNewTaskPriority(null);
            setNewTaskComments('');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to create task');
        }
    };

    // Update task
    const handleUpdateTask = async () => {
        if (!editingTaskId || !newTaskTitle.trim() || !newTaskDueDate) {
            Alert.alert('Validation Error', 'Please fill in all required fields');
            return;
        }

        try {
            await updateTaskMutation.mutateAsync({
                id: editingTaskId,
                data: {
                    task_title: newTaskTitle,
                    due_date: newTaskDueDate,
                    priority: newTaskPriority,
                    comments: newTaskComments,
                },
            });

            setShowAddTask(false);
            setEditingTaskId(null);
            setNewTaskTitle('');
            setNewTaskDueDate('');
            setNewTaskPriority(null);
            setNewTaskComments('');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to update task');
        }
    };

    // Complete task
    const handleCompleteTask = async (taskId: number) => {
        try {
            await updateTaskMutation.mutateAsync({
                id: taskId,
                data: {
                    status: 'Completed',
                    completed_date: new Date().toISOString(),
                },
            });
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to complete task');
        }
    };

    // Confirm delete task
    const confirmDeleteTask = (taskId: number) => {
        setTaskToDelete(taskId);
        setShowDeleteTaskConfirm(true);
    };

    // Delete task
    const handleDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            await deleteTaskMutation.mutateAsync(taskToDelete);
            setShowDeleteTaskConfirm(false);
            setTaskToDelete(null);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to delete task');
        }
    };

    // Open task detail
    const openTaskDetail = (task: Task) => {
        setSelectedTaskForDetail(task);
        setShowTaskDetail(true);
    };

    // Note: refetchSections is handled at parent level
    const refetchSections = () => {
        // This will be passed from parent
    };

    return {
        // Task data
        allTasks,
        groupedTasks,
        filteredGroupedTasks,
        priorities: prioritiesList,

        // Filter state
        filterTab,
        setFilterTab,

        // Add/Edit task
        showAddTask,
        selectedSectionForTask,
        newTaskTitle,
        newTaskDueDate,
        newTaskPriority,
        newTaskComments,
        showDatePicker,
        showPriorityDropdown,
        editingTaskId,

        setShowAddTask,
        setSelectedSectionForTask,
        setNewTaskTitle,
        setNewTaskDueDate,
        setNewTaskPriority,
        setNewTaskComments,
        setShowDatePicker,
        setShowPriorityDropdown,
        setEditingTaskId,

        openAddTask,
        openEditTask,
        handleCreateTask,
        handleUpdateTask,
        handleCompleteTask,

        // Delete task
        showDeleteTaskConfirm,
        taskToDelete,
        setShowDeleteTaskConfirm,
        setTaskToDelete,
        confirmDeleteTask,
        handleDeleteTask,

        // Task detail
        showTaskDetail,
        selectedTaskForDetail,
        setShowTaskDetail,
        setSelectedTaskForDetail,
        openTaskDetail,

        // Refetch
        refetchSections,
    };
}
