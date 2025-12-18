/**
 * Journey Types
 * Type definitions for career journey visualization
 */

export interface JourneyMilestone {
    id: string;
    type: 'start' | 'extension_approved' | 'extension_pending' | 'extension_rejected' | 'position_change' | 'promotion' | 'current';
    title: string;
    date: string;
    endDate?: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface UserJourney {
    startDate: string;
    currentPosition: string;
    category: 'intern' | 'employee' | 'manager' | 'hr' | 'admin' | 'mukadam';
    tenureMonths: number;
    milestones: JourneyMilestone[];
    internship?: {
        id: number;
        start_date: string;
        end_date: string | null;
        is_active: boolean;
        days_remaining: number | null;
    };
    extensions?: Array<{
        id: number;
        internship: number;
        original_end_date: string;
        new_end_date: string;
        duration_months: number;
        status: 'pending' | 'approved' | 'rejected';
        reason: string;
        created_at: string;
    }>;
}

export type { JourneyEvent } from '../components/ui/JourneyTimeline';
