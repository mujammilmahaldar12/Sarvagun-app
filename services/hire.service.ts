/**
 * Hire Module Service
 * API service for new user onboarding journey
 */
import { api } from '@/src/lib/api';

export interface VerifyCandidateRequest {
    full_name: string;
    email: string;
    phone: string;
}

export interface VerifyCandidateResponse {
    success: boolean;
    message: string;
    verification_token: string;
    email_masked: string;
    job_title: string;
    job_type: string;
}

export interface SendOTPRequest {
    verification_token: string;
}

export interface SendOTPResponse {
    success: boolean;
    message: string;
    email_masked: string;
    expires_in_minutes: number;
}

export interface VerifyOTPRequest {
    verification_token: string;
    otp: string;
}

export interface VerifyOTPResponse {
    success: boolean;
    message: string;
    verification_token: string;
    prefill_data: {
        email: string;
        phone: string;
        designation: string;
        job_type: string;
    };
}

export interface RegistrationFormData {
    verification_token: string;
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    confirm_password: string;
    gender: 'male' | 'female';
    dob: string;
    joining_date: string;
    end_date?: string;
    address: string;
    mobile: string;
    document1_type: string;
    document1_other_name?: string;
    document2_type: string;
    document2_other_name?: string;
}

export interface RegistrationResponse {
    success: boolean;
    message: string;
    verification_token: string;
    status: string;
}

export interface StatusCheckResponse {
    status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
    submitted_at?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    otp_verified?: boolean;
}

export interface PendingApproval {
    id: number;
    full_name: string;
    email: string;
    designation: string;
    job_title: string;
    job_type: string;
    user_category: string;
    submitted_at: string;
    status: string;
}

export interface PendingApprovalDetail extends PendingApproval {
    first_name: string;
    last_name: string;
    username: string;
    gender: string;
    dob: string;
    joining_date: string;
    end_date?: string;
    address: string;
    mobile: string;
    job_location: string;
    document1_type: string;
    document1_other_name?: string;
    document1_url?: string;
    document2_type: string;
    document2_other_name?: string;
    document2_url?: string;
    photo_url?: string;
    reviewed_at?: string;
    rejection_reason?: string;
}

class HireService {
    private baseUrl = '/hr/hire';

    /**
     * Step 1: Verify if the candidate is a hired applicant
     */
    async verifyCandidate(data: VerifyCandidateRequest): Promise<VerifyCandidateResponse> {
        const response = await api.post<VerifyCandidateResponse>(
            `${this.baseUrl}/verify-candidate/`,
            data
        );
        return response.data;
    }

    /**
     * Step 2: Send OTP to candidate's email
     */
    async sendOTP(verificationToken: string): Promise<SendOTPResponse> {
        const response = await api.post<SendOTPResponse>(
            `${this.baseUrl}/send-otp/`,
            { verification_token: verificationToken }
        );
        return response.data;
    }

    /**
     * Step 3: Verify the OTP
     */
    async verifyOTP(verificationToken: string, otp: string): Promise<VerifyOTPResponse> {
        const response = await api.post<VerifyOTPResponse>(
            `${this.baseUrl}/verify-otp/`,
            { verification_token: verificationToken, otp }
        );
        return response.data;
    }

    /**
     * Step 4: Submit the full registration form
     */
    async submitRegistration(formData: FormData): Promise<RegistrationResponse> {
        const response = await api.post<RegistrationResponse>(
            `${this.baseUrl}/register/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    }

    /**
     * Check registration status
     */
    async checkStatus(verificationToken: string): Promise<StatusCheckResponse> {
        const response = await api.get<StatusCheckResponse>(
            `${this.baseUrl}/status/${verificationToken}/`
        );
        return response.data;
    }

    // ============================================================================
    // Admin/HR Endpoints
    // ============================================================================

    /**
     * List all pending approvals (for admins/HR/team leads)
     */
    async getPendingApprovals(status: string = 'pending'): Promise<{
        count: number;
        results: PendingApproval[];
    }> {
        const response = await api.get(`${this.baseUrl}/pending-approvals/`, {
            params: { status },
        });
        return response.data;
    }

    /**
     * Get detailed pending approval info
     */
    async getPendingApprovalDetail(id: number): Promise<PendingApprovalDetail> {
        const response = await api.get<PendingApprovalDetail>(
            `${this.baseUrl}/pending-approvals/${id}/`
        );
        return response.data;
    }

    /**
     * Approve a pending registration (with optional team assignment)
     */
    async approveRegistration(id: number, teamId?: number): Promise<{
        success: boolean;
        message: string;
        user_id: number;
        username: string;
        category: string;
        team_name?: string;
    }> {
        const response = await api.post(`${this.baseUrl}/approve/${id}/`, {
            team_id: teamId || null
        });
        return response.data;
    }

    /**
     * Update a pending registration before approval
     */
    async updatePendingApproval(id: number, data: Partial<{
        first_name: string;
        last_name: string;
        username: string;
        designation: string;
        joining_date: string;
        end_date: string;
        address: string;
        mobile: string;
        gender: string;
        dob: string;
    }>): Promise<{
        success: boolean;
        message: string;
        data: PendingApprovalDetail;
    }> {
        const response = await api.put(`${this.baseUrl}/pending-approvals/${id}/update/`, data);
        return response.data;
    }

    /**
     * Reject a pending registration
     */
    async rejectRegistration(id: number, reason: string): Promise<{
        success: boolean;
        message: string;
    }> {
        const response = await api.post(`${this.baseUrl}/reject/${id}/`, {
            rejection_reason: reason,
        });
        return response.data;
    }

    /**
     * Invite a new hire manually (HR only)
     */
    async inviteHire(data: InviteHireRequest): Promise<InviteHireResponse> {
        const response = await api.post<InviteHireResponse>(
            `${this.baseUrl}/invite/`,
            data
        );
        return response.data;
    }
}

export interface InviteHireRequest {
    full_name: string;
    email: string;
    phone: string;
    job_title: string;
    job_type: 'Internship' | 'Full Time' | 'Part Time' | 'Contract';
    job_location?: string;
}

export interface InviteHireResponse {
    success: boolean;
    message: string;
    job_application_id: number;
    job_title: string;
    job_type: string;
}

export const hireService = new HireService();
export default hireService;
