import api from './api';
import type { AuditLog, AuditLogFilters } from '../types/admin';

class AdminService {
    /**
     * Get audit logs (Shadow Table)
     */
    async getAuditLogs(filters?: AuditLogFilters): Promise<{ count: number; results: AuditLog[] }> {
        const response = await api.get<{ count: number; results: AuditLog[] }>('/core/shadow-table/', { params: filters });
        return response;
    }
}

const adminService = new AdminService();
export default adminService;
