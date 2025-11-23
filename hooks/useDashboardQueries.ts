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
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: dashboardKeys.user(),
    queryFn: () => hrService.getMyProfile(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch leave balance
 */
export function useLeaveBalance() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['leave', 'balance'],
    queryFn: () => hrService.getLeaveBalance(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    queryFn: () => dashboardService.getActiveProjectsCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to refresh dashboard data
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardService.refresh(),
    onSuccess: () => {
      // Invalidate all dashboard queries
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
