/**
 * Finance Service with React Query Integration
 * Professional data fetching, caching, and mutation handling for Finance module
 */
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';
import financeService from '../services/finance.service';
import type {
  Sale,
  SalesPayment,
  Expense,
  Invoice,
  Vendor,
  ReimbursementRequest,
  SalesFilters,
  ExpensesFilters,
  InvoicesFilters,
  VendorsFilters,
  ReimbursementsFilters,
} from '../types/finance';

// ==================== QUERY KEYS ====================

export const financeQueryKeys = {
  all: ['finance'] as const,
  
  // Sales
  sales: {
    all: ['finance', 'sales'] as const,
    lists: () => [...financeQueryKeys.sales.all, 'list'] as const,
    list: (filters: SalesFilters) => [...financeQueryKeys.sales.lists(), filters] as const,
    details: () => [...financeQueryKeys.sales.all, 'detail'] as const,
    detail: (id: number) => [...financeQueryKeys.sales.details(), id] as const,
    payments: (saleId: number) => [...financeQueryKeys.sales.all, 'payments', saleId] as const,
    analytics: () => [...financeQueryKeys.sales.all, 'analytics'] as const,
  },
  
  // Expenses
  expenses: {
    all: ['finance', 'expenses'] as const,
    lists: () => [...financeQueryKeys.expenses.all, 'list'] as const,
    list: (filters: ExpensesFilters) => [...financeQueryKeys.expenses.lists(), filters] as const,
    details: () => [...financeQueryKeys.expenses.all, 'detail'] as const,
    detail: (id: number) => [...financeQueryKeys.expenses.details(), id] as const,
    analytics: () => [...financeQueryKeys.expenses.all, 'analytics'] as const,
  },
  
  // Invoices
  invoices: {
    all: ['finance', 'invoices'] as const,
    lists: () => [...financeQueryKeys.invoices.all, 'list'] as const,
    list: (filters: InvoicesFilters) => [...financeQueryKeys.invoices.lists(), filters] as const,
    details: () => [...financeQueryKeys.invoices.all, 'detail'] as const,
    detail: (id: number) => [...financeQueryKeys.invoices.details(), id] as const,
  },
  
  // Vendors
  vendors: {
    all: ['finance', 'vendors'] as const,
    lists: () => [...financeQueryKeys.vendors.all, 'list'] as const,
    list: (filters: VendorsFilters) => [...financeQueryKeys.vendors.lists(), filters] as const,
    details: () => [...financeQueryKeys.vendors.all, 'detail'] as const,
    detail: (id: number) => [...financeQueryKeys.vendors.details(), id] as const,
  },
  
  // Reimbursements
  reimbursements: {
    all: ['finance', 'reimbursements'] as const,
    lists: () => [...financeQueryKeys.reimbursements.all, 'list'] as const,
    list: (filters: ReimbursementsFilters) => [...financeQueryKeys.reimbursements.lists(), filters] as const,
    details: () => [...financeQueryKeys.reimbursements.all, 'detail'] as const,
    detail: (id: number) => [...financeQueryKeys.reimbursements.details(), id] as const,
  },
  
  // Statistics
  statistics: ['finance', 'statistics'] as const,
};

// ==================== CACHE UTILITIES ====================

export const financeCacheUtils = {
  invalidateSales: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.sales.all });
  },
  invalidateExpenses: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.expenses.all });
  },
  invalidateInvoices: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.invoices.all });
  },
  invalidateVendors: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.vendors.all });
  },
  invalidateReimbursements: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.reimbursements.all });
  },
  invalidateAll: () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
  },
  clearAll: () => {
    queryClient.removeQueries({ queryKey: financeQueryKeys.all });
  },
};

// ==================== SALES HOOKS ====================

/**
 * Fetch all sales with optional filtering
 */
export const useSales = (filters: SalesFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: financeQueryKeys.sales.list(filters),
    queryFn: () => financeService.getSales(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isAuthenticated,
  });
};

/**
 * Fetch single sale by ID
 */
