/**
 * HR & Leave Management Store
 * Zustand store for managing leave requests, employee data, and related state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import hrService from '../services/hr.service';
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveStatistics,
  CreateLeaveRequest,
  LeaveFilters,
  Employee,
  EmployeeFilters,
  Holiday,
  TeamMemberLeave,
} from '../types/hr';
import { useAuthStore } from './authStore';
import { usePermissionStore } from './permissionStore';

// ============================================================================
// STATE TYPES
// ============================================================================

interface LoadingState {
  leaves: boolean;
  leaveDetail: boolean;
  balance: boolean;
  statistics: boolean;
  employees: boolean;
  holidays: boolean;
  action: boolean;
}

interface ErrorState {
  leaves: string | null;
  leaveDetail: string | null;
  balance: string | null;
  statistics: string | null;
  employees: string | null;
  holidays: string | null;
  action: string | null;
}

interface CacheState {
  leaves: number;
  balance: number;
  statistics: number;
  employees: number;
  holidays: number;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface HRState {
  // Data
  leaves: LeaveRequest[];
  currentLeave: LeaveRequest | null;
  leaveBalance: LeaveBalance | null;
  statistics: LeaveStatistics | null;
  employees: Employee[];
  teamMembers: Employee[];
  holidays: Holiday[];
  teamLeaves: TeamMemberLeave[];
  upcomingLeaves: LeaveRequest[];
  
  // Pagination
  leavesPagination: {
    count: number;
    next: string | null;
    previous: string | null;
    currentPage: number;
  };
  
  // UI State
  loading: LoadingState;
  errors: ErrorState;
  filters: {
    leaves: LeaveFilters;
    employees: EmployeeFilters;
  };
  cache: CacheState;
  
  // Actions - Leave Management
  fetchLeaves: (filters?: LeaveFilters, refresh?: boolean) => Promise<void>;
  fetchLeave: (id: number) => Promise<void>;
  fetchMyLeaves: (filters?: LeaveFilters) => Promise<void>;
  fetchUpcomingLeaves: () => Promise<void>;
  fetchTeamLeaves: (fromDate?: string, toDate?: string) => Promise<void>;
  createLeave: (data: CreateLeaveRequest) => Promise<LeaveRequest>;
  updateLeave: (id: number, data: Partial<LeaveRequest>) => Promise<void>;
  deleteLeave: (id: number) => Promise<void>;
  approveLeave: (id: number) => Promise<void>;
  rejectLeave: (id: number, reason: string) => Promise<void>;
  
  // Actions - Leave Balance
  fetchLeaveBalance: (employeeId?: number, refresh?: boolean) => Promise<void>;
  
  // Actions - Statistics
  fetchStatistics: (refresh?: boolean) => Promise<void>;
  
  // Actions - Employee Management
  fetchEmployees: (filters?: EmployeeFilters, refresh?: boolean) => Promise<void>;
  fetchEmployee: (id: number) => Promise<Employee>;
  fetchTeamMembers: () => Promise<void>;
  updateEmployee: (id: number, data: Partial<Employee>) => Promise<void>;
  
  // Actions - Holidays
  fetchHolidays: (year?: number, refresh?: boolean) => Promise<void>;
  
  // Filters
  setLeaveFilters: (filters: Partial<LeaveFilters>) => void;
  setEmployeeFilters: (filters: Partial<EmployeeFilters>) => void;
  clearFilters: () => void;
  
  // Cache Management
  clearCache: (key?: keyof CacheState) => void;
  isStale: (key: keyof CacheState, maxAge?: number) => boolean;
  
  // Computed Getters
  getFilteredLeaves: () => LeaveRequest[];
  getMyLeaves: () => LeaveRequest[];
  getPendingApprovals: () => LeaveRequest[];
  getLeavesByStatus: (status: string) => LeaveRequest[];
  getLeavesByType: (type: string) => LeaveRequest[];
  
  // Reset
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialLoadingState: LoadingState = {
  leaves: false,
  leaveDetail: false,
  balance: false,
  statistics: false,
  employees: false,
  holidays: false,
  action: false,
};

const initialErrorState: ErrorState = {
  leaves: null,
  leaveDetail: null,
  balance: null,
  statistics: null,
  employees: null,
  holidays: null,
  action: null,
};

const initialCacheState: CacheState = {
  leaves: 0,
  balance: 0,
  statistics: 0,
  employees: 0,
  holidays: 0,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useHRStore = create<HRState>()(
  persist(
    (set, get) => ({
      // Initial data state
      leaves: [],
      currentLeave: null,
      leaveBalance: null,
      statistics: null,
      employees: [],
      teamMembers: [],
      holidays: [],
      teamLeaves: [],
      upcomingLeaves: [],
      
      leavesPagination: {
        count: 0,
        next: null,
        previous: null,
        currentPage: 1,
      },
      
      loading: initialLoadingState,
      errors: initialErrorState,
      filters: {
        leaves: {},
        employees: {},
      },
      cache: initialCacheState,

      // ========================================================================
      // LEAVE MANAGEMENT ACTIONS
      // ========================================================================

      fetchLeaves: async (filters?: LeaveFilters, refresh = false) => {
        const { cache, isStale } = get();
        
        // Check cache unless refresh requested
        if (!refresh && !isStale('leaves', 2 * 60 * 1000)) {
          return;
        }

        set({ loading: { ...get().loading, leaves: true }, errors: { ...get().errors, leaves: null } });

        try {
          const response = await hrService.getLeaves(filters);
          
          set({
            leaves: response.results,
            leavesPagination: {
              count: response.count,
              next: response.next,
              previous: response.previous,
              currentPage: filters?.page || 1,
            },
            loading: { ...get().loading, leaves: false },
            cache: { ...cache, leaves: Date.now() },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, leaves: false },
            errors: { ...get().errors, leaves: error.message || 'Failed to fetch leaves' },
          });
        }
      },

      fetchLeave: async (id: number) => {
        set({ loading: { ...get().loading, leaveDetail: true }, errors: { ...get().errors, leaveDetail: null } });

        try {
          const leave = await hrService.getLeave(id);
          set({
            currentLeave: leave,
            loading: { ...get().loading, leaveDetail: false },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, leaveDetail: false },
            errors: { ...get().errors, leaveDetail: error.message || 'Failed to fetch leave' },
          });
        }
      },

      fetchMyLeaves: async (filters?: LeaveFilters) => {
        set({ loading: { ...get().loading, leaves: true }, errors: { ...get().errors, leaves: null } });

        try {
          const response = await hrService.getMyLeaves(filters);
          set({
            leaves: response.results,
            leavesPagination: {
              count: response.count,
              next: response.next,
              previous: response.previous,
              currentPage: filters?.page || 1,
            },
            loading: { ...get().loading, leaves: false },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, leaves: false },
            errors: { ...get().errors, leaves: error.message || 'Failed to fetch leaves' },
          });
        }
      },

      fetchUpcomingLeaves: async () => {
        try {
          const leaves = await hrService.getUpcomingLeaves();
          set({ upcomingLeaves: leaves });
        } catch (error: any) {
          console.error('Failed to fetch upcoming leaves:', error);
        }
      },

      fetchTeamLeaves: async (fromDate?: string, toDate?: string) => {
        try {
          const teamLeaves = await hrService.getTeamLeaves(fromDate, toDate);
          set({ teamLeaves });
        } catch (error: any) {
          console.error('Failed to fetch team leaves:', error);
        }
      },

      createLeave: async (data: CreateLeaveRequest) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          const newLeave = await hrService.createLeave(data);
          
          // Add to leaves list
          set({
            leaves: [newLeave, ...get().leaves],
            loading: { ...get().loading, action: false },
          });
          
          // Refresh balance and statistics
          get().fetchLeaveBalance(undefined, true);
          get().fetchStatistics(true);
          
          return newLeave;
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to create leave' },
          });
          throw error;
        }
      },

      updateLeave: async (id: number, data: Partial<LeaveRequest>) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          const updatedLeave = await hrService.updateLeave(id, data);
          
          // Update in leaves list
          set({
            leaves: get().leaves.map(l => l.id === id ? updatedLeave : l),
            currentLeave: get().currentLeave?.id === id ? updatedLeave : get().currentLeave,
            loading: { ...get().loading, action: false },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to update leave' },
          });
          throw error;
        }
      },

      deleteLeave: async (id: number) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          await hrService.deleteLeave(id);
          
          // Remove from leaves list
          set({
            leaves: get().leaves.filter(l => l.id !== id),
            loading: { ...get().loading, action: false },
          });
          
          // Refresh balance and statistics
          get().fetchLeaveBalance(undefined, true);
          get().fetchStatistics(true);
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to delete leave' },
          });
          throw error;
        }
      },

      approveLeave: async (id: number) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          const updatedLeave = await hrService.updateLeaveStatus(id, { status: 'approved' });
          
          // Update in leaves list
          set({
            leaves: get().leaves.map(l => l.id === id ? updatedLeave : l),
            currentLeave: get().currentLeave?.id === id ? updatedLeave : get().currentLeave,
            loading: { ...get().loading, action: false },
          });
          
          // Refresh statistics
          get().fetchStatistics(true);
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to approve leave' },
          });
          throw error;
        }
      },

      rejectLeave: async (id: number, reason: string) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          const updatedLeave = await hrService.updateLeaveStatus(id, {
            status: 'rejected',
            rejection_reason: reason,
          });
          
          // Update in leaves list
          set({
            leaves: get().leaves.map(l => l.id === id ? updatedLeave : l),
            currentLeave: get().currentLeave?.id === id ? updatedLeave : get().currentLeave,
            loading: { ...get().loading, action: false },
          });
          
          // Refresh statistics
          get().fetchStatistics(true);
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to reject leave' },
          });
          throw error;
        }
      },

      // ========================================================================
      // LEAVE BALANCE ACTIONS
      // ========================================================================

      fetchLeaveBalance: async (employeeId?: number, refresh = false) => {
        const { cache, isStale } = get();
        
        if (!refresh && !isStale('balance', 5 * 60 * 1000)) {
          return;
        }

        set({ loading: { ...get().loading, balance: true }, errors: { ...get().errors, balance: null } });

        try {
          const balance = await hrService.getLeaveBalance(employeeId);
          set({
            leaveBalance: balance,
            loading: { ...get().loading, balance: false },
            cache: { ...cache, balance: Date.now() },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, balance: false },
            errors: { ...get().errors, balance: error.message || 'Failed to fetch balance' },
          });
        }
      },

      // ========================================================================
      // STATISTICS ACTIONS
      // ========================================================================

      fetchStatistics: async (refresh = false) => {
        const { cache, isStale } = get();
        
        if (!refresh && !isStale('statistics', 5 * 60 * 1000)) {
          return;
        }

        set({ loading: { ...get().loading, statistics: true }, errors: { ...get().errors, statistics: null } });

        try {
          const stats = await hrService.getLeaveStatistics();
          set({
            statistics: stats,
            loading: { ...get().loading, statistics: false },
            cache: { ...cache, statistics: Date.now() },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, statistics: false },
            errors: { ...get().errors, statistics: error.message || 'Failed to fetch statistics' },
          });
        }
      },

      // ========================================================================
      // EMPLOYEE ACTIONS
      // ========================================================================

      fetchEmployees: async (filters?: EmployeeFilters, refresh = false) => {
        const { cache, isStale } = get();
        
        if (!refresh && !isStale('employees', 5 * 60 * 1000)) {
          return;
        }

        set({ loading: { ...get().loading, employees: true }, errors: { ...get().errors, employees: null } });

        try {
          const response = await hrService.getEmployees(filters);
          set({
            employees: response.results,
            loading: { ...get().loading, employees: false },
            cache: { ...cache, employees: Date.now() },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, employees: false },
            errors: { ...get().errors, employees: error.message || 'Failed to fetch employees' },
          });
        }
      },

      fetchEmployee: async (id: number) => {
        try {
          const employee = await hrService.getEmployee(id);
          return employee;
        } catch (error: any) {
          throw error;
        }
      },

      fetchTeamMembers: async () => {
        try {
          const members = await hrService.getTeamMembers();
          set({ teamMembers: members });
        } catch (error: any) {
          console.error('Failed to fetch team members:', error);
        }
      },

      updateEmployee: async (id: number, data: Partial<Employee>) => {
        set({ loading: { ...get().loading, action: true }, errors: { ...get().errors, action: null } });

        try {
          const updatedEmployee = await hrService.updateEmployee(id, data);
          
          set({
            employees: get().employees.map(e => e.id === id ? updatedEmployee : e),
            loading: { ...get().loading, action: false },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, action: false },
            errors: { ...get().errors, action: error.message || 'Failed to update employee' },
          });
          throw error;
        }
      },

      // ========================================================================
      // HOLIDAY ACTIONS
      // ========================================================================

      fetchHolidays: async (year?: number, refresh = false) => {
        const { cache, isStale } = get();
        
        if (!refresh && !isStale('holidays', 24 * 60 * 60 * 1000)) {
          return;
        }

        set({ loading: { ...get().loading, holidays: true }, errors: { ...get().errors, holidays: null } });

        try {
          const holidays = await hrService.getHolidays(year);
          set({
            holidays,
            loading: { ...get().loading, holidays: false },
            cache: { ...cache, holidays: Date.now() },
          });
        } catch (error: any) {
          set({
            loading: { ...get().loading, holidays: false },
            errors: { ...get().errors, holidays: error.message || 'Failed to fetch holidays' },
          });
        }
      },

      // ========================================================================
      // FILTER ACTIONS
      // ========================================================================

      setLeaveFilters: (filters: Partial<LeaveFilters>) => {
        set({
          filters: {
            ...get().filters,
            leaves: { ...get().filters.leaves, ...filters },
          },
        });
      },

      setEmployeeFilters: (filters: Partial<EmployeeFilters>) => {
        set({
          filters: {
            ...get().filters,
            employees: { ...get().filters.employees, ...filters },
          },
        });
      },

      clearFilters: () => {
        set({
          filters: {
            leaves: {},
            employees: {},
          },
        });
      },

      // ========================================================================
      // CACHE MANAGEMENT
      // ========================================================================

      clearCache: (key?: keyof CacheState) => {
        if (key) {
          set({ cache: { ...get().cache, [key]: 0 } });
        } else {
          set({ cache: initialCacheState });
        }
      },

      isStale: (key: keyof CacheState, maxAge = 5 * 60 * 1000) => {
        const timestamp = get().cache[key];
        return !timestamp || Date.now() - timestamp > maxAge;
      },

      // ========================================================================
      // COMPUTED GETTERS
      // ========================================================================

      getFilteredLeaves: () => {
        const { leaves, filters } = get();
        const user = useAuthStore.getState().user;
        const permissions = usePermissionStore.getState();
        
        let filtered = [...leaves];
        
        // Role-based filtering
        if (!permissions.hasPermission('leave:view_all')) {
          if (permissions.hasPermission('leave:view_team')) {
            // Manager: show team leaves
            filtered = filtered.filter(l => 
              l.employee === user?.id || l.reports_to === user?.id
            );
          } else {
            // Employee/Intern: show only own leaves
            filtered = filtered.filter(l => l.employee === user?.id);
          }
        }
        
        // Apply filters
        if (filters.leaves.status) {
          filtered = filtered.filter(l => l.status === filters.leaves.status);
        }
        
        if (filters.leaves.leave_type) {
          filtered = filtered.filter(l => l.leave_type === filters.leaves.leave_type);
        }
        
        if (filters.leaves.search) {
          const search = filters.leaves.search.toLowerCase();
          filtered = filtered.filter(l =>
            l.employee_name?.toLowerCase().includes(search) ||
            l.reason?.toLowerCase().includes(search)
          );
        }
        
        return filtered;
      },

      getMyLeaves: () => {
        const { leaves } = get();
        const user = useAuthStore.getState().user;
        return leaves.filter(l => l.employee === user?.id);
      },

      getPendingApprovals: () => {
        const { leaves } = get();
        const user = useAuthStore.getState().user;
        const permissions = usePermissionStore.getState();
        
        if (!permissions.hasPermission('leave:approve')) {
          return [];
        }
        
        // Show pending leaves that report to current user
        return leaves.filter(l => 
          l.status === 'pending' && l.reports_to === user?.id
        );
      },

      getLeavesByStatus: (status: string) => {
        return get().leaves.filter(l => l.status === status);
      },

      getLeavesByType: (type: string) => {
        return get().leaves.filter(l => l.leave_type === type);
      },

      // ========================================================================
      // RESET
      // ========================================================================

      reset: () => {
        set({
          leaves: [],
          currentLeave: null,
          leaveBalance: null,
          statistics: null,
          employees: [],
          teamMembers: [],
          holidays: [],
          teamLeaves: [],
          upcomingLeaves: [],
          leavesPagination: {
            count: 0,
            next: null,
            previous: null,
            currentPage: 1,
          },
          loading: initialLoadingState,
          errors: initialErrorState,
          filters: {
            leaves: {},
            employees: {},
          },
          cache: initialCacheState,
        });
      },
    }),
    {
      name: 'sarvagun-hr-store',
      partialize: (state) => ({
        // Only persist essential data
        filters: state.filters,
        // Don't persist data, loading, or errors
      }),
    }
  )
);
