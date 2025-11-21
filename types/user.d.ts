// User Type Definitions with Professional Permission System

import type { Permission, Role } from '../store/permissionStore';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  
  // Professional hierarchy fields
  category?: 'hr' | 'admin' | 'manager' | 'employee' | 'intern';
  designation?: string;
  department?: string;
  
  // Permission system fields
  role?: Role;
  company?: string;
  permissions?: Permission[];
  
  // Profile fields
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// Permission helpers (deprecated - use permission store instead)
export type UserCategory = User['category'];
export type UserPermissions = {
  canManage: boolean;
  canEdit: boolean;
  canView: boolean;
  canApprove: boolean;
};