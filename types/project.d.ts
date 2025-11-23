// Project Management & Task Tracker Types

export type TaskStatus = 'In Progress' | 'Completed';
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed';
export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export type UserRole = 'admin' | 'lead' | 'intern';

// Priority
export interface Priority {
  id: number;
  level: PriorityLevel;
  description: string;
}

// Task Project
export interface TaskProject {
  id: number;
  created_by: number;
  created_by_name: string;
  project_name: string;
  description: string;
  created_date: string;
  status: ProjectStatus;
  priority: number | null;
  priority_level: string | null;
  starred: boolean;
  sections_count: number;
  tasks_count: number;
}

// Task Section
export interface TaskSection {
  id: number;
  project: number;
  project_name: string;
  section_name: string;
  created_date: string;
  priority: number | null;
  priority_level: string | null;
  starred: boolean;
  tasks_count: number;
  tasks?: Task[];
}

// Task Rating
export interface TaskRating {
  id: number;
  rating_from: number;
  rating_from_name: string;
  rating_from_designation: string;
  rating_from_category: string;
  task: number;
  task_title: string;
  task_user: string;
  rating: '1' | '2' | '3' | '4' | '5';
  feedback: string;
  created_at: string;
}

// User Rating (for current user's rating on a task)
export interface UserRating {
  id: number;
  rating: string;
  feedback: string;
  created_at: string;
}

// Task
export interface Task {
  id: number;
  task_title: string;
  user: number;
  user_name: string;
  user_designation: string;
  section: number;
  section_name: string;
  project_name: string;
  project_id: number;
  completed_date: string | null;
  status: TaskStatus;
  priority: number | null;
  priority_level: string | null;
  starred: boolean;
  date_of_entry: string;
  due_date: string;
  comments: string;
  average_rating: number | null;
  rating_count: number;
  user_rating: UserRating | null;
}

// Task Statistics
export interface TaskStatistics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  average_rating: number | null;
  rated_tasks_count: number;
  user_role: UserRole;
}

// Department Overview (for leads/admin)
export interface DepartmentOverview {
  department_name: string;
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  average_rating: number;
}

// Create/Update DTOs
export interface CreateTaskDTO {
  task_title: string;
  section: number;
  due_date: string;
  priority?: number;
  comments?: string;
  starred?: boolean;
}

export interface UpdateTaskDTO {
  task_title?: string;
  section?: number;
  due_date?: string;
  priority?: number;
  comments?: string;
  starred?: boolean;
  status?: TaskStatus;
  completed_date?: string;
}

export interface CreateProjectDTO {
  project_name: string;
  description?: string;
  priority?: number;
  starred?: boolean;
  status?: ProjectStatus;
}

export interface UpdateProjectDTO {
  project_name?: string;
  description?: string;
  priority?: number;
  starred?: boolean;
  status?: ProjectStatus;
}

export interface CreateSectionDTO {
  project: number;
  section_name: string;
  priority?: number;
  starred?: boolean;
}

export interface UpdateSectionDTO {
  section_name?: string;
  priority?: number;
  starred?: boolean;
}

export interface CreateRatingDTO {
  task: number;
  rating: '1' | '2' | '3' | '4' | '5';
  feedback?: string;
}

export interface RateTaskDTO {
  task_id: number;
  rating: '1' | '2' | '3' | '4' | '5';
  feedback?: string;
}

// Filter types
export interface TaskFilters {
  status?: TaskStatus;
  project_id?: number;
  section_id?: number;
  priority?: number;
  starred?: boolean;
  user_id?: number;
  search?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  starred?: boolean;
  search?: string;
}
