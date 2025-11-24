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
      const response = await api.get<{ results: any[] }>('/leave_management/leave-types/');
      const data: any = response;
      return data?.results || data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch leave types:', error);
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
      console.log('✅ Leave created successfully:', response);
      return response;
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
      const response = await api.get<{ results: LeaveBalance[] }>('/leave_management/leave-balances/');
      // API interceptor returns data directly, so response is the data object
      const data: any = response;
      const results = data?.results || [];
      
      // Return first balance (current user's balance)
      if (results && results.length > 0) {
        return results[0];
      }
      throw new Error('No leave balance found');
    } catch (error) {
      console.warn('Leave balance not available:', error);
      // Return default balance
      return {
        id: 0,
        employee: 0,
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
      const response = await api.get<LeaveResponse>('/leave_management/leaves/my/', { params });
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // Fallback to hr/leaves/ endpoint filtered by user
        const response = await api.get<LeaveResponse>('/hr/leaves/', { params });
        return response.data;
      }
      throw error;
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
  // REIMBURSEMENT (for completeness)
  // ============================================================================

  /**
   * Get reimbursement requests
   */
  async getReimbursements(params?: any): Promise<Reimbursement[]> {
    const response = await api.get<{ results: Reimbursement[] }>('/hr/reimbursements/', {
      params,
    });
    return response.data.results;
  }

  /**
   * Create reimbursement request
   */
  async createReimbursement(data: Partial<Reimbursement>): Promise<Reimbursement> {
    const response = await api.post<Reimbursement>('/hr/reimbursements/', data);
    return response.data;
  }

  /**
   * Approve/reject reimbursement
   */
  async updateReimbursementStatus(
    id: number,
    status: string,
    reason?: string
  ): Promise<Reimbursement> {
    const response = await api.post<Reimbursement>(
      `/hr/reimbursements/${id}/update-status/`,
      { status, rejection_reason: reason }
    );
    return response.data;
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
}

// Export singleton instance
const hrService = new HRService();
export default hrService;
