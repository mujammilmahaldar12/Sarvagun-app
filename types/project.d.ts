// Project Management Types

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo?: string;
  role: 'admin' | 'team_lead' | 'intern' | 'employee';
  designation?: string;
  team_lead_id?: number;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  created_by: User;
  assigned_to: User[]; // Interns assigned to this project
  team_lead: User;
  start_date: string;
  end_date?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  sections: ProjectSection[];
}

export interface ProjectSection {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  task_count?: number;
  completed_task_count?: number;
  due_date?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  section_id: number;
  title: string;
  description?: string;
  assigned_to: User;
  created_by: User;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  estimated_hours?: number;
  actual_hours?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  comments: TaskComment[];
  ratings: TaskRating[];
}

export interface TaskComment {
  id: number;
  task_id: number;
  user: User;
  comment: string;
  created_at: string;
}

export interface TaskRating {
  id: number;
  task_id: number;
  rated_by: User; // Team lead or admin
  rating: 1 | 2 | 3 | 4 | 5; // Star rating
  feedback?: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  user: User;
  team_lead: User;
  active_projects: Project[];
  total_tasks: number;
  completed_tasks: number;
  average_rating: number;
}

// API Request/Response Types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  assigned_to: number[]; // User IDs
  start_date: string;
  end_date?: string;
  priority: Project['priority'];
}

export interface CreateSectionRequest {
  project_id: number;
  title: string;
  description?: string;
}

export interface CreateTaskRequest {
  section_id: number;
  title: string;
  description?: string;
  assigned_to: number; // User ID
  due_date?: string;
  priority: Task['priority'];
  estimated_hours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: Task['priority'];
  status?: Task['status'];
  actual_hours?: number;
}

export interface RateTaskRequest {
  task_id: number;
  rating: TaskRating['rating'];
  feedback?: string;
}

// Filter and Sort Types
export interface ProjectFilters {
  status?: Project['status'][];
  priority?: Project['priority'][];
  assigned_to?: number[];
  search?: string;
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assigned_to?: number[];
  search?: string;
}

export type ProjectSortBy = 'created_at' | 'title' | 'priority' | 'progress' | 'due_date';
export type TaskSortBy = 'created_at' | 'title' | 'priority' | 'due_date' | 'status';

// Component Props Types
export interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  showActions?: boolean;
}

export interface SectionCardProps {
  section: ProjectSection;
  onPress?: (section: ProjectSection) => void;
  onAddTask?: (sectionId: number) => void;
  showActions?: boolean;
}

export interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onStatusChange?: (taskId: number, status: Task['status']) => void;
  onRate?: (taskId: number) => void;
  showRating?: boolean;
  isEditable?: boolean;
}

export interface TeamMemberSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMember: (member: TeamMember) => void;
  selectedMemberId?: number;
}

// Statistics Types
export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_tasks: number;
  total_team_members: number;
}

export interface UserStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  average_rating: number;
  total_hours: number;
}
