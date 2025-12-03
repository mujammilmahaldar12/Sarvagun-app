// User Type Definitions with Professional Permission System

import type { Permission, Role } from '../store/permissionStore';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Computed from first_name + last_name or standalone
  photo?: string; // Profile photo URL
  
  // Professional hierarchy fields
  category?: 'hr' | 'admin' | 'manager' | 'employee' | 'intern';
  designation?: string;
  department?: string;
  
  // Hierarchy & Team structure
  reports_to?: number; // Manager/Team lead user ID
  reports_to_name?: string;
  team_id?: number;
  team_name?: string;
  
  // Permission system fields
  role?: Role;
  company?: string;
  permissions?: Permission[];
  
  // Profile fields
  phone?: string;
  mobileno?: string; // Mobile number field from backend
  address?: string; // Address field from backend
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  
  // Theme preference
  theme_preference?: 'light' | 'dark';
  
  // Enhanced profile fields
  bio?: string;
  skills?: Skill[];
  certifications?: Certification[];
  attendance_percentage?: number;
  team_size?: number; // Number of team members if team lead/manager
  
  // Leaderboard fields
  total_stars_received?: number; // Star-based ranking score
  rank?: number; // User's rank in leaderboard
  score?: number; // Alias for total_stars_received
  completed_tasks?: number;
  in_progress_tasks?: number;
  avg_rating?: number;
  is_online?: boolean;
}

// Skill interface for professional competencies
export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'domain';
  level: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert
  years_experience?: number;
}

// Certification interface for professional credentials
export interface Certification {
  id: string;
  title: string;
  issued_by: string; // Organization/Company
  issue_date: string; // ISO date
  expiry_date?: string; // ISO date, optional for non-expiring certs
  credential_id?: string;
  credential_url?: string;
  description?: string;
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