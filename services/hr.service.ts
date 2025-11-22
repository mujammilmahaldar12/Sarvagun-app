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
   * Create a new leave request
   * Supports document upload (medical certificates, etc.)
   */
  async createLeave(data: CreateLeaveRequest): Promise<LeaveRequest> {
    const formData = new FormData();
    
    formData.append('leave_type', data.leave_type);
    formData.append('from_date', data.from_date);
    formData.append('to_date', data.to_date);
    formData.append('shift_type', data.shift_type);
    formData.append('reason', data.reason);

    // Add documents if provided
    if (data.documents && data.documents.length > 0) {
      data.documents.forEach((doc, index) => {
        formData.append(`documents[${index}]`, doc);
      });
    }

    const response = await api.post<LeaveRequest>('/hr/leaves/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Update an existing leave request (before approval)
   */
  async updateLeave(id: number, data: UpdateLeaveRequest): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(`/hr/leaves/${id}/`, data);
    return response.data;
  }

  /**
   * Delete/Cancel a leave request
   */
  async deleteLeave(id: number): Promise<void> {
    await api.delete(`/hr/leaves/${id}/`);
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
      `/hr/leaves/${id}/update-status/`,
      data
    );
    return response.data;
  }

  /**
   * Get leave balance for current user or specific employee
   * @param employeeId - If not provided, gets current user's balance
   */
  async getLeaveBalance(employeeId?: number): Promise<LeaveBalance> {
    const url = employeeId
      ? `/hr/leave-balance/${employeeId}/`
      : '/hr/leave-balance/me/';
    const response = await api.get<LeaveBalance>(url);
    return response.data;
  }

  /**
   * Get leave statistics (dashboard metrics)
   */
  async getLeaveStatistics(): Promise<LeaveStatistics> {
    const response = await api.get<LeaveStatistics>('/hr/leaves/statistics/');
    return response.data;
  }

  /**
   * Get team members who are on leave (for managers)
   */
  async getTeamLeaves(fromDate?: string, toDate?: string): Promise<TeamMemberLeave[]> {
    const params: any = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    
    const response = await api.get<TeamMemberLeave[]>('/hr/leaves/team/', { params });
    return response.data;
  }

  /**
   * Get current and upcoming leave requests
   */
  async getUpcomingLeaves(): Promise<LeaveRequest[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get<LeaveResponse>('/hr/leaves/', {
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
    const response = await api.get<LeaveResponse>('/hr/leaves/my/', { params });
    return response.data;
  }

  // ============================================================================
  // EMPLOYEE MANAGEMENT
  // ============================================================================

  /**
   * Get all employees with filters
   */
  async getEmployees(params?: EmployeeFilters): Promise<EmployeeResponse> {
    const response = await api.get<EmployeeResponse>('/hr/employees/', { params });
    return response.data;
  }

  /**
   * Get a single employee by ID
   */
  async getEmployee(id: number): Promise<Employee> {
    const response = await api.get<Employee>(`/hr/employees/${id}/`);
    return response.data;
  }

  /**
   * Get current user's employee profile
   */
  async getMyProfile(): Promise<Employee> {
    const response = await api.get<Employee>('/hr/employees/me/');
    return response.data;
  }

  /**
   * Get team members (for managers)
   */
  async getTeamMembers(): Promise<Employee[]> {
    const response = await api.get<EmployeeResponse>('/hr/employees/team/');
    return response.data.results;
  }

  /**
   * Update employee profile
   */
  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const response = await api.patch<Employee>(`/hr/employees/${id}/`, data);
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
