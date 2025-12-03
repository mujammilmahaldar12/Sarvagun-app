import { useQuery } from '@tanstack/react-query';
import adminService from '../services/admin.service';
import type { AuditLogFilters } from '../types/admin';

export const adminQueryKeys = {
    all: ['admin'] as const,
    auditLogs: (filters?: AuditLogFilters) => [...adminQueryKeys.all, 'auditLogs', filters] as const,
};

export const useAuditLogs = (filters?: AuditLogFilters) => {
    return useQuery({
        queryKey: adminQueryKeys.auditLogs(filters),
        queryFn: () => adminService.getAuditLogs(filters),
        staleTime: 1 * 60 * 1000,
    });
};
