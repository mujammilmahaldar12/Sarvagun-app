/**
 * Professional Permission System
 * Role-based access control with granular permissions
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Permission types
export type Permission = 
  // Events permissions
  | 'events:view'
  | 'events:create'
  | 'events:edit'
  | 'events:delete'
  | 'events:manage'
  
  // Leads permissions  
  | 'leads:view'
  | 'leads:create'
  | 'leads:edit'
  | 'leads:delete'
  | 'leads:convert'
  | 'leads:manage'
  
  // Clients permissions
  | 'clients:view'
  | 'clients:create'
  | 'clients:edit'
  | 'clients:delete'
  | 'clients:manage'
  
  // Venues permissions
  | 'venues:view'
  | 'venues:create'
  | 'venues:edit'
  | 'venues:delete'
  | 'venues:manage'
  
  // Leave Management permissions
  | 'leave:view'        // View leaves
  | 'leave:view_own'    // View only own leaves
  | 'leave:view_team'   // View team leaves
  | 'leave:view_all'    // View all leaves (HR/Admin)
  | 'leave:create'      // Apply for leave
  | 'leave:edit'        // Edit own leave requests
  | 'leave:delete'      // Delete/cancel leave
  | 'leave:approve'     // Approve/reject leaves
  | 'leave:manage'      // Full leave management
  
  // HR permissions
  | 'hr:view'
  | 'hr:manage'
  | 'hr:employees'
  | 'hr:reimbursement'
  
  // Admin permissions
  | 'admin:users'
  | 'admin:settings'
  | 'admin:reports'
  | 'admin:analytics'
  | 'admin:full';

// Role definitions with associated permissions
export type Role = 
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'coordinator'
  | 'viewer'
  | 'client';

// Permission matrix: which permissions each role has
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // All permissions
    'events:view', 'events:create', 'events:edit', 'events:delete', 'events:manage',
    'leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:convert', 'leads:manage',
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:manage',
    'venues:view', 'venues:create', 'venues:edit', 'venues:delete', 'venues:manage',
    'leave:view', 'leave:view_all', 'leave:view_team', 'leave:create', 'leave:edit', 'leave:delete', 'leave:approve', 'leave:manage',
    'hr:view', 'hr:manage', 'hr:employees', 'hr:reimbursement',
    'admin:users', 'admin:settings', 'admin:reports', 'admin:analytics', 'admin:full',
  ],
  
  admin: [
    'events:view', 'events:create', 'events:edit', 'events:delete', 'events:manage',
    'leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:convert', 'leads:manage',
    'clients:view', 'clients:create', 'clients:edit', 'clients:delete', 'clients:manage',
    'venues:view', 'venues:create', 'venues:edit', 'venues:delete', 'venues:manage',
    'leave:view', 'leave:view_all', 'leave:view_team', 'leave:create', 'leave:edit', 'leave:delete', 'leave:approve', 'leave:manage',
    'hr:view', 'hr:manage', 'hr:employees', 'hr:reimbursement',
    'admin:reports', 'admin:analytics',
  ],
  
  manager: [
    'events:view', 'events:create', 'events:edit', 'events:manage',
    'leads:view', 'leads:create', 'leads:edit', 'leads:convert', 'leads:manage',
    'clients:view', 'clients:create', 'clients:edit', 'clients:manage',
    'venues:view', 'venues:create', 'venues:edit', 'venues:manage',
    'leave:view', 'leave:view_team', 'leave:view_all', 'leave:create', 'leave:edit', 'leave:approve',
    'hr:view',
    'admin:reports',
  ],
  
  coordinator: [
    'events:view', 'events:create', 'events:edit',
    'leads:view', 'leads:create', 'leads:edit', 'leads:convert',
    'clients:view', 'clients:create', 'clients:edit',
    'venues:view', 'venues:create', 'venues:edit',
    'leave:view', 'leave:view_own', 'leave:view_team', 'leave:create', 'leave:edit', 'leave:approve',
  ],
  
  viewer: [
    'events:view',
    'leads:view',
    'clients:view',
    'venues:view',
    'leave:view', 'leave:view_own',
  ],
  
  client: [
    'events:view', // Only their own events
  ],
};

// Company-specific role mappings
const COMPANY_ROLE_HIERARCHY: Record<string, Role[]> = {
  'redmagic events': ['super_admin', 'admin', 'manager', 'coordinator', 'viewer'],
  'bling square events': ['super_admin', 'admin', 'manager', 'coordinator', 'viewer'],
  'client': ['client'],
};

// Permission store interface
interface PermissionState {
  permissions: Permission[];
  role: Role | null;
  company: string | null;
  
  // Actions
  setPermissions: (permissions: Permission[]) => void;
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
      
      setRole: (role) => {
        const permissions = ROLE_PERMISSIONS[role] || [];
        set({ role, permissions });
      },
      
      setCompany: (company) => set({ company }),
      
      clearPermissions: () => set({ 
        permissions: [], 
        role: null, 
        company: null 
      }),

      // Permission checks
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { permissions: userPerms } = get();
        return permissions.some(perm => userPerms.includes(perm));
      },

      hasAllPermissions: (permissions) => {
        const { permissions: userPerms } = get();
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
  // Initialize permissions from user data
  initializeFromUser: (user: { role?: string; company?: string; permissions?: Permission[] }) => {
    const { setRole, setCompany, setPermissions } = usePermissionStore.getState();
    
    if (user.role && isValidRole(user.role)) {
      setRole(user.role as Role);
    }
    
    if (user.company) {
      setCompany(user.company);
    }
    
    // Custom permissions override role-based permissions
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
  
  // Get all permissions for a role
  getRolePermissions: (role: Role): Permission[] => {
    return ROLE_PERMISSIONS[role] || [];
  },
};

// Helper function to validate roles
function isValidRole(role: string): role is Role {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
}

// Connect permissions with auth store
// This function should be called from authStore after user is loaded
export const syncPermissionsWithAuth = () => {
  // Import here to avoid circular dependency
  const { useAuthStore } = require('./authStore');
  const authStore = useAuthStore.getState();
  const user = authStore.user;
  
  if (user) {
    permissionUtils.initializeFromUser({
      role: user.role,
      company: user.company,
      permissions: user.permissions,
    });
  } else {
    usePermissionStore.getState().clearPermissions();
  }
};