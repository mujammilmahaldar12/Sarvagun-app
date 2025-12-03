export interface Internship {
  id: number;
  intern: number;
  intern_name?: string;
  lead: boolean;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  days_remaining: number | null;
}

export type ExtensionStatus = 'pending' | 'approved' | 'rejected';

export interface InternshipExtension {
  id: number;
  internship: number;
  original_end_date: string;
  new_end_date: string;
  duration_months: number;
  reason: string;
  status: ExtensionStatus;
  requested_by: number;
  approved_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExtensionRequest {
  duration_months: number;
  reason: string;
}
