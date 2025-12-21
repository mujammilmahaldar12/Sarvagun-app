import { useCallback } from 'react';
import { usePermissionStore } from '@/store/permissionStore';

export interface ModulePermissions {
    canView: boolean;
    canManage: boolean;
    canApprove: boolean;
    canAdmin: boolean;
    can: (action: string) => boolean;
}

/**
 * Universal hook for module permissions
 * Usage: const { canManage } = useModule('events.clients');
 * 
 * NOTE: Admin and Super Admin users bypass ALL permission checks
 */
export function useModule(modulePath: string): ModulePermissions {
    const { hasPermission, role } = usePermissionStore();

    // Normalize path (e.g. 'events' -> 'events')
    const base = modulePath;

    // ADMIN BYPASS: admins have full access to everything
    const isAdmin = role === 'admin' || role === 'super_admin';

    const can = useCallback((action: string) => {
        // Admin bypass - admins can do everything
        if (isAdmin) return true;

        // Check specific action: 'events.clients.manage'
        if (hasPermission(`${base}.${action}`)) return true;

        // Check admin override: 'events.clients.admin'
        if (action !== 'admin' && hasPermission(`${base}.admin`)) return true;

        return false;
    }, [base, hasPermission, isAdmin]);

    return {
        canView: isAdmin || can('view'),
        canManage: isAdmin || can('manage'),
        canApprove: isAdmin || can('approve'),
        canAdmin: isAdmin || can('admin'),
        can
    };
}
