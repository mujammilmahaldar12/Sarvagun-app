/**
 * HR & Leave Management Service
 * Handles all API operations for leave management, employee management, and reimbursements
 */

import api from './api';
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveStatistics,
  CreateLeaveRequest,
  UpdateLeaveRequest,
  LeaveApprovalRequest,
  LeaveFilters,
  LeaveResponse,
  Employee,
  EmployeeFilters,
  EmployeeResponse,
  Holiday,
  HolidayResponse,
  Reimbursement,
  ReimbursementFilters,
  CreateReimbursementRequest,
  TeamMemberLeave,
} from '../types/hr';

class HRService {
  // ============================================================================
  // LEAVE MANAGEMENT
  // ============================================================================

  /**
   * Get all leave requests with optional filters
   * Role-based: 
   * - Admin/HR: All leaves
   * - Manager: Team leaves
   * - Employee/Intern: Own leaves only
   */
  async getLeaves(params?: LeaveFilters): Promise<LeaveResponse> {
    const response = await api.get<LeaveResponse>('/hr/leaves/', { params });
    return response.data;
  }

  /**
   * Get a single leave request by ID
   */
  async getLeave(id: number): Promise<LeaveRequest> {
    const response = await api.get<LeaveRequest>(`/hr/leaves/${id}/`);
    return response.data;
  }

  /**
   * Get leave types from backend
   */
  async getLeaveTypes(): Promise<any[]> {
    try {
      const response = await api.get('/leave_management/leave-types/');
      const data: any = response.data;
      console.log('📋 Leave types raw response:', data);
      
      // Handle different response formats
      // 1. If it's already an array (no pagination)
      if (Array.isArray(data)) {
        console.log('📋 Leave types (array format):', data);
        return data;
      }
      // 2. If it's paginated with results
      if (data?.results && Array.isArray(data.results)) {
        console.log('📋 Leave types (paginated format):', data.results);
        return data.results;
      }
      // 3. If data is an object without results, return empty
      console.warn('⚠️ Unexpected leave types format:', data);
      return [];
    } catch (error) {
      console.error('❌ Could not fetch leave types:', error);
      return [];
    }
  }

  /**
   * Get leave type ID by name
   */
  async getLeaveTypeId(leaveTypeName: string): Promise<number | null> {
    try {
      const leaveTypes = await this.getLeaveTypes();
      console.log('📋 Available leave types:', leaveTypes);
      
      // Try to find exact match
      const leaveType = leaveTypes.find((lt: any) => 
        lt.name === leaveTypeName || lt.leave_type === leaveTypeName
      );
      
      if (leaveType) {
        console.log(`✅ Found leave type ID for "${leaveTypeName}": ${leaveType.id}`);
        return leaveType.id;
      }
      
      console.warn(`⚠️ Leave type "${leaveTypeName}" not found in backend`);
      return null;
    } catch (error) {
      console.error('❌ Error getting leave type ID:', error);
      return null;
    }
  }

