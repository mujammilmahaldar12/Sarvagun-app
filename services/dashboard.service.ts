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
      const response: any = await api.get<DashboardStats>('/hr/users/stats/');
      return response.data || response;
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
      const response: any = await api.get<{ percentage: number }>('/hr/attendance/percentage/');
      return response?.percentage || response?.data?.percentage || 95;
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
   * Get leaderboard data from unified backend API (star-based ranking)
   */
  async getLeaderboard(
    limit: number = 10, 
    timeRange: 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'lastSixMonths' | 'thisYear' = 'thisMonth',
    filter: 'individual' | 'team' | 'leaders' = 'individual'
  ): Promise<any[]> {
    try {
      console.log(`🏆 Fetching ${filter} leaderboard for ${timeRange}...`);
      
      const response = await api.get('/project_management/leaderboard/', {
        params: { filter, time_range: timeRange, limit }
      });
      
      const data = response?.results || response || [];
      console.log('✅ Leaderboard fetched:', data.length, 'entries');
      return data;
    } catch (error) {
      console.log('❌ Leaderboard error:', error);
      return [];
    }
  }

  /**
   * Get recent activities from backend API
   * First tries dedicated endpoint, falls back to aggregation if not available
   */
  async getRecentActivitiesFromBackend(limit: number = 10): Promise<RecentActivity[]> {
    try {
      console.log('📡 Fetching activities from backend API...');
      // Try dedicated endpoint first
      const response = await api.get<RecentActivity[]>('/dashboard/activities/recent/', {
        params: { limit }
      });
      
      if (response && Array.isArray(response)) {
        console.log('✅ Activities from dedicated API:', response.length);
        return response;
      }
      
      // If response has data property
      if ((response as any)?.data && Array.isArray((response as any).data)) {
        console.log('✅ Activities from dedicated API:', (response as any).data.length);
        return (response as any).data;
      }
      
      // If endpoint doesn't exist, fall back to old aggregation method
      return await this.getRecentActivitiesRealtime(limit);
    } catch (error: any) {
      // If 404, endpoint doesn't exist yet - use fallback
      if (error.response?.status === 404) {
        console.log('⚠️ Activities API not available, using aggregation fallback');
        return await this.getRecentActivitiesRealtime(limit);
      }
      console.log('❌ Activities API error:', error);
      return [];
    }
  }

  /**
   * Get recent activities with real-time data (fallback method)
   */
  async getRecentActivitiesRealtime(limit: number = 10): Promise<RecentActivity[]> {
    try {
      console.log('📡 Fetching real-time activities (aggregation method)...');
      const activities: RecentActivity[] = [];
      
      // Fetch recent leave requests
      try {
        const leavesResponse = await api.get<any[]>('/hr/leaves/');
        let leaves = Array.isArray(leavesResponse) ? leavesResponse : 
                    (leavesResponse as any)?.data ? (leavesResponse as any).data : [];
        
        leaves.slice(0, 3).forEach((leave: any) => {
          // Ensure timestamp is ISO format or valid date string
          const timestamp = leave.created_at || leave.from_date || new Date().toISOString();
          activities.push({
            id: leave.id,
            type: 'leave',
            title: `${leave.leave_type || 'Leave'} Request`,
            description: `${leave.status || 'Pending'} - ${leave.from_date || ''} to ${leave.to_date || ''}`,
            timestamp: timestamp,
            related_id: leave.id,
          });
        });
      } catch (e) {
        console.log('No leaves data');
      }
      
      // Fetch recent project updates
      try {
        const projectsResponse = await api.get<any[]>('/project_management/projects/my_projects/');
        let projects = Array.isArray(projectsResponse) ? projectsResponse : 
                      (projectsResponse as any)?.data ? (projectsResponse as any).data : [];
        
        projects.slice(0, 3).forEach((project: any) => {
          const timestamp = project.updated_at || project.created_at || new Date().toISOString();
          activities.push({
            id: project.id,
            type: 'project',
            title: project.name || 'Unnamed Project',
            description: `Status: ${project.status || 'Active'} - Progress: ${project.progress || 0}%`,
            timestamp: timestamp,
            related_id: project.id,
          });
        });
      } catch (e) {
        console.log('No projects data');
      }
      
      // Fetch recent events
      try {
        const eventsResponse = await api.get<any[]>('/events/events/');
        let events = Array.isArray(eventsResponse) ? eventsResponse : 
                    (eventsResponse as any)?.data ? (eventsResponse as any).data : [];
        
        events.slice(0, 2).forEach((event: any) => {
          const timestamp = event.created_at || event.date || new Date().toISOString();
          activities.push({
            id: event.id,
            type: 'event',
            title: event.title || event.name || 'Event',
            description: `${event.event_type || 'Event'} - ${event.date || 'Upcoming'}`,
            timestamp: timestamp,
            related_id: event.id,
          });
        });
      } catch (e) {
        console.log('No events data');
      }
      
      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      console.log('✅ Real-time activities:', sortedActivities.length);
      return sortedActivities;
    } catch (error) {
      console.log('❌ Activities error:', error);
      return [];
    }
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    // This can be used to invalidate caches
    await this.getDashboardData();
  }

  /**
   * Get intern leaderboard (individual rankings)
   * Maps frontend time ranges to backend format
   */
  async getInternLeaderboard(timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<any[]> {
    try {
      console.log('🏆 Fetching intern leaderboard...');
      
      const timeRangeMap: Record<string, string> = {
        'daily': 'thisWeek',
        'weekly': 'thisWeek',
        'monthly': 'thisMonth',
        'yearly': 'thisYear'
      };
      
      const backendTimeRange = timeRange ? timeRangeMap[timeRange] : 'thisMonth';
      
      const params: any = { 
        filter: 'individual', 
        time_range: backendTimeRange,
        limit: 1000 
      };
      
      const response = await api.get<any>('/project_management/leaderboard/', { params });
      const data = response?.results || (Array.isArray(response) ? response : []);
      console.log('✅ Intern leaderboard fetched:', data.length, 'interns');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch intern leaderboard:', error);
      return [];
    }
  }

  /**
   * Get team leaderboard (aggregated by team)
   * Maps frontend time ranges to backend format
   */
  async getTeamLeaderboard(timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<any[]> {
    try {
      console.log('🏆 Fetching team leaderboard...');
      
      const timeRangeMap: Record<string, string> = {
        'daily': 'thisWeek',
        'weekly': 'thisWeek',
        'monthly': 'thisMonth',
        'yearly': 'thisYear'
      };
      
      const backendTimeRange = timeRange ? timeRangeMap[timeRange] : 'thisMonth';
      
      const params: any = { 
        filter: 'team', 
        time_range: backendTimeRange,
        limit: 1000 
      };
      
      const response = await api.get<any>('/project_management/leaderboard/', { params });
      const data = response?.results || (Array.isArray(response) ? response : []);
      console.log('✅ Team leaderboard fetched:', data.length, 'teams');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch team leaderboard:', error);
      return [];
    }
  }

  /**
   * Get leaders leaderboard (team leaders only)
   * Maps frontend time ranges to backend format
   */
  async getLeadersLeaderboard(timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<any[]> {
    try {
      console.log('👑 Fetching leaders leaderboard...');
      
      const timeRangeMap: Record<string, string> = {
        'daily': 'thisWeek',
        'weekly': 'thisWeek',
        'monthly': 'thisMonth',
        'yearly': 'thisYear'
      };
      
      const backendTimeRange = timeRange ? timeRangeMap[timeRange] : 'thisMonth';
      
      const params: any = { 
        filter: 'leaders', 
        time_range: backendTimeRange,
        limit: 1000 
      };
      
      const response = await api.get<any>('/project_management/leaderboard/', { params });
      const data = response?.results || (Array.isArray(response) ? response : []);
      console.log('✅ Leaders leaderboard fetched:', data.length, 'leaders');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch leaders leaderboard:', error);
      return [];
    }
  }

  /**
   * Get individual intern ranking (current user's rank)
   * Maps frontend time ranges to backend format
   */
  async getIndividualInternRanking(userId: number, timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<any | null> {
    try {
      console.log('🏆 Fetching my rank...');
      
      const timeRangeMap: Record<string, string> = {
        'daily': 'thisWeek',
        'weekly': 'thisWeek',
        'monthly': 'thisMonth',
        'yearly': 'thisYear'
      };
      
      const backendTimeRange = timeRange ? timeRangeMap[timeRange] : 'thisMonth';
      
      const params: any = {
        time_range: backendTimeRange
      };
      
      const response = await api.get<any>('/project_management/leaderboard/my-rank/', { params });
      console.log('✅ My rank fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch individual ranking:', error);
      return null;
    }
  }
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService;
