// Finance Management Type Definitions
import { Event, Client } from './events';

// ============================================================================
// SALES TYPES
// ============================================================================

export interface SalesPayment {
  id: number;
  sale: number;
  payment_amount: number;
  payment_date: string; // ISO date format
  mode_of_payment: 'cash' | 'cheque' | 'upi' | 'bank_transfer';
  notes?: string;
}

export interface Sale {
  id: number;
  amount: number;
  discount: number;
  date: string; // ISO date format
  payment_status: 'completed' | 'pending' | 'not_yet';
  event: number | Event; // Can be ID or full object
  event_name?: string; // Populated by backend
  created_by: number;
  created_by_name?: string; // Populated by backend
  payments?: SalesPayment[]; // Nested payments
  total_received?: number; // Calculated field
  balance_due?: number; // Calculated field
}

export interface CreateSaleRequest {
  amount: number;
  discount?: number;
  date: string;
  payment_status: 'completed' | 'pending' | 'not_yet';
  event: number;
  payments?: Omit<SalesPayment, 'id' | 'sale'>[];
}

export interface UpdateSaleRequest extends Partial<CreateSaleRequest> {
  id: number;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export interface ExpensePhoto {
  id: number;
  expense: number;
  photo: string; // URL
  uploaded_at: string;
  description?: string;
}

export interface Expense {
  id: number;
  event?: number | Event; // Optional
  event_name?: string;
  vendor?: number | Vendor; // Optional
  vendor_name?: string;
  created_by: number;
  created_by_name?: string;
  particulars: string;
  booked_by?: string;
  paid_to?: string;
  details: string;
  amount: number;
  payment_status: 'paid' | 'not_paid' | 'partial_paid';
  mode_of_payment: 'Cash' | 'Credit Card' | 'Debit Card' | 'Cheque' | 'Bank Transfer' | 'Gpay' | 'Other';
  payment_made_by: string;
  photo?: string; // Legacy field
  date: string; // ISO date format
  expense_date: string; // ISO date format
  reimbursed: string;
  bill_evidence: 'yes' | 'no';
  bill_no?: string;
  created_at: string;
  updated_at: string;
  photos?: ExpensePhoto[]; // Multiple photos
}

export interface CreateExpenseRequest {
  event?: number;
  vendor?: number;
  particulars: string;
  booked_by?: string;
  paid_to?: string;
  details: string;
  amount: number;
  payment_status: 'paid' | 'not_paid' | 'partial_paid';
  mode_of_payment: 'Cash' | 'Credit Card' | 'Debit Card' | 'Cheque' | 'Bank Transfer' | 'Gpay' | 'Other';
  payment_made_by: string;
  date: string;
  expense_date: string;
  bill_evidence: 'yes' | 'no';
  bill_no?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: number;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface InvoiceItem {
  id: number;
  invoice: number;
  sr_no: number;
  particulars: string;
  quantity: string;
  amount: number;
}

export interface Invoice {
  id: number;
  invoice_number: string; // Auto-generated
  client: number | Client;
  client_name?: string;
  event?: number | Event;
  event_name?: string;
  date: string; // ISO date format
  total_amount: number;
  discount: number;
  final_amount: number;
  cgst?: string;
  sgst?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[]; // Line items
}

export interface CreateInvoiceRequest {
  client: number;
  event?: number;
  date: string;
  total_amount: number;
  discount?: number;
  final_amount: number;
  cgst?: string;
  sgst?: string;
  items: Omit<InvoiceItem, 'id' | 'invoice'>[];
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  id: number;
}

// ============================================================================
// VENDOR TYPES
// ============================================================================

export interface Vendor {
  id: number;
  name: string;
  organization_name: string;
  gstin?: string; // GST Number
  contact_number?: string;
  email?: string;
  address?: string;
  category: string;
  comments?: string;
}

export interface CreateVendorRequest {
  name: string;
  organization_name: string;
  gstin?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  category?: string;
  comments?: string;
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  id: number;
}

// ============================================================================
// REIMBURSEMENT TYPES
// ============================================================================

export interface ReimbursementPhoto {
  id: number;
  reimbursement_request: number;
  photo: string; // URL
  uploaded_at: string;
  description?: string;
}

export interface ReimbursementStatus {
  id: number;
  reimbursement_request: number;
  status: 'pending' | 'approved' | 'done' | 'rejected';
  updated_by: number;
  updated_by_name?: string;
  updated_at: string;
  reason?: string;
}

export interface ReimbursementRequest {
  id: number;
  expense: number | Expense;
  expense_details?: string; // Populated
  reimbursement_amount: number;
  details: string;
  supporting_documents?: string; // URL
  requested_by: number;
  requested_by_name?: string;
  submitted_at: string;
  bill_evidence: 'yes' | 'no';
  latest_status?: number | ReimbursementStatus;
  status_history?: ReimbursementStatus[]; // All status updates
  photos?: ReimbursementPhoto[];
}

export interface CreateReimbursementRequest {
  expense: number;
  reimbursement_amount: number;
  details: string;
  bill_evidence: 'yes' | 'no';
  supporting_documents?: File; // For upload
}

export interface UpdateReimbursementStatusRequest {
  reimbursement_request: number;
  status: 'pending' | 'approved' | 'done' | 'rejected';
  reason?: string;
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export interface SalesFilters {
  status?: 'completed' | 'pending' | 'not_yet' | 'all';
  search?: string;
  event?: number;
  date_from?: string;
  date_to?: string;
}

export interface ExpensesFilters {
  status?: 'paid' | 'not_paid' | 'partial_paid' | 'all';
  search?: string;
  event?: number;
  vendor?: number;
  reimbursed?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface InvoicesFilters {
  search?: string;
  client?: number;
  event?: number;
  date_from?: string;
  date_to?: string;
}

export interface VendorsFilters {
  search?: string;
  category?: string;
}

export interface ReimbursementsFilters {
  status?: 'pending' | 'approved' | 'done' | 'rejected' | 'all';
  search?: string;
  requested_by?: number;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================

export interface FinanceStatistics {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  pending_sales: number;
  pending_expenses: number;
  total_invoices: number;
  pending_reimbursements: number;
  approved_reimbursements: number;
  total_vendors: number;
}

export interface SalesAnalytics {
  total_amount: number;
  total_discount: number;
  net_amount: number;
  total_received: number;
  balance_due: number;
  completed_count: number;
  pending_count: number;
  by_event?: Record<string, number>;
}

export interface ExpensesAnalytics {
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  paid_count: number;
  not_paid_count: number;
  partial_paid_count: number;
  by_vendor?: Record<string, number>;
  by_event?: Record<string, number>;
  by_payment_mode?: Record<string, number>;
}

// ============================================================================
// TABLE DATA TYPES (for UI components)
// ============================================================================

export interface SaleRowData {
  id: number;
  eventName: string;
  clientName: string;
  clientContact: string;
  venueName: string;
  venueAddress: string;
  amount: number;
  discount: number;
  netAmount: number;
  totalReceived: number;
  balanceDue: number;
  date: string;
  payment_status: 'completed' | 'pending' | 'not_yet';
  createdBy: string;
  paymentsCount: number;
}

export interface ExpenseRowData {
  id: number;
  particulars: string;
  eventName?: string;
  clientName?: string;
  clientContact?: string;
  venueName?: string;
  venueAddress?: string;
  vendorName?: string;
  amount: number;
  expense_date: string;
  payment_status: 'paid' | 'not_paid' | 'partial_paid';
  mode_of_payment: string;
  bill_evidence: 'yes' | 'no';
  createdBy: string;
}

export interface InvoiceRowData {
  id: number;
  invoice_number: string;
  clientName: string;
  eventName?: string;
  date: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  itemsCount: number;
}

export interface VendorRowData {
  id: number;
  name: string;
  organization_name: string;
  category: string;
  contact_number?: string;
  email?: string;
}

export interface ReimbursementRowData {
  id: number;
  expense_details: string;
  reimbursement_amount: number;
  submitted_at: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'done' | 'rejected';
  bill_evidence: 'yes' | 'no';
}
