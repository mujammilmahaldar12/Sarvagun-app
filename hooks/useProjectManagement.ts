import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import type { TaskProject } from '@/types/project';
import {
    useMyProjects,
    useTeamMemberProjects,
    useUpdateProject,
    useDeleteProject,
} from '@/hooks/useProjectQueries';

interface UseProjectManagementProps {
    teamMemberId?: string;
    isTeamLead?: boolean;
}

interface UseProjectManagementReturn {
    // Project data
    projects: TaskProject[];
    projectsLoading: boolean;
    selectedProject: TaskProject | null;

    // Project selection
    setSelectedProject: (project: TaskProject | null) => void;
    showProjectDropdown: boolean;
    setShowProjectDropdown: (show: boolean) => void;

    // Project edit
    showEditProject: boolean;
    editProjectName: string;
    editProjectDescription: string;
    setShowEditProject: (show: boolean) => void;
    setEditProjectName: (name: string) => void;
    setEditProjectDescription: (desc: string) => void;
    openEditProject: (project: TaskProject) => void;
    handleUpdateProject: () => Promise<void>;

    // Project delete
    showDeleteProjectConfirm: boolean;
    projectToDelete: { id: number; name: string } | null;
    setShowDeleteProjectConfirm: (show: boolean) => void;
    setProjectToDelete: (project: { id: number; name: string } | null) => void;
    confirmDeleteProject: (project: { id: number; name: string }) => void;
    handleDeleteProject: () => Promise<void>;

    // Refetch
    refetchProjects: () => void;
}

/**
 * Custom hook to manage project operations
 * Handles project CRUD, selection, and team member context
 */
export function useProjectManagement({
    teamMemberId,
    isTeamLead = false,
}: UseProjectManagementProps = {}): UseProjectManagementReturn {

    // State
    const [selectedProject, setSelectedProject] = useState<TaskProject | null>(null);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    // Project edit
    const [showEditProject, setShowEditProject] = useState(false);
    const [editProjectName, setEditProjectName] = useState('');
    const [editProjectDescription, setEditProjectDescription] = useState('');

    // Project delete
    const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);

    // Data hooks
    const { data: myProjects, isLoading: myProjectsLoading, refetch: refetchMyProjects } = useMyProjects();
    const {
        data: teamMemberProjects,
        isLoading: teamMemberProjectsLoading,
        refetch: refetchTeamMemberProjects,
    } = useTeamMemberProjects(teamMemberId);

    // Mutations
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();

    // Compute which projects to use based on context
    const projects = isTeamLead && teamMemberId ? teamMemberProjects : myProjects;
    const projectsLoading = isTeamLead && teamMemberId ? teamMemberProjectsLoading : myProjectsLoading;
    const refetchProjects = isTeamLead && teamMemberId ? refetchTeamMem berProjects: refetchMyProjects;

    // Normalize data
    const projectsList = useMemo(() => {
        return Array.isArray(projects) ? projects : [];
    }, [projects]);

    // Auto-select first project (newest = highest ID)
    useEffect(() => {
        if (projectsList.length > 0 && !selectedProject) {
            const sortedProjects = [...projectsList].sort((a, b) => b.id - a.id);
            setSelectedProject(sortedProjects[0]);
        }
    }, [projectsList, selectedProject]);

    // Open edit project modal
    const openEditProject = (project: TaskProject) => {
        setEditProjectName(project.project_name);
        setEditProjectDescription(project.description || '');
        setShowEditProject(true);
    };

    // Update project
    const handleUpdateProject = async () => {
        if (!selectedProject) return;

        try {
            await updateProjectMutation.mutateAsync({
                id: selectedProject.id,
                data: {
                    project_name: editProjectName,
                    description: editProjectDescription,
                },
            });

            setShowEditProject(false);
            setEditProjectName('');
            setEditProjectDescription('');

            // Refetch to update UI
            refetchProjects();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to update project');
        }
    };

    // Confirm delete project
    const confirmDeleteProject = (project: { id: number; name: string }) => {
        setProjectToDelete(project);
        setShowDeleteProjectConfirm(true);
    };

    // Delete project
    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await deleteProjectMutation.mutateAsync(projectToDelete.id);

            setShowDeleteProjectConfirm(false);
            setProjectToDelete(null);

            // Clear selection if deleted project was selected
            if (selectedProject?.id === projectToDelete.id) {
                setSelectedProject(null);
            }

            // Refetch to update UI
            refetchProjects();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.detail || 'Failed to delete project');
        }
    };

    return {
        // Project data
        projects: projectsList,
        projectsLoading,
        selectedProject,

        // Project selection
        setSelectedProject,
        showProjectDropdown,
        setShowProjectDropdown,

        // Project edit
        showEditProject,
        editProjectName,
        editProjectDescription,
        setShowEditProject,
        setEditProjectName,
        setEditProjectDescription,
        openEditProject,
        handleUpdateProject,

        // Project delete
        showDeleteProjectConfirm,
        projectToDelete,
        setShowDeleteProjectConfirm,
        setProjectToDelete,
        confirmDeleteProject,
        handleDeleteProject,

        // Refetch
        refetchProjects,
    };
}
