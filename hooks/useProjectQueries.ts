import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '@/services/project.service';
import type {
  Task,
  TaskProject,
  TaskSection,
  TaskRating,
  Priority,
  TaskStatistics,
  CreateTaskDTO,
  UpdateTaskDTO,
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateSectionDTO,
  UpdateSectionDTO,
  RateTaskDTO,
  TaskFilters,
  ProjectFilters,
} from '@/types/project';

// ==================== Query Keys ====================
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  myProjects: () => [...projectKeys.all, 'my'] as const,
};

export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (projectId: number) => [...sectionKeys.lists(), projectId] as const,
  details: () => [...sectionKeys.all, 'detail'] as const,
  detail: (id: number) => [...sectionKeys.details(), id] as const,
};

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  myTasks: () => [...taskKeys.all, 'my'] as const,
  departmentTasks: () => [...taskKeys.all, 'department'] as const,
  byProject: (projectId: number) => [...taskKeys.all, 'project', projectId] as const,
  bySection: (sectionId: number) => [...taskKeys.all, 'section', sectionId] as const,
  statistics: () => [...taskKeys.all, 'statistics'] as const,
};

export const ratingKeys = {
  all: ['task-ratings'] as const,
  lists: () => [...ratingKeys.all, 'list'] as const,
  list: (taskId: number) => [...ratingKeys.lists(), taskId] as const,
};

export const priorityKeys = {
  all: ['priorities'] as const,
};

// ==================== Task Queries ====================

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => projectService.getTasks(filters),
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: taskKeys.myTasks(),
    queryFn: () => projectService.getMyTasks(),
  });
}

export function useDepartmentTasks() {
  return useQuery({
    queryKey: taskKeys.departmentTasks(),
    queryFn: () => projectService.getDepartmentTasks(),
  });
}

export function useTasksByProject(projectId: number, enabled = true) {
  return useQuery({
    queryKey: taskKeys.byProject(projectId),
    queryFn: () => projectService.getTasksByProject(projectId),
    enabled,
  });
}

export function useTasksBySection(sectionId: number, enabled = true) {
  return useQuery({
    queryKey: taskKeys.bySection(sectionId),
    queryFn: () => projectService.getTasksBySection(sectionId),
    enabled,
  });
}

export function useTask(taskId: number, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => projectService.getTask(taskId),
    enabled,
  });
}

export function useTaskStatistics() {
  return useQuery({
    queryKey: taskKeys.statistics(),
    queryFn: () => projectService.getTaskStatistics(),
  });
}

// ==================== Task Mutations ====================

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDTO) => projectService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskDTO }) =>
      projectService.updateTask(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => projectService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
}

export function useToggleTaskStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, starred }: { taskId: number; starred: boolean }) =>
      projectService.toggleTaskStar(taskId, starred),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => projectService.completeTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
}

// ==================== Rating Queries & Mutations ====================

export function useTaskRatings(taskId: number, enabled = true) {
  return useQuery({
    queryKey: ratingKeys.list(taskId),
    queryFn: () => projectService.getTaskRatings(taskId),
    enabled,
  });
}

export function useRateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RateTaskDTO) => projectService.rateTask(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.list(variables.task_id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.task_id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
}

export function useUpdateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ratingId, data }: { ratingId: number; data: Partial<RateTaskDTO> }) =>
      projectService.updateRating(ratingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useRemoveRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ratingId: number) => projectService.removeRating(ratingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.statistics() });
    },
  });
}

// ==================== Project Queries ====================

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectService.getProjects(filters),
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: projectKeys.myProjects(),
    queryFn: () => projectService.getMyProjects(),
  });
}

export function useProject(projectId: number, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectService.getProject(projectId),
    enabled,
  });
}

// ==================== Project Mutations ====================

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: UpdateProjectDTO }) =>
      projectService.updateProject(projectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
    },
  });
}

export function useToggleProjectStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, starred }: { projectId: number; starred: boolean }) =>
      projectService.toggleProjectStar(projectId, starred),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// ==================== Section Queries ====================

export function useSectionsByProject(projectId: number, enabled = true) {
  return useQuery({
    queryKey: sectionKeys.list(projectId),
    queryFn: () => projectService.getSectionsByProject(projectId),
    enabled,
  });
}

export function useSection(sectionId: number, enabled = true) {
  return useQuery({
    queryKey: sectionKeys.detail(sectionId),
    queryFn: () => projectService.getSection(sectionId),
    enabled,
  });
}

// ==================== Section Mutations ====================

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionDTO) => projectService.createSection(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.list(variables.project) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.project) });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: number; data: UpdateSectionDTO }) =>
      projectService.updateSection(sectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.detail(variables.sectionId) });
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: number) => projectService.deleteSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// ==================== Priority Queries ====================

export function usePriorities() {
  return useQuery({
    queryKey: priorityKeys.all,
    queryFn: () => projectService.getPriorities(),
    staleTime: Infinity, // Priorities rarely change
  });
}