  /**
   * Create a new leave request
   * Supports document upload (medical certificates, etc.)
   */
  async createLeave(data: CreateLeaveRequest): Promise<LeaveRequest> {
    console.log('📤 Creating leave request:', data);
    
    // First, get the leave type ID
    const leaveTypeId = await this.getLeaveTypeId(data.leave_type);
    if (!leaveTypeId) {
      throw new Error(`Leave type "${data.leave_type}" not found. Please contact administrator.`);
    }
    
    // Get the user's leave balance to get the balance ID
    let leaveBalanceId: number | undefined;
    try {
      const balanceData = await this.getLeaveBalance();
      leaveBalanceId = balanceData.id;
      console.log('📊 Got leave balance ID:', leaveBalanceId);
    } catch (error) {
      console.warn('⚠️ Could not fetch leave balance, continuing without it');
    }
    
    // Generate leave_dates array from date range
    const leaveDates = [];
    const startDate = new Date(data.from_date);
    const endDate = new Date(data.to_date);
    
    // Create date entries for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      leaveDates.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        starttime: data.shift_type === 'second_half' ? '14:00:00' : '09:00:00',
        endtime: data.shift_type === 'first_half' ? '13:00:00' : '18:00:00',
        is_holiday: false,
        leave_comment: data.reason
      });
    }

    // Prepare payload matching backend serializer - use numeric leave_type ID
    const payload: any = {
      leave_type: leaveTypeId,  // ✅ Send as numeric ID, not string
      leave_dates: leaveDates,
      reason: data.reason,
    };
    
    // Add leave_balances if we have it
    if (leaveBalanceId) {
      payload.leave_balances = leaveBalanceId;
    }

    console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));

    // Try the enhanced-leaves endpoint (correct endpoint from backend URLs)
    try {
      const response = await api.post<LeaveRequest>('/leave_management/enhanced-leaves/', payload);
      console.log('✅ Leave created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Leave creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Update an existing leave request (before approval)
   */
  async updateLeave(id: number, data: UpdateLeaveRequest): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(`/leave_management/leaves/${id}/`, data);
    return response.data;
  }

  /**
   * Delete/Cancel a leave request
   */
  async deleteLeave(id: number): Promise<void> {
    await api.delete(`/leave_management/leaves/${id}/`);
  }

  /**
   * Approve or reject a leave request
   * Only for managers/HR with approve permission
   */
  async updateLeaveStatus(
    id: number,
    data: LeaveApprovalRequest
  ): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(
      `/leave_management/leaves/${id}/update-status/`,
      data
    );
    return response.data;
  }

  /**
   * Get leave balance for current user or specific employee
   * @param employeeId - If not provided, gets current user's balance
   */
  async getLeaveBalance(employeeId?: number): Promise<LeaveBalance> {
    try {
      // Try the new my_balance endpoint first
      const response = await api.get<any[]>('/leave_management/leave-balances/my_balance/');
      const balances: any = response.data;
      
      console.log('📊 Leave balances response:', balances);
      
      // Convert array of balances to summary format
      if (Array.isArray(balances) && balances.length > 0) {
        const summary: LeaveBalance = {
          id: balances[0]?.id || 0,
          employee: balances[0]?.user || 0,
          year: new Date().getFullYear(),
          annual_leave_total: 0,
          annual_leave_used: 0,
          annual_leave_planned: 0,
          sick_leave_total: 0,
          sick_leave_used: 0,
          sick_leave_planned: 0,
          casual_leave_total: 0,
          casual_leave_used: 0,
          casual_leave_planned: 0,
          study_leave_total: 0,
          study_leave_used: 0,
          study_leave_planned: 0,
          optional_leave_total: 0,
          optional_leave_used: 0,
          optional_leave_planned: 0,
          annual_leave_available: 0,
        };

        // Map each balance to the summary
        for (const balance of balances) {
          const typeName = balance.leave_type_name || balance.leave_type?.name || '';
          const typeKey = typeName.toLowerCase().replace(/\s+/g, '_');
          
          if (typeKey.includes('annual')) {
            summary.annual_leave_total = balance.total_allocated || 0;
            summary.annual_leave_used = balance.leave_takes || 0;
            summary.annual_leave_available = balance.remaining_leaves || (balance.total_allocated - balance.leave_takes) || 0;
          } else if (typeKey.includes('sick')) {
            summary.sick_leave_total = balance.total_allocated || 0;
            summary.sick_leave_used = balance.leave_takes || 0;
          } else if (typeKey.includes('casual')) {
            summary.casual_leave_total = balance.total_allocated || 0;
            summary.casual_leave_used = balance.leave_takes || 0;
          } else if (typeKey.includes('study')) {
            summary.study_leave_total = balance.total_allocated || 0;
            summary.study_leave_used = balance.leave_takes || 0;
          } else if (typeKey.includes('optional')) {
            summary.optional_leave_total = balance.total_allocated || 0;
            summary.optional_leave_used = balance.leave_takes || 0;
          }
        }

        return summary;
      }
      throw new Error('No leave balance found');
    } catch (error) {
      console.warn('Leave balance not available:', error);
      // Return default balance
      return {
        id: 0,
        employee: 0,
        year: new Date().getFullYear(),
        annual_leave_total: 12,
        annual_leave_used: 0,
        annual_leave_planned: 0,
        sick_leave_total: 6,
        sick_leave_used: 0,
        sick_leave_planned: 0,
        casual_leave_total: 6,
        casual_leave_used: 0,
        casual_leave_planned: 0,
        study_leave_total: 3,
        study_leave_used: 0,
        study_leave_planned: 0,
        optional_leave_total: 2,
        optional_leave_used: 0,
        optional_leave_planned: 0,
        annual_leave_available: 12,
      };
    }
  }

  /**
   * Get leave statistics (dashboard metrics)
   */
  async getLeaveStatistics(): Promise<LeaveStatistics> {
    const response = await api.get<LeaveStatistics>('/leave_management/statistics/');
    return response.data;
  }

  /**
   * Get team members who are on leave (for managers)
   */
  async getTeamLeaves(fromDate?: string, toDate?: string): Promise<TeamMemberLeave[]> {
    const params: any = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    
    const response = await api.get<TeamMemberLeave[]>('/leave_management/leaves/team/', { params });
    return response.data;
  }

  /**
   * Get current and upcoming leave requests
   */
  async getUpcomingLeaves(): Promise<LeaveRequest[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get<LeaveResponse>('/leave_management/leaves/', {
      params: {
        from_date: today,
        status: 'approved',
        ordering: 'from_date',
      },
    });
    return response.data.results;
  }

  /**
   * Get my leave requests
   */
  async getMyLeaves(params?: LeaveFilters): Promise<LeaveResponse> {
    try {
      // Use the enhanced-leaves/my_leaves endpoint
      const response = await api.get<any[]>('/leave_management/enhanced-leaves/my_leaves/', { params });
      const leaves: any = response.data;
      
      console.log('📋 My leaves response:', leaves);
      
      // Transform to LeaveResponse format
      if (Array.isArray(leaves)) {
        return {
          count: leaves.length,
          results: leaves.map((leave: any) => ({
            id: leave.id,
            employee: leave.user,
            employee_name: leave.user_name,
            leave_type: leave.leave_type_name || leave.leave_type,
            from_date: leave.leave_dates?.[0]?.date,
            to_date: leave.leave_dates?.[leave.leave_dates?.length - 1]?.date,
            total_days: leave.num_days,
            status: leave.status,
            reason: leave.reason,
            created_at: leave.created_at,
            updated_at: leave.updated_at,
            approved_by: leave.approved_by,
            leave_dates: leave.leave_dates,
          })),
        };
      }
      
      return { count: 0, results: [] };
    } catch (error: any) {
      console.warn('Could not fetch my leaves:', error);
      // Return empty response
      return { count: 0, results: [] };
    }
  }

  // ============================================================================
  // EMPLOYEE MANAGEMENT
  // ============================================================================

  /**
   * Get all employees with filters
   */
  async getEmployees(params?: EmployeeFilters): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>('/hr/users/employees/', { params });
    return response.data;
  }

  /**
   * Search employees by name, email, designation, department
   * @param query - Search query string
   * @param filters - Additional filters (category, department)
   */
  async searchEmployees(query: string, filters?: { category?: string; department?: string }): Promise<{
    count: number;
    results: Employee[];
  }> {
    const params: any = { q: query };
    if (filters?.category) params.category = filters.category;
    if (filters?.department) params.department = filters.department;
    
    const response = await api.get<{ count: number; results: Employee[] }>('/hr/users/search/', { params });
    return response as any;
  }

  /**
   * Get all users with search support
   * @param search - Optional search string
   * @param category - Optional category filter (employee, intern, admin, etc.)
   */
  async getAllUsers(params?: { search?: string; category?: string; department?: string }): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/hr/users/', { params });
    // Handle paginated or direct response
    const data = response as any;
    return data?.results || data || [];
  }

  /**
   * Get a single employee by ID
   */
  async getEmployee(id: number): Promise<Employee> {
    const response = await api.get<Employee>(`/hr/users/${id}/`);
    return response.data;
  }

  /**
   * Get current user's employee profile
   */
  async getMyProfile(): Promise<Employee> {
    const response = await api.get<Employee>('/hr/auth/me/');
    // API interceptor returns data directly
    return response as any;
  }

  /**
   * Get team members (for managers)
   */
  async getTeamMembers(): Promise<Employee[]> {
    const response = await api.get<EmployeeResponse>('/hr/users/employees/');
    return response.data.results;
  }

  /**
   * Update employee profile
   */
  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const response = await api.patch<Employee>(`/hr/users/${id}/`, data);
    return response.data;
  }

  // ============================================================================
  // HOLIDAY CALENDAR
  // ============================================================================

  /**
   * Get holidays for a specific year
   */
  async getHolidays(year?: number): Promise<Holiday[]> {
    const currentYear = year || new Date().getFullYear();
    const response = await api.get<HolidayResponse>('/hr/holidays/', {
      params: { year: currentYear },
    });
    return response.data.results;
  }

  /**
   * Check if a date is a holiday
   */
  async isHoliday(date: string): Promise<boolean> {
    try {
      const response = await api.get<{ is_holiday: boolean }>('/hr/holidays/check/', {
        params: { date },
      });
      return response.data.is_holiday;
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // REIMBURSEMENT MANAGEMENT
  // ============================================================================

  /**
   * Get all reimbursement requests
   * Role-based:
   * - Admin/HR: All requests
   * - Others: Own requests only
   */
  async getReimbursements(params?: any): Promise<{ count: number; results: Reimbursement[] }> {
    try {
      const response = await api.get<{ results: Reimbursement[] }>('/finance_management/reimbursements/', {
        params,
      });
      const data: any = response.data;
      const results = data?.results || data || [];
      return {
        count: results.length,
        results: results.map((item: any) => ({
          ...item,
          status: item.latest_status?.status || 'pending',
          requested_by_name: item.requested_by_name || `User ${item.requested_by}`,
        })),
      };
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
      return { count: 0, results: [] };
    }
  }

  /**
   * Get a single reimbursement request
   */
  async getReimbursement(id: number): Promise<Reimbursement> {
    const response = await api.get<Reimbursement>(`/finance_management/reimbursements/${id}/`);
    const data: any = response.data;
    return {
      ...data,
      status: data.latest_status?.status || 'pending',
    };
  }

  /**
   * Create reimbursement request
   */
  async createReimbursement(data: any): Promise<Reimbursement> {
    const response = await api.post<Reimbursement>('/finance_management/reimbursements/', data);
    return response.data as any;
  }

  /**
   * Update reimbursement status (Approve/reject/done)
   * Only for HR/Admin
   */
  async updateReimbursementStatus(
    id: number,
    status: string,
    reason?: string
  ): Promise<Reimbursement> {
    const response = await api.post<Reimbursement>(
      `/finance_management/reimbursements/${id}/update-status/`,
      { status, reason }
    );
    return response as any;
  }

  /**
   * Upload reimbursement photo/document
   */
  async uploadReimbursementPhoto(reimbursementId: number, photo: any): Promise<any> {
    const formData = new FormData();
    formData.append('reimbursement_request', reimbursementId.toString());
    formData.append('photo', photo);
    
    const response = await api.post('/finance_management/reimbursement-photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  /**
   * Get reimbursement statistics
   */
  async getReimbursementStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    done: number;
    total_amount: number;
    pending_amount: number;
  }> {
    try {
      const { results } = await this.getReimbursements();
      
      const stats = {
        total: results.length,
        pending: results.filter(r => r.status === 'pending').length,
        approved: results.filter(r => r.status === 'approved').length,
        rejected: results.filter(r => r.status === 'rejected').length,
        done: results.filter(r => r.status === 'done').length,
        total_amount: results.reduce((sum, r) => sum + Number(r.reimbursement_amount || 0), 0),
        pending_amount: results.filter(r => r.status === 'pending')
          .reduce((sum, r) => sum + Number(r.reimbursement_amount || 0), 0),
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting reimbursement statistics:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        done: 0,
        total_amount: 0,
        pending_amount: 0,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  calculateWorkingDays(fromDate: string, toDate: string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let workingDays = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return workingDays;
  }

  /**
   * Format shift time range
   */
  formatShiftTime(shiftType: string): string {
    switch (shiftType) {
      case 'full_shift':
        return '09:00 AM - 06:00 PM';
      case 'first_half':
        return '09:00 AM - 01:00 PM';
      case 'second_half':
        return '02:00 PM - 06:00 PM';
      default:
        return '09:00 AM - 06:00 PM';
    }
  }

  // ============================================================================
  // ATTENDANCE MANAGEMENT
  // ============================================================================

  /**
   * Get attendance percentage for current user
   */
  async getAttendancePercentage(): Promise<{
    percentage: number;
    period: string;
    present_days: number;
    total_days: number;
    late_arrivals: number;
    early_departures: number;
  }> {
    try {
      const response = await api.get('/hr/attendance/my-percentage/');
      return response.data;
    } catch (error) {
      console.log('⚠️ Attendance API not available, using fallback');
      // Fallback for development
      return {
        percentage: 95,
        period: 'last_30_days',
        present_days: 27,
        total_days: 30,
        late_arrivals: 2,
        early_departures: 1,
      };
    }
  }

  /**
   * Get detailed attendance records
   */
  async getMyAttendance(fromDate?: string, toDate?: string): Promise<any[]> {
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const response = await api.get('/hr/attendance/my-attendance/', { params });
      return response.data;
    } catch (error) {
      console.log('⚠️ Attendance records API not available');
      return [];
    }
  }

  // ============================================================================
  // USER PROFILE DATA
  // ============================================================================

  /**
   * Get user's project contributions
   */
  async getUserProjects(userId: string | number): Promise<any[]> {
    try {
      console.log('📊 Fetching projects for user:', userId);
      const response = await api.get(`/hr/users/${userId}/projects/`);
      const data = Array.isArray(response) ? response : 
                   (response as any)?.data || [];
      console.log('✅ User projects:', data.length);
      return data;
    } catch (error: any) {
      // If 404, endpoint doesn't exist - return empty
      if (error.response?.status === 404) {
        console.log('⚠️ User projects API not available');
        return [];
      }
      console.log('❌ User projects error:', error);
      return [];
    }
  }

  /**
   * Get user's skills
   */
  async getUserSkills(userId: string | number): Promise<any[]> {
    try {
      console.log('🎯 Fetching skills for user:', userId);
      const response = await api.get(`/hr/users/${userId}/skills/`);
      const data = Array.isArray(response) ? response : 
                   (response as any)?.data || [];
      console.log('✅ User skills:', data.length);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ User skills API not available');
        return [];
      }
      console.log('❌ User skills error:', error);
      return [];
    }
  }

  /**
   * Get user's certifications
   */
  async getUserCertifications(userId: string | number): Promise<any[]> {
    try {
      console.log('🏆 Fetching certifications for user:', userId);
      const response = await api.get(`/hr/users/${userId}/certifications/`);
      const data = Array.isArray(response) ? response : 
                   (response as any)?.data || [];
      console.log('✅ User certifications:', data.length);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ User certifications API not available');
        return [];
      }
      console.log('❌ User certifications error:', error);
      return [];
    }
  }

  /**
   * Get user's performance metrics
   */
  async getUserPerformance(userId: string | number): Promise<any> {
    try {
      console.log('📈 Fetching performance for user:', userId);
      const response = await api.get(`/hr/users/${userId}/performance/`);
      const data = (response as any)?.data || response;
      console.log('✅ User performance:', data);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ User performance API not available');
        return null;
      }
      console.log('❌ User performance error:', error);
      return null;
    }
  }

  /**
   * Get user's goals/OKRs
   */
  async getUserGoals(userId: string | number): Promise<any[]> {
    try {
      console.log('🎯 Fetching goals for user:', userId);
      const response = await api.get(`/hr/users/${userId}/goals/`);
      const data = Array.isArray(response) ? response : 
                   (response as any)?.data || [];
      console.log('✅ User goals:', data.length);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ User goals API not available');
        return [];
      }
      console.log('❌ User goals error:', error);
      return [];
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(goalData: {
    title: string;
    description: string;
    category: string;
    targetDate: string;
    milestones?: any[];
  }): Promise<any> {
    try {
      console.log('➕ Creating goal:', goalData.title);
      const response = await api.post('/hr/goals/', goalData);
      console.log('✅ Goal created');
      return response;
    } catch (error: any) {
      console.log('❌ Create goal error:', error);
      throw error;
    }
  }

  /**
   * Update an existing goal
   */
  async updateGoal(goalId: string | number, goalData: {
    title?: string;
    description?: string;
    status?: string;
    progress?: number;
    milestones?: any[];
  }): Promise<any> {
    try {
      console.log('✏️ Updating goal:', goalId);
      const response = await api.patch(`/hr/goals/${goalId}/`, goalData);
      console.log('✅ Goal updated');
      return response;
    } catch (error: any) {
      console.log('❌ Update goal error:', error);
      throw error;
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string | number): Promise<void> {
    try {
      console.log('🗑️ Deleting goal:', goalId);
      await api.delete(`/hr/goals/${goalId}/`);
      console.log('✅ Goal deleted');
    } catch (error: any) {
      console.log('❌ Delete goal error:', error);
      throw error;
    }
  }

  /**
   * Toggle milestone completion
   */
  async toggleMilestone(goalId: string | number, milestoneId: string, completed: boolean): Promise<any> {
    try {
      console.log('🎯 Toggling milestone:', milestoneId, 'completed:', completed);
      const response = await api.patch(`/hr/goals/${goalId}/milestones/${milestoneId}/`, { completed });
      console.log('✅ Milestone updated');
      return response;
    } catch (error: any) {
      console.log('❌ Toggle milestone error:', error);
      throw error;
    }
  }

  /**
   * Get user's activity timeline
   */
  async getUserActivities(userId: string | number, limit: number = 20): Promise<any[]> {
    try {
      console.log('📅 Fetching activities for user:', userId);
      const response = await api.get(`/dashboard/activities/user/${userId}/`, {
        params: { limit }
      });
      const data = Array.isArray(response) ? response : 
                   (response as any)?.data || [];
      console.log('✅ User activities:', data.length);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ User activities API not available');
        return [];
      }
      console.log('❌ User activities error:', error);
      return [];
    }
  }
}

// Export singleton instance
const hrService = new HRService();
export default hrService;
