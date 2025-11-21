import { 
  Project, 
  ProjectSection, 
  Task, 
  TeamMember, 
  CreateProjectRequest, 
  CreateSectionRequest, 
  CreateTaskRequest,
  UpdateTaskRequest,
  RateTaskRequest,
  ProjectFilters,
  TaskFilters,
  ProjectSortBy,
  TaskSortBy,
  ProjectStats,
  UserStats
} from '@/types/project';

class ProjectService {
  private baseUrl = '/api/projects';

  // Project Management
  async getProjects(filters?: ProjectFilters, sortBy?: ProjectSortBy): Promise<Project[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.priority?.length) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters?.assigned_to?.length) {
        params.append('assigned_to', filters.assigned_to.join(','));
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (sortBy) {
        params.append('sort_by', sortBy);
      }

      const response = await fetch(`${this.baseUrl}/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json() as Promise<Project[]>;
    } catch (error) {
      // Silently fall back to mock data for development
      console.log('Backend unavailable, using mock data for development');
      return this.getMockProjects();
    }
  }

  async getProject(projectId: number): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${projectId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    return response.json() as Promise<Project>;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        // Return mock created project if backend is not available
        return this.createMockProject(data);
      }
      return response.json() as Promise<Project>;
    } catch (error) {
      console.warn('Backend not available, creating mock project:', error);
      return this.createMockProject(data);
    }
  }

  async updateProject(projectId: number, data: Partial<CreateProjectRequest>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${projectId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    return response.json() as Promise<Project>;
  }

  async deleteProject(projectId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${projectId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  // Section Management
  async getSections(projectId: number): Promise<ProjectSection[]> {
    const response = await fetch(`${this.baseUrl}/${projectId}/sections/`);
    if (!response.ok) {
      throw new Error('Failed to fetch sections');
    }
    return response.json() as Promise<ProjectSection[]>;
  }

  async createSection(data: CreateSectionRequest): Promise<ProjectSection> {
    const response = await fetch(`${this.baseUrl}/${data.project_id}/sections/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create section');
    }
    return response.json() as Promise<ProjectSection>;
  }

  async updateSection(sectionId: number, data: Partial<CreateSectionRequest>): Promise<ProjectSection> {
    const response = await fetch(`/api/sections/${sectionId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update section');
    }
    return response.json() as Promise<ProjectSection>;
  }

  async deleteSection(sectionId: number): Promise<void> {
    const response = await fetch(`/api/sections/${sectionId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete section');
    }
  }

  // Task Management
  async getTasks(sectionId: number, filters?: TaskFilters, sortBy?: TaskSortBy): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filters?.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority?.length) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.assigned_to?.length) {
      params.append('assigned_to', filters.assigned_to.join(','));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (sortBy) {
      params.append('sort_by', sortBy);
    }

    const response = await fetch(`/api/sections/${sectionId}/tasks/?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json() as Promise<Task[]>;
  }

  async getTask(taskId: number): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    return response.json() as Promise<Task>;
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await fetch(`/api/sections/${data.section_id}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json() as Promise<Task>;
  }

  async updateTask(taskId: number, data: UpdateTaskRequest): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json() as Promise<Task>;
  }

  async deleteTask(taskId: number): Promise<void> {
    const response = await fetch(`/api/tasks/${taskId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  }

  // Task Rating
  async rateTask(data: RateTaskRequest): Promise<Task> {
    const response = await fetch(`/api/tasks/${data.task_id}/rate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to rate task');
    }
    return response.json() as Promise<Task>;
  }

  // Team Management
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await fetch('/api/team-members/');
    if (!response.ok) {
      throw new Error('Failed to fetch team members');
    }
    return response.json() as Promise<TeamMember[]>;
  }

  async getMemberProjects(memberId: number): Promise<Project[]> {
    const response = await fetch(`/api/team-members/${memberId}/projects/`);
    if (!response.ok) {
      throw new Error('Failed to fetch member projects');
    }
    return response.json() as Promise<Project[]>;
  }

  // Statistics
  async getProjectStats(): Promise<ProjectStats> {
    const response = await fetch('/api/projects/stats/');
    if (!response.ok) {
      throw new Error('Failed to fetch project stats');
    }
    return response.json() as Promise<ProjectStats>;
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const response = await fetch(`/api/users/${userId}/stats/`);
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    return response.json() as Promise<UserStats>;
  }

  // Bulk Operations
  async bulkUpdateTaskStatus(taskIds: number[], status: Task['status']): Promise<void> {
    const response = await fetch('/api/tasks/bulk-update-status/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_ids: taskIds, status }),
    });
    if (!response.ok) {
      throw new Error('Failed to bulk update task status');
    }
  }

  async duplicateProject(projectId: number, newTitle: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/${projectId}/duplicate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: newTitle }),
    });
    if (!response.ok) {
      throw new Error('Failed to duplicate project');
    }
    return response.json() as Promise<Project>;
  }

  // Export functionality
  async exportProject(projectId: number, format: 'excel' | 'pdf'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${projectId}/export/?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export project');
    }
    return response.blob() as Promise<Blob>;
  }

  // Mock data methods for development
  private getMockProjects(): Project[] {
    return [
      {
        id: 1,
        title: 'November Project',
        description: 'Sample project for November development cycle',
        start_date: '2024-11-01',
        end_date: '2024-11-30',
        priority: 'high',
        status: 'in_progress',
        team_lead: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          full_name: 'Admin User',
          role: 'admin'
        },
        progress_percentage: 65,
        created_by: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          full_name: 'Admin User',
          role: 'admin'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: [],
        sections: []
      },
      {
        id: 2,
        title: 'Hiring Portal Enhancement',
        description: 'Improve the hiring portal with new features and better UX',
        start_date: '2024-10-15',
        end_date: '2024-12-15',
        priority: 'medium',
        status: 'planning',
        team_lead: {
          id: 2,
          username: 'teamlead1',
          email: 'teamlead1@example.com',
          first_name: 'Sarah',
          last_name: 'Johnson',
          full_name: 'Sarah Johnson',
          role: 'team_lead'
        },
        progress_percentage: 15,
        created_by: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          full_name: 'Admin User',
          role: 'admin'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to: [],
        sections: []
      }
    ];
  }

  private createMockProject(data: CreateProjectRequest): Project {
    const mockId = Date.now();
    return {
      id: mockId,
      title: data.title,
      description: data.description || '',
      start_date: data.start_date,
      end_date: data.end_date || undefined,
      priority: data.priority,
      status: 'planning',
      created_by: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        role: 'admin'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_to: data.assigned_to?.map(id => ({
        id,
        username: `user${id}`,
        email: `user${id}@example.com`,
        first_name: 'User',
        last_name: `${id}`,
        full_name: `User ${id}`,
        role: 'intern' as const
      })) || [],
      team_lead: {
        id: 2,
        username: 'teamlead',
        email: 'teamlead@example.com',
        first_name: 'Team',
        last_name: 'Lead',
        full_name: 'Team Lead',
        role: 'team_lead'
      },
      progress_percentage: 0,
      sections: []
    };
  }

  private getMockSections(projectId: number): ProjectSection[] {
    return [
      {
        id: 1,
        project_id: projectId,
        title: 'Initial Setup',
        description: 'Project setup and configuration',
        status: 'in_progress',
        priority: 'high',
        order_index: 1,
        task_count: 5,
        completed_task_count: 2,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: []
      },
      {
        id: 2,
        project_id: projectId,
        title: 'Development Phase',
        description: 'Core development work',
        status: 'todo',
        priority: 'medium',
        order_index: 2,
        task_count: 8,
        completed_task_count: 0,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: []
      }
    ];
  }
}

export default new ProjectService();
