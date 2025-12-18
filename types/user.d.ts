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
  is_team_leader?: boolean; // Flag for assigned team leaders (even if intern)

  // Profile fields
  phone?: string;
  mobileno?: string; // Mobile number field from backend
  address?: string; // Address field from backend
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  joining_date?: string; // For intern start date
  end_date?: string; // For intern internship end date

  // Theme preference
  theme_preference?: 'light' | 'dark';

  // Enhanced profile fields
  bio?: string;
  headline?: string; // Professional headline/tagline
  skills?: Skill[];
  certifications?: Certification[];
  education?: Education[];
  work_experience?: WorkExperience[];
  social_links?: SocialLink;
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
  description?: string;

  // Type indicator
  certificate_type: 'external' | 'company_issued';

  // External certifications
  credential_id?: string;
  credential_url?: string;
  certificate_file?: string; // URL to uploaded file

  // Company-issued certificates
  verification_code?: string;
  generated_certificate_url?: string; // URL to generated PDF
  issued_by_admin?: number;
  issued_by_admin_name?: string;
  related_module?: string;
  related_module_id?: number;

  // Helper
  is_expired?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Education interface
export interface Education {
  id: string;
  institution: string;
  degree: 'high_school' | 'diploma' | 'associate' | 'bachelor' | 'master' | 'doctorate' | 'certification' | 'other';
  field_of_study: string;
  start_date: string; // ISO date
  end_date?: string; // ISO date, null if currently studying
  grade?: string;
  description?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Work Experience interface
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  location?: string;
  start_date: string; // ISO date
  end_date?: string; // ISO date, null if currently working
  description: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Resume Upload interface
export interface ResumeUpload {
  id: string;
  resume_file: string; // URL
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: {
    skills?: Partial<Skill>[];
    education?: Partial<Education>[];
    experience?: Partial<WorkExperience>[];
    certifications?: Partial<Certification>[];
  };
  error_message?: string;
  uploaded_at: string;
  processed_at?: string;
}

// Social Links interface
export interface SocialLink {
  id: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

// Goal Report interface
export interface GoalReport {
  id: string;
  goal_id: number;
  goal_title: string;
  report_period_start: string;
  report_period_end: string;
  report_html: string;
  report_pdf?: string; // URL
  generated_at: string;
  generated_by?: number;
  generated_by_name?: string;
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