/**
 * Dashboard React Query Hooks
 * Custom hooks for fetching dashboard data with caching and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dashboardService, { type DashboardData, type DashboardStats, type RecentActivity } from '@/services/dashboard.service';
import hrService from '@/services/hr.service';
import { useAuthStore } from '@/store/authStore';

/**
 * Query keys for dashboard data
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activities: (limit?: number) => [...dashboardKeys.all, 'activities', limit] as const,
  user: () => [...dashboardKeys.all, 'user'] as const,
};

/**
 * Hook to fetch complete dashboard data
 */
export function useDashboardData() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: () => dashboardService.getDashboardData(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getUserStats(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch recent activities
 */
export function useRecentActivities(limit: number = 10) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.activities(limit),
    queryFn: () => dashboardService.getRecentActivities(limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch current user profile
 */
export function useCurrentUser() {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.user(),
    queryFn: async () => {
      try {
        const profile = await hrService.getMyProfile();
        // Ensure we return a valid object
        if (!profile) {
          return user || { id: 0, full_name: '', email: '', category: '' };
        }
        return profile;
      } catch (error) {
        // If endpoint doesn't exist, return user from auth store
        console.warn('User profile endpoint not available, using auth store data');
        return user || { id: 0, full_name: '', email: '', category: '' };
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    // Always return user data even if query fails
    placeholderData: user || { id: 0, full_name: '', email: '', category: '' },
  });
}

/**
 * Hook to fetch leave balance
 */
export function useLeaveBalance() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['leave', 'balance'],
    queryFn: async () => {
      try {
        const balance = await hrService.getLeaveBalance();
        return balance;
      } catch (error) {
        console.warn('Leave balance not available:', error);
        return { casual: 0, sick: 0, earned: 0, total: 0 };
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch attendance percentage
 */
export function useAttendancePercentage() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['attendance', 'percentage'],
    queryFn: () => dashboardService.getAttendancePercentage(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch active projects count
 */
export function useActiveProjectsCount() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['projects', 'active', 'count'],
    queryFn: async () => {
      try {
        const count = await dashboardService.getActiveProjectsCount();
        return count;
      } catch (error) {
        console.warn('Projects endpoint not available');
        return 0;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch leaderboard with real-time project scores
 */
export function useLeaderboard(limit: number = 10) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'leaderboard', limit],
    queryFn: () => dashboardService.getLeaderboard(limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch intern leaderboard (individual rankings)
 */
export function useInternLeaderboard() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'intern-leaderboard'],
    queryFn: () => dashboardService.getInternLeaderboard(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch team leaderboard (aggregated by team)
 */
export function useTeamLeaderboard() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'team-leaderboard'],
    queryFn: () => dashboardService.getTeamLeaderboard(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch individual intern ranking
 */
export function useIndividualInternRanking(userId: number) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'intern-ranking', userId],
    queryFn: () => dashboardService.getIndividualInternRanking(userId),
    enabled: isAuthenticated && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch real-time activities from multiple sources
 */
export function useRealtimeActivities(limit: number = 10) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard', 'realtime-activities', limit],
    queryFn: () => dashboardService.getRecentActivitiesRealtime(limit),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

/**
 * Hook to refresh dashboard data
 * DISABLED: Backend endpoints not fully available
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Just invalidate queries without calling backend
      return Promise.resolve();
    },
    onSuccess: () => {
      // Invalidate all dashboard queries
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'intern-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'team-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'realtime-activities'] });
    },
  });
}
