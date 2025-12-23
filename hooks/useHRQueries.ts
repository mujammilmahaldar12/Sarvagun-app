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
  CalendarLeave,
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
  pendingLeaves: () => [...hrQueryKeys.leaves(), 'pending'] as const,
  calendarLeaves: (year: number, month: number) =>
    [...hrQueryKeys.leaves(), 'calendar', { year, month }] as const,
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
  teams: () => [...hrQueryKeys.all, 'teams'] as const,

  // Holidays
  holidays: (year?: number) => [...hrQueryKeys.all, 'holidays', year] as const,

  // Attendance
  attendance: () => [...hrQueryKeys.all, 'attendance'] as const,
  attendancePercentage: () => [...hrQueryKeys.attendance(), 'percentage'] as const,
  attendanceRecords: (fromDate?: string, toDate?: string) =>
    [...hrQueryKeys.attendance(), 'records', { fromDate, toDate }] as const,
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
export const useLeave = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: hrQueryKeys.leave(id),
    queryFn: () => hrService.getLeave(id),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
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
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get leaves for calendar view
 */
export const useCalendarLeaves = (year: number, month: number) => {
  return useQuery({
    queryKey: hrQueryKeys.calendarLeaves(year, month),
    queryFn: () => hrService.getCalendarLeaves(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get leave types
 */
export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ['leave_types'],
    queryFn: () => hrService.getLeaveTypes(),
    staleTime: Infinity, // Leave types rarely change
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
 * Get leave balances as array (for dedicated balance page)
 */
export const useLeaveBalancesList = () => {
  return useQuery({
    queryKey: [...hrQueryKeys.all, 'balance-list'] as const,
    queryFn: () => hrService.getLeaveBalancesList(),
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(hrQueryKeys.leavesList() as any);
      queryClient.invalidateQueries(hrQueryKeys.leave(id) as any);
      queryClient.invalidateQueries(hrQueryKeys.calendarLeaves(new Date().getFullYear(), new Date().getMonth()) as any);
      queryClient.invalidateQueries(['leave_balance'] as any);
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

/**
 * Get pending leave requests for approval (HR/Admin/Team Lead)
 */
export const usePendingLeaves = () => {
  return useQuery({
    queryKey: hrQueryKeys.pendingLeaves(),
    queryFn: () => hrService.getPendingLeaves(),
    staleTime: 30 * 1000, // 30 seconds - check often for new requests
  });
};

/**
 * Approve a leave request
 */
export const useApproveLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.approveLeave(id),
    onSuccess: () => {
      // Invalidate all leave-related queries
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalance() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.upcomingLeaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.pendingLeaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.teamLeaves() });
    },
  });
};

/**
 * Reject a leave request with optional reason
 */
export const useRejectLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      hrService.rejectLeave(id, reason),
    onSuccess: () => {
      // Invalidate all leave-related queries
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveStatistics() });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.pendingLeaves() });
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
 * Search employees by query string
 */
export const useSearchEmployees = (
  query: string,
  filters?: { category?: string; department?: string },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...hrQueryKeys.employees(), 'search', query, filters],
    queryFn: () => hrService.searchEmployees(query, filters),
    staleTime: 30 * 1000, // 30 seconds cache for search results
    enabled: enabled && query.length > 0,
  });
};

/**
 * Get all users with optional search
 */
