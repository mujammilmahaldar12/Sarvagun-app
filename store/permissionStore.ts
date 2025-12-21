/**
 * Professional Permission System
 * Role-based access control with granular permissions
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Permission types
// Permission types - Now dynamic strings from backend
export type Permission = string;

// Role definitions
export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'coordinator'
  | 'intern'
  | 'employee'
  | 'viewer'
  | 'client';

// NOTE: Hardcoded ROLE_PERMISSIONS removed. 
// Permissions are now fetched dynamically from the backend API.


// Company-specific role mappings
const COMPANY_ROLE_HIERARCHY: Record<string, Role[]> = {
  'redmagic events': ['super_admin', 'admin', 'manager', 'coordinator', 'employee', 'intern', 'viewer'],
  'bling square events': ['super_admin', 'admin', 'manager', 'coordinator', 'employee', 'intern', 'viewer'],
  'client': ['client'],
};

// Permission store interface
interface PermissionState {
  permissions: Permission[];
  role: Role | null;
  company: string | null;

  // Actions
  setPermissions: (permissions: string[]) => void;
  fetchPermissions: () => Promise<void>;
  setRole: (role: Role) => void;
  setCompany: (company: string) => void;
  clearPermissions: () => void;

  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canManage: (resource: 'events' | 'leads' | 'clients' | 'venues') => boolean;
  canEdit: (resource: 'events' | 'leads' | 'clients' | 'venues') => boolean;
  canDelete: (resource: 'events' | 'leads' | 'clients' | 'venues') => boolean;
  canCreate: (resource: 'events' | 'leads' | 'clients' | 'venues') => boolean;
  canView: (resource: 'events' | 'leads' | 'clients' | 'venues') => boolean;

  // Role checks
  isAdmin: () => boolean;
  isManager: () => boolean;
  isCoordinator: () => boolean;
  isViewer: () => boolean;
  isClient: () => boolean;
}

// Create the permission store
export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [],
      role: null,
      company: null,

      setPermissions: (permissions) => set({ permissions }),

      fetchPermissions: async () => {
        try {
          // Import api here to avoid circular dependency
          const api = require('@/services/api').default;
          // Or use fetch directly if needed, but api service handles auth headers

          const response = await api.get('/core/my-permissions/');
          // Note: api service already unwraps response.data, so 'response' IS the data
          const data = response?.data || response;

          set({
            permissions: data?.permissions || [],
            role: data?.category as Role || 'employee',
            // company: data.company  (Access company from user object if needed)
          });

          console.log('✅ Permissions fetched from backend:', data?.permissions?.length);
        } catch (error) {
          console.error('❌ Failed to fetch permissions:', error);
          // Fallback to empty or safe default
          set({ permissions: [] });
        }
      },

      setRole: (role) => {
        // Just set the role, permissions are fetched separately
        set({ role });
      },

      setCompany: (company) => set({ company }),

      clearPermissions: () => set({
        permissions: [],
        role: null,
        company: null
      }),

      // Permission checks
      // ADMIN BYPASS: admins and super_admins have ALL permissions
      hasPermission: (permission) => {
        const { permissions, role } = get();
        // Admin bypass - admins can do everything
        if (role === 'admin' || role === 'super_admin') return true;
        return permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { permissions: userPerms, role } = get();
        // Admin bypass
        if (role === 'admin' || role === 'super_admin') return true;
        return permissions.some(perm => userPerms.includes(perm));
      },

      hasAllPermissions: (permissions) => {
        const { permissions: userPerms, role } = get();
        // Admin bypass
        if (role === 'admin' || role === 'super_admin') return true;
        return permissions.every(perm => userPerms.includes(perm));
      },

      canManage: (resource) => {
        return get().hasPermission(`${resource}:manage` as Permission);
      },

      canEdit: (resource) => {
        const { hasPermission } = get();
        return hasPermission(`${resource}:edit` as Permission) ||
          hasPermission(`${resource}:manage` as Permission);
      },

      canDelete: (resource) => {
        const { hasPermission } = get();
        return hasPermission(`${resource}:delete` as Permission) ||
          hasPermission(`${resource}:manage` as Permission);
      },

      canCreate: (resource) => {
        const { hasPermission } = get();
        return hasPermission(`${resource}:create` as Permission) ||
          hasPermission(`${resource}:manage` as Permission);
      },

      canView: (resource) => {
        const { hasPermission } = get();
        return hasPermission(`${resource}:view` as Permission) ||
          hasPermission(`${resource}:manage` as Permission);
      },

      // Role checks
      isAdmin: () => {
        const { role } = get();
        return role === 'super_admin' || role === 'admin';
      },

      isManager: () => {
        const { role } = get();
        return role === 'super_admin' || role === 'admin' || role === 'manager';
      },

      isCoordinator: () => {
        const { role } = get();
        return ['super_admin', 'admin', 'manager', 'coordinator'].includes(role || '');
      },

      isViewer: () => {
        const { role } = get();
        return role === 'viewer';
      },

      isClient: () => {
        const { role } = get();
        return role === 'client';
      },
    }),
    {
      name: 'sarvagun-permissions',
      partialize: (state) => ({
        permissions: state.permissions,
        role: state.role,
        company: state.company,
      }),
    }
  )
);

// Hook for easy access to permission checks
export const usePermissions = () => {
  const store = usePermissionStore();

  return {
    // All store methods
    ...store,

    // Convenience methods for common patterns
    canManageEvents: store.canManage('events'),
    canEditEvents: store.canEdit('events'),
    canDeleteEvents: store.canDelete('events'),
    canCreateEvents: store.canCreate('events'),
    canViewEvents: store.canView('events'),

    canManageLeads: store.canManage('leads'),
    canEditLeads: store.canEdit('leads'),
    canDeleteLeads: store.canDelete('leads'),
    canCreateLeads: store.canCreate('leads'),
    canViewLeads: store.canView('leads'),
    canConvertLeads: store.hasPermission('leads:convert'),

    canManageClients: store.canManage('clients'),
    canEditClients: store.canEdit('clients'),
    canDeleteClients: store.canDelete('clients'),
    canCreateClients: store.canCreate('clients'),
    canViewClients: store.canView('clients'),

    canManageVenues: store.canManage('venues'),
    canEditVenues: store.canEdit('venues'),
    canDeleteVenues: store.canDelete('venues'),
    canCreateVenues: store.canCreate('venues'),
    canViewVenues: store.canView('venues'),

    // Admin permissions
    canManageUsers: store.hasPermission('admin:users'),
    canViewReports: store.hasPermission('admin:reports'),
    canViewAnalytics: store.hasPermission('admin:analytics'),
    canManageSettings: store.hasPermission('admin:settings'),
    hasFullAdmin: store.hasPermission('admin:full'),
  };
};

// Utility functions for role management
export const permissionUtils = {
  // Initialize permissions from user data (now cleaner)
  initializeFromUser: (user: { role?: string; company?: string; permissions?: string[] }) => {
    const { setRole, setCompany, setPermissions } = usePermissionStore.getState();

    if (user.role) {
      setRole(user.role as Role);
    }

    if (user.company) {
      setCompany(user.company);
    }

    // Permissions come directly from API now
    if (user.permissions?.length) {
      setPermissions(user.permissions);
    }
  },

  // Check if user can access company resources
  canAccessCompany: (userCompany: string, resourceCompany: string): boolean => {
    // Super admins can access everything
    const { role } = usePermissionStore.getState();
    if (role === 'super_admin') return true;

    // Users can only access their company's resources
    return userCompany === resourceCompany;
  },

  // Get available roles for a company
  getCompanyRoles: (company: string): Role[] => {
    return COMPANY_ROLE_HIERARCHY[company] || ['viewer'];
  },

  // Get all permissions for a role (Legacy: returns empty now)
  getRolePermissions: (role: Role): Permission[] => {
    return [];
  },
};

// Helper function to validate roles
function isValidRole(role: string): role is Role {
  return true; // Simplified valid check
}