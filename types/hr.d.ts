// HR & Leave Management Type Definitions

// ============================================================================
// LEAVE MANAGEMENT
// ============================================================================

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Study Leave' | 'Optional Leave';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ShiftType = 'full_shift' | 'first_half' | 'second_half';

export interface Team {
  id: number;
  name: string;
  description: string;
  group: number;
  leader?: number;
  members: number[];
  created_at?: string;
}

export interface LeaveBalance {
  id: number;
  employee: number;
  employee_name?: string;
  employee_email?: string;
  year: number;

  // Leave type balances
  annual_leave_total: number;
  annual_leave_used: number;
  annual_leave_planned: number; // Approved future leaves

  sick_leave_total: number;
  sick_leave_used: number;
  sick_leave_planned: number;

  casual_leave_total: number;
  casual_leave_used: number;
  casual_leave_planned: number;

  study_leave_total: number;
  study_leave_used: number;
  study_leave_planned: number;

  optional_leave_total: number;
  optional_leave_used: number;
  optional_leave_planned: number;

  // Computed fields
  annual_leave_available?: number;
  sick_leave_available?: number;
  casual_leave_available?: number;
  study_leave_available?: number;
  optional_leave_available?: number;

  updated_at?: string;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_name?: string;
  employee_email?: string;
  employee_designation?: string;
  employee_department?: string;
  employee_photo?: string;

  leave_type: LeaveType;
  from_date: string; // ISO date string
  to_date: string; // ISO date string
  shift_type: ShiftType;
  shift_time?: string; // e.g., "09:00 AM - 06:00 PM"
  total_days: number; // Calculated working days
  dates?: string[]; // Array of specific dates
  reason: string;

  status: LeaveStatus;
  applied_date: string;

  // Approval workflow
  approved_by?: number;
  approved_by_name?: string;
  approved_date?: string;
  rejection_reason?: string;

  // Balance tracking
  balance_before?: number;
  balance_after?: number;

  // Documents
  documents?: LeaveDocument[];

  // Hierarchy
  reports_to?: number; // Team lead/Manager ID
  reports_to_name?: string;

  created_at?: string;
  updated_at?: string;
}

export interface LeaveDocument {
  id: number;
  leave_request: number;
  document: string; // URL to the file
  document_name?: string;
  document_type?: string; // e.g., 'medical_certificate', 'supporting_doc'
  uploaded_at: string;
}

export interface CreateLeaveRequest {
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  shift_type: ShiftType;
  reason: string;
  documents?: File[] | any[]; // File objects or URIs
  specific_dates?: string[]; // Array of ISO date strings for non-contiguous leaves
}

export interface UpdateLeaveRequest {
  leave_type?: LeaveType;
  from_date?: string;
  to_date?: string;
  shift_type?: ShiftType;
  reason?: string;
  status?: LeaveStatus;
  specific_dates?: string[]; // Array of ISO date strings
}

export interface LeaveApprovalRequest {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface LeaveFilters {
  status?: LeaveStatus;
  leave_type?: LeaveType;
  employee?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface LeaveStatistics {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  cancelled_requests: number;
  employees_on_leave_today: number;
  employees_on_leave_this_week: number;
  upcoming_leaves: number;

  // By type
  annual_leaves: number;
  sick_leaves: number;
  casual_leaves: number;
  study_leaves: number;
  optional_leaves: number;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string;
  is_optional: boolean;
  created_at?: string;
}

export interface CalendarLeave {
  id: number;
  user_name: string;
  user_id: number;
  leave_type: string;
  status: LeaveStatus;
  dates: string[];
  is_mine: boolean;
}

export interface TeamMemberLeave {
  employee_id: number;
  employee_name: string;
  employee_photo?: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  status: LeaveStatus;
}

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

export interface Employee {
  id: number;
  user_id?: number;
  employee_code?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  photo?: string;

  // Professional details
  designation: string;
  department: string;
  category: 'hr' | 'admin' | 'manager' | 'employee' | 'intern';

  // Hierarchy
  reports_to?: number; // Manager/Team lead ID
  reports_to_name?: string;
  team_id?: number;
  team_name?: string;

  // Employment details
  date_of_joining: string;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on_leave';

  // Shift details
  shift_start_time?: string;
  shift_end_time?: string;

  // Leave balance
  leave_balance?: LeaveBalance;

  created_at?: string;
  updated_at?: string;
}

export interface EmployeeFilters {
  department?: string;
  category?: string;
  status?: string;
  reports_to?: number;
  team_id?: number;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ============================================================================
// REIMBURSEMENT
// ============================================================================

export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'done';
export type ReimbursementType = 'Travel' | 'Medical' | 'Food' | 'Accommodation' | 'Other';

export interface ReimbursementPhoto {
  id: number;
  reimbursement_request: number;
  photo: string;
  description?: string;
  uploaded_at: string;
}

export interface ReimbursementStatusRecord {
  id: number;
  reimbursement_request: number;
  status: ReimbursementStatus;
  updated_by: number;
  updated_by_name?: string;
  updated_at: string;
  reason?: string;
}


export interface Expense {
  id: number;
  particulars: string;
  amount: number;
  details: string;
  payment_status: string; // 'paid' | 'not_paid' | 'partial_paid'
  mode_of_payment: string;
  payment_made_by: string;
  photo?: string; // URL
  bill_evidence: 'yes' | 'no';
  created_at: string;
  updated_at: string;
  date?: string;
  expense_date?: string;
  photos?: any[]; // ExpensePhoto[]
}

export interface Reimbursement {
  id: number;
  expense: Expense; // Backend now returns full object
  reimbursement_amount: number;
  details: string;
  supporting_documents?: string;
  requested_by: number;
  requested_by_name?: string;
  requested_by_email?: string;
  requested_by_photo?: string;
  submitted_at: string; // Used instead of created_at
  bill_evidence: 'yes' | 'no';
  photos?: ReimbursementPhoto[];
  latest_status?: ReimbursementStatusRecord;
  status?: ReimbursementStatus; // Computed from latest_status
}

export interface CreateReimbursementRequest {
  expense: number;
  reimbursement_amount: number;
  details: string;
  bill_evidence: 'yes' | 'no';
  supporting_documents?: File;
}

export interface ReimbursementFilters {
  status?: ReimbursementStatus;
  requested_by?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LeaveResponse extends PaginatedResponse<LeaveRequest> { }
export interface EmployeeResponse extends PaginatedResponse<Employee> { }
export interface HolidayResponse extends PaginatedResponse<Holiday> { }