export const useSale = (saleId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.sales.detail(saleId),
    queryFn: () => financeService.getSale(saleId),
    enabled: !!saleId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch payments for a specific sale
 */
export const useSalePayments = (saleId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.sales.payments(saleId),
    queryFn: async () => {
      try {
        return await financeService.getSalePayments(saleId);
      } catch (error: any) {
        // Return empty array on 404 if endpoint doesn't exist
        if (error?.response?.status === 404) {
          console.warn('Sale payments endpoint not available, returning empty array');
          return [];
        }
        throw error;
      }
    },
    enabled: !!saleId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Fetch sales analytics
 */
export const useSalesAnalytics = (params?: { date_from?: string; date_to?: string }) => {
  return useQuery({
    queryKey: [...financeQueryKeys.sales.analytics(), params],
    queryFn: () => financeService.getSalesAnalytics(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
};

/**
 * Create new sale
 */
export const useCreateSale = () => {
  return useMutation({
    mutationFn: financeService.createSale,
    onSuccess: () => {
      financeCacheUtils.invalidateSales();
      console.log('Sale created successfully');
    },
    onError: (error) => {
      console.error('Failed to create sale:', error);
    },
  });
};

/**
 * Update sale
 */
export const useUpdateSale = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      financeService.updateSale(id, data),
    onSuccess: (updatedSale) => {
      queryClient.setQueryData(
        financeQueryKeys.sales.detail(updatedSale.id),
        updatedSale
      );
      financeCacheUtils.invalidateSales();
    },
  });
};

/**
 * Delete sale
 */
export const useDeleteSale = () => {
  return useMutation({
    mutationFn: financeService.deleteSale,
    onSuccess: () => {
      financeCacheUtils.invalidateSales();
    },
  });
};

/**
 * Add payment to sale
 */
export const useAddSalePayment = () => {
  return useMutation({
    mutationFn: financeService.addSalePayment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: financeQueryKeys.sales.payments(variables.sale) 
      });
      financeCacheUtils.invalidateSales();
    },
  });
};

// ==================== EXPENSES HOOKS ====================

/**
 * Fetch all expenses with optional filtering
 */
export const useExpenses = (filters: ExpensesFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: financeQueryKeys.expenses.list(filters),
    queryFn: () => financeService.getExpenses(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  });
};

/**
 * Fetch single expense by ID
 */
export const useExpense = (expenseId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.expenses.detail(expenseId),
    queryFn: () => financeService.getExpense(expenseId),
    enabled: !!expenseId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch expenses analytics
 */
export const useExpensesAnalytics = (params?: { date_from?: string; date_to?: string }) => {
  return useQuery({
    queryKey: [...financeQueryKeys.expenses.analytics(), params],
    queryFn: () => financeService.getExpensesAnalytics(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

/**
 * Create new expense
 */
export const useCreateExpense = () => {
  return useMutation({
    mutationFn: financeService.createExpense,
    onSuccess: () => {
      financeCacheUtils.invalidateExpenses();
      console.log('Expense created successfully');
    },
    onError: (error) => {
      console.error('Failed to create expense:', error);
    },
  });
};

/**
 * Update expense
 */
export const useUpdateExpense = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      financeService.updateExpense(id, data),
    onSuccess: (updatedExpense) => {
      queryClient.setQueryData(
        financeQueryKeys.expenses.detail(updatedExpense.id),
        updatedExpense
      );
      financeCacheUtils.invalidateExpenses();
    },
  });
};

/**
 * Delete expense
 */
export const useDeleteExpense = () => {
  return useMutation({
    mutationFn: financeService.deleteExpense,
    onSuccess: () => {
      financeCacheUtils.invalidateExpenses();
    },
  });
};

/**
 * Fetch expense photos
 */
export const useExpensePhotos = (expenseId: number) => {
  return useQuery({
    queryKey: [...financeQueryKeys.expenses.detail(expenseId), 'photos'],
    queryFn: async () => {
      const expense = await financeService.getExpense(expenseId);
      return expense.photos || [];
    },
    enabled: !!expenseId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Upload expense photo
 */
export const useUploadExpensePhoto = () => {
  return useMutation({
    mutationFn: ({ expenseId, photoData }: { expenseId: number; photoData: any }) =>
      financeService.uploadExpensePhoto(expenseId, photoData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeQueryKeys.expenses.detail(variables.expenseId)
      });
    },
  });
};

/**
 * Delete expense photo
 */
export const useDeleteExpensePhoto = () => {
  return useMutation({
    mutationFn: financeService.deleteExpensePhoto,
    onSuccess: () => {
      financeCacheUtils.invalidateExpenses();
    },
  });
};

// ==================== INVOICES HOOKS ====================

/**
 * Fetch all invoices with optional filtering
 */
export const useInvoices = (filters: InvoicesFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: financeQueryKeys.invoices.list(filters),
    queryFn: () => financeService.getInvoices(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  });
};

/**
 * Fetch single invoice by ID
 */
export const useInvoice = (invoiceId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.invoices.detail(invoiceId),
    queryFn: () => financeService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create new invoice
 */
export const useCreateInvoice = () => {
  return useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => {
      financeCacheUtils.invalidateInvoices();
      console.log('Invoice created successfully');
    },
    onError: (error) => {
      console.error('Failed to create invoice:', error);
    },
  });
};

/**
 * Update invoice
 */
export const useUpdateInvoice = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      financeService.updateInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        financeQueryKeys.invoices.detail(updatedInvoice.id),
        updatedInvoice
      );
      financeCacheUtils.invalidateInvoices();
    },
  });
};

