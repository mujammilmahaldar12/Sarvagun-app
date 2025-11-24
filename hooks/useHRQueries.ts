/**
 * React Query hooks for HR & Leave Management
 * Provides data fetching, caching, and mutation hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import hrService from '../services/hr.service';
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveStatistics,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  LeaveApprovalRequest,
  LeaveFilters,
  Employee,
  EmployeeFilters,
  Holiday,
} from '../types/hr';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const hrQueryKeys = {
  all: ['hr'] as const,
  
  // Leaves
  leaves: () => [...hrQueryKeys.all, 'leaves'] as const,
  leavesList: (filters?: LeaveFilters) => [...hrQueryKeys.leaves(), 'list', filters] as const,
  leave: (id: number) => [...hrQueryKeys.leaves(), 'detail', id] as const,
  myLeaves: (filters?: LeaveFilters) => [...hrQueryKeys.leaves(), 'my', filters] as const,
  upcomingLeaves: () => [...hrQueryKeys.leaves(), 'upcoming'] as const,
  teamLeaves: (fromDate?: string, toDate?: string) => 
    [...hrQueryKeys.leaves(), 'team', { fromDate, toDate }] as const,
  
  // Leave Balance
  leaveBalance: (employeeId?: number) => 
    [...hrQueryKeys.all, 'balance', employeeId || 'me'] as const,
  
  // Statistics
  leaveStatistics: () => [...hrQueryKeys.all, 'statistics'] as const,
  
  // Employees
  employees: () => [...hrQueryKeys.all, 'employees'] as const,
  employeesList: (filters?: EmployeeFilters) => 
    [...hrQueryKeys.employees(), 'list', filters] as const,
  employee: (id: number) => [...hrQueryKeys.employees(), 'detail', id] as const,
  myProfile: () => [...hrQueryKeys.employees(), 'me'] as const,
  teamMembers: () => [...hrQueryKeys.employees(), 'team'] as const,
  
  // Holidays
  holidays: (year?: number) => [...hrQueryKeys.all, 'holidays', year] as const,
};

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export const hrCacheUtils = {
  invalidateLeaves: () => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
  },
  
  invalidateLeaveBalance: (employeeId?: number) => {
    const queryClient = useQueryClient();
    if (employeeId) {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance(employeeId) });
    } else {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance() });
    }
  },
  
  invalidateStatistics: () => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
  },
  
  invalidateEmployees: () => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: hrQueryKeys.employees() });
  },
};

// ============================================================================
// LEAVE QUERIES
// ============================================================================

/**
 * Get all leave requests with filters
 */
export const useLeaves = (filters?: LeaveFilters) => {
  return useQuery({
    queryKey: hrQueryKeys.leavesList(filters),
    queryFn: () => hrService.getLeaves(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get a single leave request
 */
export const useLeave = (id: number) => {
  return useQuery({
    queryKey: hrQueryKeys.leave(id),
    queryFn: () => hrService.getLeave(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get current user's leave requests
 */
export const useMyLeaves = (filters?: LeaveFilters) => {
  return useQuery({
    queryKey: hrQueryKeys.myLeaves(filters),
    queryFn: () => hrService.getMyLeaves(filters),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: false, // Disable until backend endpoint exists
  });
};

/**
 * Get upcoming approved leaves
 */
export const useUpcomingLeaves = () => {
  return useQuery({
    queryKey: hrQueryKeys.upcomingLeaves(),
    queryFn: () => hrService.getUpcomingLeaves(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get team members' leaves (for managers)
 */
export const useTeamLeaves = (fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: hrQueryKeys.teamLeaves(fromDate, toDate),
    queryFn: () => hrService.getTeamLeaves(fromDate, toDate),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get leave balance
 */
export const useLeaveBalance = (employeeId?: number) => {
  return useQuery({
    queryKey: hrQueryKeys.leaveBalance(employeeId),
    queryFn: () => hrService.getLeaveBalance(employeeId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get leave statistics
 */
export const useLeaveStatistics = () => {
  return useQuery({
    queryKey: hrQueryKeys.leaveStatistics(),
    queryFn: () => hrService.getLeaveStatistics(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: false, // Disable until backend endpoint exists
  });
};

// ============================================================================
// LEAVE MUTATIONS
// ============================================================================

/**
 * Create a new leave request
 */
export const useCreateLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => hrService.createLeave(data),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.upcomingLeaves() });
    },
  });
};

/**
 * Update an existing leave request
 */
export const useUpdateLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLeaveRequest }) =>
      hrService.updateLeave(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leave(data.id) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance() });
    },
  });
};

/**
 * Delete/Cancel a leave request
 */
export const useDeleteLeave = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => hrService.deleteLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
    },
  });
};

/**
 * Approve or reject a leave request
 */
export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveApprovalRequest }) =>
      hrService.updateLeaveStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leave(data.id) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance(data.employee) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.upcomingLeaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.teamLeaves() });
    },
  });
};

// ============================================================================
// EMPLOYEE QUERIES
// ============================================================================

/**
 * Get all employees with filters
 */
export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery({
    queryKey: hrQueryKeys.employeesList(filters),
    queryFn: () => hrService.getEmployees(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get a single employee
 */
export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: hrQueryKeys.employee(id),
    queryFn: () => hrService.getEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get current user's employee profile
 */
export const useMyProfile = () => {
  return useQuery({
    queryKey: hrQueryKeys.myProfile(),
    queryFn: () => hrService.getMyProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get team members (for managers)
 */
export const useTeamMembers = () => {
  return useQuery({
    queryKey: hrQueryKeys.teamMembers(),
    queryFn: () => hrService.getTeamMembers(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Update employee profile
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      hrService.updateEmployee(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.employees() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.employee(data.id) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.myProfile() });
    },
  });
};

// ============================================================================
// HOLIDAY QUERIES
// ============================================================================

/**
 * Get holidays for a specific year
 */
export const useHolidays = (year?: number) => {
  return useQuery({
    queryKey: hrQueryKeys.holidays(year),
    queryFn: () => hrService.getHolidays(year),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

/**
 * Check if a date is a holiday
 */
export const useIsHoliday = (date: string) => {
  return useQuery({
    queryKey: [...hrQueryKeys.holidays(), 'check', date],
    queryFn: () => hrService.isHoliday(date),
    enabled: !!date,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to prefetch leave data for better UX
 */
export const usePrefetchLeave = () => {
  const queryClient = useQueryClient();
  
  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: hrQueryKeys.leave(id),
      queryFn: () => hrService.getLeave(id),
      staleTime: 2 * 60 * 1000,
    });
  };
};

/**
 * Hook to get leave balance for a specific leave type
 */
export const useLeaveTypeBalance = (
  leaveType: 'annual' | 'sick' | 'casual' | 'study' | 'optional',
  employeeId?: number
) => {
  const { data: balance, ...rest } = useLeaveBalance(employeeId);
  
  if (!balance) return { ...rest, available: 0, total: 0, used: 0 };
  
  const typeKey = `${leaveType}_leave` as const;
  
  return {
    ...rest,
    available: balance[`${typeKey}_total`] - balance[`${typeKey}_used`] - (balance[`${typeKey}_planned`] || 0),
    total: balance[`${typeKey}_total`],
    used: balance[`${typeKey}_used`],
    planned: balance[`${typeKey}_planned`] || 0,
  };
};