export const useAllUsers = (params?: { search?: string; category?: string; department?: string }) => {
  return useQuery({
    queryKey: [...hrQueryKeys.employees(), 'all', params],
    queryFn: () => hrService.getAllUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
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
 * Get all teams
 */
export const useTeams = () => {
  return useQuery({
    queryKey: hrQueryKeys.teams(),
    queryFn: () => hrService.getTeams(),
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

// ============================================================================
// REIMBURSEMENT QUERIES
// ============================================================================

export const reimbursementQueryKeys = {
  all: ['reimbursements'] as const,
  list: (filters?: any) => [...reimbursementQueryKeys.all, 'list', filters] as const,
  detail: (id: number) => [...reimbursementQueryKeys.all, 'detail', id] as const,
  statistics: () => [...reimbursementQueryKeys.all, 'statistics'] as const,
};

/**
 * Get all reimbursement requests
 */
export const useReimbursements = (filters?: any) => {
  return useQuery({
    queryKey: reimbursementQueryKeys.list(filters),
    queryFn: () => hrService.getReimbursements(filters),
    staleTime: 0, // Always refetch for instant updates
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });
};

/**
 * Get a single reimbursement
 */
export const useReimbursement = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: reimbursementQueryKeys.detail(id),
    queryFn: () => hrService.getReimbursement(id),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get reimbursement statistics
 */
export const useReimbursementStatistics = () => {
  return useQuery({
    queryKey: reimbursementQueryKeys.statistics(),
    queryFn: () => hrService.getReimbursementStatistics(),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create a new reimbursement request
 */
export const useCreateReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.createReimbursement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementQueryKeys.all });
    },
  });
};

/**
 * Update reimbursement status (approve/reject/done)
 */
export const useUpdateReimbursementStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      hrService.updateReimbursementStatus(id, status, reason),
    onSuccess: () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({
        queryKey: reimbursementQueryKeys.all,
        refetchType: 'active' // Force refetch of active queries
      });
      queryClient.invalidateQueries({
        queryKey: reimbursementQueryKeys.statistics()
      });
    },
  });
};

/**
 * Delete a reimbursement request
 */
export const useDeleteReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.deleteReimbursement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementQueryKeys.all });
    },
  });
};

/**
 * Upload reimbursement photo
 */
export const useUploadReimbursementPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reimbursementId, photo }: { reimbursementId: number; photo: any }) =>
      hrService.uploadReimbursementPhoto(reimbursementId, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementQueryKeys.all });
    },
  });
};

// ============================================================================
// ATTENDANCE QUERIES
// ============================================================================

/**
 * Get attendance percentage for current user
 */
export const useAttendancePercentage = () => {
  return useQuery({
    queryKey: hrQueryKeys.attendancePercentage(),
    queryFn: () => hrService.getAttendancePercentage(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get detailed attendance records
 */
export const useMyAttendance = (fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: hrQueryKeys.attendanceRecords(fromDate, toDate),
    queryFn: () => hrService.getMyAttendance(fromDate, toDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!fromDate && !!toDate,
  });
};

// ============================================================================
// USER PROFILE DATA HOOKS
// ============================================================================

/**
 * Query keys for user profile data
 */
export const userProfileKeys = {
  all: ['userProfile'] as const,
  projects: (userId: string | number) => [...userProfileKeys.all, 'projects', userId] as const,
  skills: (userId: string | number) => [...userProfileKeys.all, 'skills', userId] as const,
  certifications: (userId: string | number) => [...userProfileKeys.all, 'certifications', userId] as const,
  performance: (userId: string | number) => [...userProfileKeys.all, 'performance', userId] as const,
  goals: (userId: string | number) => [...userProfileKeys.all, 'goals', userId] as const,
  activities: (userId: string | number) => [...userProfileKeys.all, 'activities', userId] as const,
};

/**
 * Get user's project contributions
 */
export const useUserProjects = (userId: string | number) => {
  return useQuery({
    queryKey: userProfileKeys.projects(userId),
    queryFn: () => hrService.getUserProjects(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's skills
 */
export const useUserSkills = (userId: string | number) => {
  return useQuery({
    queryKey: userProfileKeys.skills(userId),
    queryFn: () => hrService.getUserSkills(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's certifications
 */
export const useUserCertifications = (userId: string | number) => {
  return useQuery({
    queryKey: userProfileKeys.certifications(userId),
    queryFn: () => hrService.getUserCertifications(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's performance metrics
 */
export const useUserPerformance = (userId: string | number) => {
  return useQuery({
    queryKey: userProfileKeys.performance(userId),
    queryFn: () => hrService.getUserPerformance(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's goals/OKRs
 */
export const useUserGoals = (userId: string | number) => {
  return useQuery({
    queryKey: userProfileKeys.goals(userId),
    queryFn: () => hrService.getUserGoals(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's activity timeline
 */
export const useUserActivities = (userId: string | number, limit: number = 20) => {
  return useQuery({
    queryKey: userProfileKeys.activities(userId),
    queryFn: () => hrService.getUserActivities(userId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

// ============================================================================
// GOAL MUTATIONS
// ============================================================================

/**
 * Create a new goal
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalData: {
      title: string;
      description: string;
      category: string;
      targetDate: string;
      milestones?: any[];
    }) => hrService.createGoal(goalData),
    onSuccess: () => {
      // Invalidate all user goals queries
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'goals'] });
    },
  });
};

/**
 * Update an existing goal
 */
export const useUpdateGoal = (goalId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalData: {
      title?: string;
      description?: string;
      status?: string;
      progress?: number;
      milestones?: any[];
    }) => hrService.updateGoal(goalId, goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'goals'] });
    },
  });
};

/**
 * Delete a goal
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string | number) => hrService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'goals'] });
    },
  });
};

/**
 * Toggle milestone completion status
 */
export const useToggleMilestone = (goalId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) =>
      hrService.toggleMilestone(goalId, milestoneId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'goals'] });
    },
  });
};

// ============================================================================
// PROFILE DATA QUERIES
// ============================================================================

/**
 * Get user's education records
 */
export const useUserEducation = (userId?: number) => {
  return useQuery({
    queryKey: ['hr', 'user-profile', 'education', userId || 'me'],
    queryFn: () => hrService.getUserEducation(userId || 'me'),
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's work experience records
 */
export const useUserExperience = (userId?: number) => {
  return useQuery({
    queryKey: ['hr', 'user-profile', 'experience', userId || 'me'],
    queryFn: () => hrService.getUserExperience(userId || 'me'),
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Get user's social links
 */
export const useUserSocialLinks = (userId?: number) => {
  return useQuery({
    queryKey: ['hr', 'user-profile', 'social-links', userId || 'me'],
    queryFn: () => hrService.getUserSocialLinks(userId || 'me'),
    enabled: !!userId && userId !== 0,
    retry: false, // Don't retry on 404
  });
};

/**
 * Create education record
 */
export const useCreateEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.createEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'education'] });
    },
  });
};

/**
 * Update education record
 */
export const useUpdateEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hrService.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'education'] });
    },
  });
};

/**
 * Delete education record
 */
export const useDeleteEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'education'] });
    },
  });
};

