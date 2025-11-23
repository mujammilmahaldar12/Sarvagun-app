import api from './api';
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

class ProjectService {
  // ==================== Tasks ====================
  
  /**
   * Get tasks based on role-based filtering
   * - Intern: Only own tasks
   * - Lead: Own + department tasks
   * - Admin: All tasks
   */
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.project_id) params.append('project_id', filters.project_id.toString());
    if (filters?.section_id) params.append('section_id', filters.section_id.toString());
    if (filters?.priority) params.append('priority', filters.priority.toString());
    if (filters?.starred !== undefined) params.append('starred', filters.starred.toString());
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/project_management/tasks/?${queryString}` : '/project_management/tasks/';
    
    return api.get<Task[]>(url);
  }

  /**
   * Get only current user's tasks
   */
  async getMyTasks(): Promise<Task[]> {
    return api.get<Task[]>('/project_management/tasks/my_tasks/');
  }

  /**
   * Get department tasks (for leads/admin)
   */
  async getDepartmentTasks(): Promise<Task[]> {
    return api.get<Task[]>('/project_management/tasks/department_tasks/');
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return api.get<Task[]>(`/project_management/tasks/by_project/?project_id=${projectId}`);
  }

  /**
   * Get tasks by section
   */
  async getTasksBySection(sectionId: number): Promise<Task[]> {
    return api.get<Task[]>(`/project_management/tasks/by_section/?section_id=${sectionId}`);
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<TaskStatistics> {
    return api.get<TaskStatistics>('/project_management/tasks/statistics/');
  }

  /**
   * Get single task details
   */
  async getTask(taskId: number): Promise<Task> {
    return api.get<Task>(`/project_management/tasks/${taskId}/`);
  }

  /**
   * Create new task
   */
  async createTask(data: CreateTaskDTO): Promise<Task> {
    return api.post<Task>('/project_management/tasks/', data);
  }

  /**
   * Update existing task
   */
  async updateTask(taskId: number, data: UpdateTaskDTO): Promise<Task> {
    return api.patch<Task>(`/project_management/tasks/${taskId}/`, data);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: number): Promise<void> {
    return api.delete(`/project_management/tasks/${taskId}/`);
  }

  /**
   * Toggle task starred status
   */
  async toggleTaskStar(taskId: number, starred: boolean): Promise<Task> {
    return api.patch<Task>(`/project_management/tasks/${taskId}/`, { starred });
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId: number): Promise<Task> {
    return api.patch<Task>(`/project_management/tasks/${taskId}/`, {
      status: 'Completed',
      completed_date: new Date().toISOString(),
    });
  }

  // ==================== Task Ratings ====================

  /**
   * Get ratings for a task
   */
  async getTaskRatings(taskId: number): Promise<TaskRating[]> {
    return api.get<TaskRating[]>(`/project_management/task-ratings/?task=${taskId}`);
  }

  /**
   * Rate a task (for leads/admin)
   */
  async rateTask(data: RateTaskDTO): Promise<TaskRating> {
    return api.post<TaskRating>('/project_management/task-ratings/rate_task/', data);
  }

  /**
   * Update existing rating
   */
  async updateRating(ratingId: number, data: Partial<RateTaskDTO>): Promise<TaskRating> {
    return api.patch<TaskRating>(`/project_management/task-ratings/${ratingId}/`, data);
  }

  /**
   * Remove rating
   */
  async removeRating(ratingId: number): Promise<void> {
    return api.delete(`/project_management/task-ratings/${ratingId}/remove_rating/`);
  }

  // ==================== Projects ====================

  /**
   * Get projects based on role
   */
  async getProjects(filters?: ProjectFilters): Promise<TaskProject[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.starred !== undefined) params.append('starred', filters.starred.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/project_management/projects/?${queryString}` : '/project_management/projects/';
    
    return api.get<TaskProject[]>(url);
  }

  /**
   * Get only current user's projects
   */
  async getMyProjects(): Promise<TaskProject[]> {
    return api.get<TaskProject[]>('/project_management/projects/my_projects/');
  }

  /**
   * Get single project
   */
  async getProject(projectId: number): Promise<TaskProject> {
    return api.get<TaskProject>(`/project_management/projects/${projectId}/`);
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectDTO): Promise<TaskProject> {
    return api.post<TaskProject>('/project_management/projects/', data);
  }

  /**
   * Update project
   */
  async updateProject(projectId: number, data: UpdateProjectDTO): Promise<TaskProject> {
    return api.patch<TaskProject>(`/project_management/projects/${projectId}/`, data);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: number): Promise<void> {
    return api.delete(`/project_management/projects/${projectId}/`);
  }

  /**
   * Toggle project starred status
   */
  async toggleProjectStar(projectId: number, starred: boolean): Promise<TaskProject> {
    return api.patch<TaskProject>(`/project_management/projects/${projectId}/`, { starred });
  }

  // ==================== Sections ====================

  /**
   * Get sections by project
   */
  async getSectionsByProject(projectId: number): Promise<TaskSection[]> {
    return api.get<TaskSection[]>(`/project_management/sections/by_project/?project_id=${projectId}`);
  }

  /**
   * Get single section
   */
  async getSection(sectionId: number): Promise<TaskSection> {
    return api.get<TaskSection>(`/project_management/sections/${sectionId}/`);
  }

  /**
   * Create new section
   */
  async createSection(data: CreateSectionDTO): Promise<TaskSection> {
    return api.post<TaskSection>('/project_management/sections/', data);
  }

  /**
   * Update section
   */
  async updateSection(sectionId: number, data: UpdateSectionDTO): Promise<TaskSection> {
    return api.patch<TaskSection>(`/project_management/sections/${sectionId}/`, data);
  }

  /**
   * Delete section
   */
  async deleteSection(sectionId: number): Promise<void> {
    return api.delete(`/project_management/sections/${sectionId}/`);
  }

  // ==================== Priorities ====================

  /**
   * Get all priorities
   */
  async getPriorities(): Promise<Priority[]> {
    return api.get<Priority[]>('/project_management/priorities/');
  }
}

export default new ProjectService();
