import { apiClient } from '@lib/api';
import type {
  Sale,
  SalesPayment,
  Expense,
  ExpensePhoto,
  Invoice,
  InvoiceItem,
  Vendor,
  ReimbursementRequest,
  ReimbursementStatus,
  ReimbursementPhoto,
  CreateSaleRequest,
  UpdateSaleRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateReimbursementRequest,
  UpdateReimbursementStatusRequest,
  SalesFilters,
  ExpensesFilters,
  InvoicesFilters,
  VendorsFilters,
  ReimbursementsFilters,
  FinanceStatistics,
  SalesAnalytics,
  ExpensesAnalytics,
} from '@/types/finance';

/**
 * Finance Management Service
 * Handles all API calls for Sales, Expenses, Invoices, Vendors, and Reimbursements
 */
class FinanceService {
  // ==================== SALES ====================
  
  /**
   * Get all sales with optional filtering and pagination
   */
  async getSales(params?: SalesFilters) {
    try {
      const response = await apiClient.get<{ results: Sale[]; count: number; next: string | null; previous: string | null }>('/finance_management/sales/', { params });
      // Handle both paginated and array responses for backward compatibility
      if (response && 'results' in response) {
        return response;
      }
      return { results: Array.isArray(response) ? response : [], count: Array.isArray(response) ? response.length : 0, next: null, previous: null };
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  /**
   * Get single sale by ID
   */
  async getSale(id: number) {
    try {
      const response = await apiClient.get<Sale>(`/finance_management/sales/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw error;
    }
  }

  /**
   * Create new sale
   */
  async createSale(data: CreateSaleRequest) {
    try {
      const response = await apiClient.post<Sale>('/finance_management/sales/', data);
      return response;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Update sale
   */
  async updateSale(id: number, data: UpdateSaleRequest) {
    try {
      const response = await apiClient.put<Sale>(`/finance_management/sales/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  /**
   * Delete sale
   */
  async deleteSale(id: number) {
    try {
      await apiClient.delete(`/finance_management/sales/${id}/`);
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(params?: { date_from?: string; date_to?: string }) {
    try {
      const response = await apiClient.get<SalesAnalytics>('/finance_management/sales/analytics/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  }

  // ==================== SALES PAYMENTS ====================
  
  /**
   * Get all payments for a sale
   */
  async getSalePayments(saleId: number) {
    try {
      const response = await apiClient.get<SalesPayment[]>(`/finance_management/sales/${saleId}/payments/`);
      return response;
    } catch (error) {
      console.error('Error fetching sale payments:', error);
      throw error;
    }
  }

  /**
   * Add payment to a sale
   */
  async addSalePayment(data: Omit<SalesPayment, 'id'>) {
    try {
      const response = await apiClient.post<SalesPayment>('/finance_management/sales-payments/', data);
      return response;
    } catch (error) {
      console.error('Error adding sale payment:', error);
      throw error;
    }
  }

  /**
   * Update sale payment
   */
  async updateSalePayment(id: number, data: Partial<Omit<SalesPayment, 'id'>>) {
    try {
      const response = await apiClient.patch<SalesPayment>(`/finance_management/sales-payments/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating sale payment:', error);
      throw error;
    }
  }

  /**
   * Delete sale payment
   */
  async deleteSalePayment(id: number) {
    try {
      await apiClient.delete(`/finance_management/sales-payments/${id}/`);
    } catch (error) {
      console.error('Error deleting sale payment:', error);
      throw error;
    }
  }

  // ==================== EXPENSES ====================
  
  /**
   * Get all expenses with optional filtering and pagination
   */
  async getExpenses(params?: ExpensesFilters) {
    try {
      const response = await apiClient.get<{ results: Expense[]; count: number; next: string | null; previous: string | null }>('/finance_management/expenses/', { params });
      // Handle both paginated and array responses for backward compatibility
      if (response && 'results' in response) {
        return response;
      }
      return { results: Array.isArray(response) ? response : [], count: Array.isArray(response) ? response.length : 0, next: null, previous: null };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  /**
   * Get single expense by ID
   */
  async getExpense(id: number) {
    try {
      const response = await apiClient.get<Expense>(`/finance_management/expenses/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  }

  /**
   * Create new expense
   */
  async createExpense(data: CreateExpenseRequest) {
    try {
      const response = await apiClient.post<Expense>('/finance_management/expenses/', data);
      return response;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Update expense
   */
  async updateExpense(id: number, data: Partial<CreateExpenseRequest>) {
    try {
      const response = await apiClient.patch<Expense>(`/finance_management/expenses/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: number) {
    try {
      await apiClient.delete(`/finance_management/expenses/${id}/`);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  /**
   * Get expenses analytics
   */
  async getExpensesAnalytics(params?: { date_from?: string; date_to?: string }) {
    try {
      const response = await apiClient.get<ExpensesAnalytics>('/finance_management/expenses/analytics/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching expenses analytics:', error);
      throw error;
    }
  }

  // ==================== EXPENSE PHOTOS ====================
  
  /**
   * Upload photo for expense
   */
  async uploadExpensePhoto(expenseId: number, photoData: { photo: File | string; description?: string }) {
    try {
      const formData = new FormData();
      formData.append('expense', expenseId.toString());
      formData.append('photo', photoData.photo);
      if (photoData.description) {
        formData.append('description', photoData.description);
      }

      const response = await apiClient.post<ExpensePhoto>('/finance_management/expense-photos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading expense photo:', error);
      throw error;
    }
  }

  /**
   * Delete expense photo
   */
  async deleteExpensePhoto(photoId: number) {
    try {
      await apiClient.delete(`/finance_management/expense-photos/${photoId}/`);
    } catch (error) {
      console.error('Error deleting expense photo:', error);
      throw error;
    }
  }

  // ==================== INVOICES ====================
  
  /**
   * Get all invoices with optional filtering
   */
  async getInvoices(params?: InvoicesFilters) {
    try {
      const response = await apiClient.get<Invoice[]>('/finance_management/invoices/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get single invoice by ID
   */
  async getInvoice(id: number) {
    try {
      const response = await apiClient.get<Invoice>(`/finance_management/invoices/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  async createInvoice(data: CreateInvoiceRequest) {
    try {
      const response = await apiClient.post<Invoice>('/finance_management/invoices/', data);
      return response;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: number, data: Partial<CreateInvoiceRequest>) {
    try {
      const response = await apiClient.patch<Invoice>(`/finance_management/invoices/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: number) {
    try {
      await apiClient.delete(`/finance_management/invoices/${id}/`);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // ==================== INVOICE ITEMS ====================
  
  /**
   * Add item to invoice
   */
  async addInvoiceItem(data: Omit<InvoiceItem, 'id'>) {
    try {
      const response = await apiClient.post<InvoiceItem>('/finance_management/invoice-items/', data);
      return response;
    } catch (error) {
      console.error('Error adding invoice item:', error);
      throw error;
    }
  }

  /**
   * Update invoice item
   */
  async updateInvoiceItem(id: number, data: Partial<Omit<InvoiceItem, 'id'>>) {
    try {
      const response = await apiClient.patch<InvoiceItem>(`/finance_management/invoice-items/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating invoice item:', error);
      throw error;
    }
  }

  /**
   * Delete invoice item
   */
  async deleteInvoiceItem(id: number) {
    try {
      await apiClient.delete(`/finance_management/invoice-items/${id}/`);
    } catch (error) {
      console.error('Error deleting invoice item:', error);
      throw error;
    }
  }

  // ==================== VENDORS ====================
  
  /**
   * Get all vendors with optional filtering
   */
  async getVendors(params?: VendorsFilters) {
    try {
      const response = await apiClient.get<Vendor[]>('/finance_management/vendors/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  }

  /**
   * Get single vendor by ID
   */
  async getVendor(id: number) {
    try {
      const response = await apiClient.get<Vendor>(`/finance_management/vendors/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  }

  /**
   * Create new vendor
   */
  async createVendor(data: CreateVendorRequest) {
    try {
      const response = await apiClient.post<Vendor>('/finance_management/vendors/', data);
      return response;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(id: number, data: Partial<CreateVendorRequest>) {
    try {
      const response = await apiClient.patch<Vendor>(`/finance_management/vendors/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(id: number) {
    try {
      await apiClient.delete(`/finance_management/vendors/${id}/`);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }

  // ==================== REIMBURSEMENTS ====================
  
  /**
   * Get all reimbursement requests with optional filtering
   */
  async getReimbursements(params?: ReimbursementsFilters) {
    try {
      const response = await apiClient.get<ReimbursementRequest[]>('/finance_management/reimbursements/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching reimbursements:', error);
      throw error;
    }
  }

  /**
   * Get single reimbursement request by ID
   */
  async getReimbursement(id: number) {
    try {
      const response = await apiClient.get<ReimbursementRequest>(`/finance_management/reimbursements/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching reimbursement:', error);
      throw error;
    }
  }

  /**
   * Create new reimbursement request
   */
  async createReimbursement(data: CreateReimbursementRequest) {
    try {
      const formData = new FormData();
      formData.append('expense', data.expense.toString());
      formData.append('reimbursement_amount', data.reimbursement_amount.toString());
      formData.append('details', data.details);
      formData.append('bill_evidence', data.bill_evidence);
      
      if (data.supporting_documents) {
        formData.append('supporting_documents', data.supporting_documents);
      }

      const response = await apiClient.post<ReimbursementRequest>('/finance_management/reimbursements/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error creating reimbursement:', error);
      throw error;
    }
  }

  /**
   * Update reimbursement request
   */
  async updateReimbursement(id: number, data: Partial<CreateReimbursementRequest>) {
    try {
      const response = await apiClient.patch<ReimbursementRequest>(`/finance_management/reimbursements/${id}/`, data);
      return response;
    } catch (error) {
      console.error('Error updating reimbursement:', error);
      throw error;
    }
  }

  /**
   * Delete reimbursement request
   */
  async deleteReimbursement(id: number) {
    try {
      await apiClient.delete(`/finance_management/reimbursements/${id}/`);
    } catch (error) {
      console.error('Error deleting reimbursement:', error);
      throw error;
    }
  }

  /**
   * Update reimbursement status (Approve/Reject/Complete)
   */
  async updateReimbursementStatus(data: UpdateReimbursementStatusRequest) {
    try {
      const response = await apiClient.post<ReimbursementStatus>('/finance_management/reimbursement-status/', data);
      return response;
    } catch (error) {
      console.error('Error updating reimbursement status:', error);
      throw error;
    }
  }

  /**
   * Upload photo for reimbursement
   */
  async uploadReimbursementPhoto(reimbursementId: number, photoData: { photo: File | string; description?: string }) {
    try {
      const formData = new FormData();
      formData.append('reimbursement_request', reimbursementId.toString());
      formData.append('photo', photoData.photo);
      if (photoData.description) {
        formData.append('description', photoData.description);
      }

      const response = await apiClient.post<ReimbursementPhoto>('/finance_management/reimbursement-photos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading reimbursement photo:', error);
      throw error;
    }
  }

  /**
   * Delete reimbursement photo
   */
  async deleteReimbursementPhoto(photoId: number) {
    try {
      await apiClient.delete(`/finance_management/reimbursement-photos/${photoId}/`);
    } catch (error) {
      console.error('Error deleting reimbursement photo:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & STATISTICS ====================
  
  /**
   * Get overall finance statistics
   */
  async getFinanceStatistics() {
    try {
      const response = await apiClient.get<FinanceStatistics>('/finance_management/statistics/');
      return response;
    } catch (error) {
      console.error('Error fetching finance statistics:', error);
      throw error;
    }
  }

  /**
   * Global search across finance entities
   */
  async globalSearch(query: string) {
    try {
      const response = await apiClient.get<any>(`/finance_management/search/?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Error performing global search:', error);
      throw error;
    }
  }
}

export default new FinanceService();