/**
 * Delete invoice
 */
export const useDeleteInvoice = () => {
  return useMutation({
    mutationFn: financeService.deleteInvoice,
    onSuccess: () => {
      financeCacheUtils.invalidateInvoices();
    },
  });
};

// ==================== VENDORS HOOKS ====================

/**
 * Fetch all vendors with optional filtering
 */
export const useVendors = (filters: VendorsFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: financeQueryKeys.vendors.list(filters),
    queryFn: () => financeService.getVendors(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 10 * 60 * 1000, // Vendors are more stable
    enabled: isAuthenticated,
  });
};

/**
 * Fetch single vendor by ID
 */
export const useVendor = (vendorId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.vendors.detail(vendorId),
    queryFn: () => financeService.getVendor(vendorId),
    enabled: !!vendorId,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Create new vendor
 */
export const useCreateVendor = () => {
  return useMutation({
    mutationFn: financeService.createVendor,
    onSuccess: () => {
      financeCacheUtils.invalidateVendors();
      console.log('Vendor created successfully');
    },
    onError: (error) => {
      console.error('Failed to create vendor:', error);
    },
  });
};

/**
 * Update vendor
 */
export const useUpdateVendor = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      financeService.updateVendor(id, data),
    onSuccess: (updatedVendor) => {
      queryClient.setQueryData(
        financeQueryKeys.vendors.detail(updatedVendor.id),
        updatedVendor
      );
      financeCacheUtils.invalidateVendors();
    },
  });
};

/**
 * Delete vendor
 */
export const useDeleteVendor = () => {
  return useMutation({
    mutationFn: financeService.deleteVendor,
    onSuccess: () => {
      financeCacheUtils.invalidateVendors();
    },
  });
};

// ==================== REIMBURSEMENTS HOOKS ====================

/**
 * Fetch all reimbursements with optional filtering
 */
export const useReimbursements = (filters: ReimbursementsFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: financeQueryKeys.reimbursements.list(filters),
    queryFn: () => financeService.getReimbursements(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000, // Reimbursements are more dynamic
    enabled: isAuthenticated,
  });
};

/**
 * Fetch single reimbursement by ID
 */
export const useReimbursement = (reimbursementId: number) => {
  return useQuery({
    queryKey: financeQueryKeys.reimbursements.detail(reimbursementId),
    queryFn: () => financeService.getReimbursement(reimbursementId),
    enabled: !!reimbursementId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Create new reimbursement request
 */
export const useCreateReimbursement = () => {
  return useMutation({
    mutationFn: financeService.createReimbursement,
    onSuccess: () => {
      financeCacheUtils.invalidateReimbursements();
      financeCacheUtils.invalidateExpenses(); // Also invalidate expenses
      console.log('Reimbursement request created successfully');
    },
    onError: (error) => {
      console.error('Failed to create reimbursement request:', error);
    },
  });
};

/**
 * Update reimbursement status (Approve/Reject/Complete)
 */
export const useUpdateReimbursementStatus = () => {
  return useMutation({
    mutationFn: financeService.updateReimbursementStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeQueryKeys.reimbursements.detail(variables.reimbursement_request)
      });
      financeCacheUtils.invalidateReimbursements();
    },
  });
};

/**
 * Delete reimbursement
 */
export const useDeleteReimbursement = () => {
  return useMutation({
    mutationFn: financeService.deleteReimbursement,
    onSuccess: () => {
      financeCacheUtils.invalidateReimbursements();
    },
  });
};

/**
 * Upload reimbursement photo
 */
export const useUploadReimbursementPhoto = () => {
  return useMutation({
    mutationFn: ({ reimbursementId, photoData }: { reimbursementId: number; photoData: any }) =>
      financeService.uploadReimbursementPhoto(reimbursementId, photoData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: financeQueryKeys.reimbursements.detail(variables.reimbursementId)
      });
    },
  });
};

// ==================== STATISTICS HOOKS ====================

/**
 * Fetch overall finance statistics
 */
export const useFinanceStatistics = () => {
  return useQuery({
    queryKey: financeQueryKeys.statistics,
    queryFn: financeService.getFinanceStatistics,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Prefetch sale details for better UX
 */
export const prefetchSaleDetails = (saleId: number) => {
  return queryClient.prefetchQuery({
    queryKey: financeQueryKeys.sales.detail(saleId),
    queryFn: () => financeService.getSale(saleId),
  });
};

/**
 * Prefetch expense details
 */
export const prefetchExpenseDetails = (expenseId: number) => {
  return queryClient.prefetchQuery({
    queryKey: financeQueryKeys.expenses.detail(expenseId),
    queryFn: () => financeService.getExpense(expenseId),
  });
};
