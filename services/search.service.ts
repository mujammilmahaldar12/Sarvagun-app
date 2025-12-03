/**
 * Search Service
 * Handles global search across the application
 */

import api from './api';

export interface SearchPerson {
  id: string;
  name: string;
  email?: string;
  designation?: string;
  department?: string;
  avatar?: string | null;
  isOnline?: boolean;
}

export interface SearchProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  progress?: number;
  team_size?: number;
  start_date?: string;
  end_date?: string;
}

export interface SearchTask {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  project_name?: string;
  assigned_to?: string;
  due_date?: string;
}

export interface SearchDocument {
  id: string;
  name: string;
  type?: string;
  size?: number;
  uploaded_by?: string;
  uploaded_at?: string;
  module?: string;
}

export interface GlobalSearchResults {
  people: SearchPerson[];
  projects: SearchProject[];
  tasks: SearchTask[];
  documents: SearchDocument[];
  total_count: number;
}

export interface SearchFilters {
  category?: 'all' | 'people' | 'projects' | 'tasks' | 'documents';
  limit?: number;
}

class SearchService {
  /**
   * Perform global search across all categories
   * First tries dedicated endpoint, falls back to category-specific searches
   */
  async globalSearch(query: string, filters?: SearchFilters): Promise<GlobalSearchResults> {
    try {
      console.log('🔍 Performing global search:', query);
      
      const params: any = {
        q: query,
        limit: filters?.limit || 20,
      };
      
      if (filters?.category && filters.category !== 'all') {
        params.category = filters.category;
      }

      // Try dedicated global search endpoint first
      try {
        const response = await api.get<GlobalSearchResults>('/search/global/', { params });
        
        if (response) {
          // Handle different response formats
          if ((response as any).data) {
            console.log('✅ Global search results from API:', (response as any).data);
            return (response as any).data as GlobalSearchResults;
          }
          console.log('✅ Global search results:', response);
          return response;
        }
      } catch (error: any) {
        // If 404, endpoint doesn't exist - fall back to individual searches
        if (error.response?.status === 404) {
          console.log('⚠️ Global search endpoint not available, using fallback');
          return await this.fallbackSearch(query, filters);
        }
        throw error;
      }

      return {
        people: [],
        projects: [],
        tasks: [],
        documents: [],
        total_count: 0,
      };
    } catch (error) {
      console.log('❌ Global search error:', error);
      // Fall back to individual searches on any error
      return await this.fallbackSearch(query, filters);
    }
  }

  /**
   * Fallback search using individual category endpoints
   */
  private async fallbackSearch(query: string, filters?: SearchFilters): Promise<GlobalSearchResults> {
    console.log('📡 Using fallback search across categories');
    
    const results: GlobalSearchResults = {
      people: [],
      projects: [],
      tasks: [],
      documents: [],
      total_count: 0,
    };

    const category = filters?.category || 'all';
    const limit = filters?.limit || 20;

    // Search people
    if (category === 'all' || category === 'people') {
      try {
        const peopleResponse = await api.get<any[]>('/hr/users/', {
          params: { search: query, limit: Math.ceil(limit / 4) }
        });
        const people = Array.isArray(peopleResponse) ? peopleResponse : 
                      (peopleResponse as any)?.data || [];
        
        results.people = people.map((p: any) => ({
          id: p.id || p.user_id,
          name: p.full_name || p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          email: p.email,
          designation: p.designation || p.position,
          department: p.department,
          avatar: p.avatar || p.profile_picture,
          isOnline: p.is_online || false,
        }));
      } catch (e) {
        console.log('No people results');
      }
    }

    // Search projects
    if (category === 'all' || category === 'projects') {
      try {
        const projectsResponse = await api.get<any[]>('/project_management/projects/', {
          params: { search: query, limit: Math.ceil(limit / 4) }
        });
        const projects = Array.isArray(projectsResponse) ? projectsResponse : 
                        (projectsResponse as any)?.data || [];
        
        results.projects = projects.map((p: any) => ({
          id: p.id,
          name: p.name || p.title,
          description: p.description,
          status: p.status,
          progress: p.progress || 0,
          team_size: p.team_size || p.members?.length || 0,
          start_date: p.start_date,
          end_date: p.end_date || p.deadline,
        }));
      } catch (e) {
        console.log('No projects results');
      }
    }

    // Search tasks
    if (category === 'all' || category === 'tasks') {
      try {
        const tasksResponse = await api.get<any[]>('/project_management/tasks/', {
          params: { search: query, limit: Math.ceil(limit / 4) }
        });
        const tasks = Array.isArray(tasksResponse) ? tasksResponse : 
                     (tasksResponse as any)?.data || [];
        
        results.tasks = tasks.map((t: any) => ({
          id: t.id,
          title: t.title || t.name,
          description: t.description,
          status: t.status,
          priority: t.priority,
          project_name: t.project_name || t.project?.name,
          assigned_to: t.assigned_to_name || t.assigned_to?.name,
          due_date: t.due_date || t.deadline,
        }));
      } catch (e) {
        console.log('No tasks results');
      }
    }

    // Calculate total count
    results.total_count = 
      results.people.length + 
      results.projects.length + 
      results.tasks.length + 
      results.documents.length;

    console.log('✅ Fallback search results:', results.total_count);
    return results;
  }

  /**
   * Search only people
   */
  async searchPeople(query: string, limit: number = 10): Promise<SearchPerson[]> {
    const results = await this.globalSearch(query, { category: 'people', limit });
    return results.people;
  }

  /**
   * Search only projects
   */
  async searchProjects(query: string, limit: number = 10): Promise<SearchProject[]> {
    const results = await this.globalSearch(query, { category: 'projects', limit });
    return results.projects;
  }

  /**
   * Search only tasks
   */
  async searchTasks(query: string, limit: number = 10): Promise<SearchTask[]> {
    const results = await this.globalSearch(query, { category: 'tasks', limit });
    return results.tasks;
  }

  /**
   * Search only documents
   */
  async searchDocuments(query: string, limit: number = 10): Promise<SearchDocument[]> {
    const results = await this.globalSearch(query, { category: 'documents', limit });
    return results.documents;
  }
}

export default new SearchService();
