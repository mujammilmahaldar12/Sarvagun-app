/**
 * Dashboard Service
 * Handles all API operations for dashboard/home page data
 */

import api from './api';

export interface DashboardStats {
  attendance_percentage: number;
  leave_balance: number;
  active_projects: number;
  pending_tasks: number;
  total_leaves_taken: number;
  total_working_days: number;
}

export interface RecentActivity {
  id: number;
  type: 'leave' | 'task' | 'attendance' | 'event' | 'project' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  color?: string;
  related_id?: number;
}

export interface DashboardData {
  user: {
    id: number;
    full_name: string;
    email: string;
    designation: string;
    category: string;
    photo?: string;
  };
  stats: DashboardStats;
  recent_activities: RecentActivity[];
  notifications_count: number;
}

class DashboardService {
  /**
   * Get complete dashboard data
   * This combines user info, stats, and recent activities
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get<any>('/hr/auth/me/');
      
      // API interceptor returns data directly, so response is the user data
      const userData = response || {};
      
      return {
        user: {
          id: userData.id || 0,
          full_name: userData.full_name || userData.username || '',
          email: userData.email || '',
          designation: userData.designation || '',
          category: userData.category || '',
          photo: userData.photo,
        },
        stats: {
          attendance_percentage: 0,
          leave_balance: 0,
          active_projects: 0,
          pending_tasks: 0,
          total_leaves_taken: 0,
          total_working_days: 0,
        },
        recent_activities: [],
        notifications_count: 0,
      };
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      // Return default data instead of throwing
      return {
        user: {
          id: 0,
          full_name: 'User',
          email: '',
          designation: '',
          category: '',
        },
        stats: {
          attendance_percentage: 0,
          leave_balance: 0,
          active_projects: 0,
          pending_tasks: 0,
          total_leaves_taken: 0,
          total_working_days: 0,
        },
        recent_activities: [],
        notifications_count: 0,
      };
    }
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats(): Promise<DashboardStats> {
    try {
      // Try to fetch from a dedicated stats endpoint if it exists
      const response = await api.get<DashboardStats>('/hr/users/stats/');
      return response.data;
    } catch (error) {
      // If no dedicated endpoint, return default values
      console.warn('Stats endpoint not available, using defaults');
      return {
        attendance_percentage: 0,
        leave_balance: 0,
        active_projects: 0,
        pending_tasks: 0,
        total_leaves_taken: 0,
        total_working_days: 0,
      };
    }
  }

  /**
   * Get recent activities
   * This will aggregate recent leaves, tasks, etc.
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    // Activities endpoint doesn't exist in backend yet
    // Return empty array for now
    console.debug('Activities endpoint not implemented yet');
    return [];
  }

  /**
   * Get attendance percentage for current month
   */
  async getAttendancePercentage(): Promise<number> {
    try {
      const response = await api.get<{ percentage: number }>('/hr/attendance/percentage/');
      return response.data.percentage;
    } catch (error) {
      console.warn('Attendance endpoint not available');
      return 95; // Temporary default
    }
  }

  /**
   * Get active projects count
   */
  async getActiveProjectsCount(): Promise<number> {
    try {
      console.log('🔍 Dashboard Service: Fetching active projects count...');
      const response = await api.get<any[]>('/project_management/projects/my_projects/');
      console.log('📡 Dashboard Service: Projects response:', {
        response,
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!(response as any)?.data,
      });

      // Handle different response structures
      let projects;
      if (Array.isArray(response)) {
        projects = response;
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        projects = (response as any).data;
      } else {
        console.log('❌ Dashboard Service: Unexpected response structure');
        projects = [];
      }

      console.log('📊 Dashboard Service: Projects data:', {
        totalProjects: projects.length,
        projects: projects.slice(0, 2),
      });
      
      // Filter for active projects (not completed or on hold)
      const activeProjects = projects.filter((p: any) => 
        p.status !== 'Completed' && p.status !== 'On Hold'
      );
      
      console.log('✅ Dashboard Service: Active projects count:', activeProjects.length);
      return activeProjects.length;
    } catch (error) {
      console.log('❌ Dashboard Service: Projects endpoint error:', error);
      return 0;
    }
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    // This can be used to invalidate caches
    await this.getDashboardData();
  }
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService;