/**
 * Create work experience record
 */
export const useCreateExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'experience'] });
    },
  });
};

/**
 * Update work experience record
 */
export const useUpdateExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hrService.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'experience'] });
    },
  });
};

/**
 * Delete work experience record
 */
export const useDeleteExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'experience'] });
    },
  });
};

/**
 * Update social links
 */
export const useUpdateSocialLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.updateSocialLinks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'social-links'] });
    },
  });
};

/**
 * Create skill
 */
export const useCreateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'skills'] });
    },
  });
};

/**
 * Update skill
 */
export const useUpdateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hrService.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'skills'] });
    },
  });
};

/**
 * Delete skill
 */
export const useDeleteSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'skills'] });
    },
  });
};

/**
 * Create certification
 */
export const useCreateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.createCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'certifications'] });
    },
  });
};

/**
 * Update certification
 */
export const useUpdateCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hrService.updateCertification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'certifications'] });
    },
  });
};

/**
 * Delete certification
 */
export const useDeleteCertification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hrService.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile', 'certifications'] });
    },
  });
};

/**
 * Get download URL for a certification
 * Returns the backend download URL that can be opened in browser/WebView
 */
export const useDownloadCertification = () => {
  return {
    getDownloadUrl: (certId: number) => hrService.downloadCertification(certId),
  };
};

/**
 * Upload resume for AI extraction
 */
export const useUploadResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => hrService.uploadResume(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'resume'] });
    },
  });
};

/**
 * Apply extracted resume data to profile
 */
export const useApplyResumeData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resume_id, apply_skills, apply_education, apply_experience, apply_certifications }: { resume_id: number; apply_skills?: boolean; apply_education?: boolean; apply_experience?: boolean; apply_certifications?: boolean }) =>
      hrService.applyResumeData(resume_id, {
        skills: apply_skills,
        education: apply_education,
        experience: apply_experience,
        certifications: apply_certifications,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'user-profile'] });
    },
  });
};
