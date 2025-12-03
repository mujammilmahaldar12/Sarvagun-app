export interface ClientCategory {
    id: number;
    code: 'b2b' | 'b2c' | 'b2g';
    name: string;
    requires_organisation: boolean;
    is_active: boolean;
}

export interface Organisation {
    id: number;
    name: string;
    is_active: boolean;
    created_by?: number;
}

export interface Client {
    id: number;
    name: string;
    number: string;
    alternate_number?: string;
    email: string;
    bookings_count: number;
    client_category: ClientCategory[]; // For GET
    organisation: Organisation[]; // For GET
    leadperson: string;
    created_by?: number;
}

export interface Venue {
    id: number;
    name: string;
    address: string;
    capacity: number;
    region: string;
    type_of_venue: 'home' | 'ground' | 'hall' | 'other';
    contact_person?: string;
    contact_phone?: string;
    created_by?: number;
}

export interface AppEvent {
    id: number;
    name: string;
    eventId?: string;
    company?: 'redmagic events' | 'bling square events';
    client: Client;
    venue: Venue;
    start_date: string;
    end_date: string;
    type_of_event: string;
    category: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    eventlead: string;
    created_by_name?: string;
    client_category_for_event?: number | ClientCategory; // ID for POST, Object for GET
    organisation_for_event?: number | Organisation; // ID for POST, Object for GET
}

export interface Lead {
    id: number;
    client: Client;
    event?: AppEvent | number; // Linked event (initially a placeholder), can be object or ID
    event_id?: number; // Event ID when converted
    user_name?: string;
    source: 'online' | 'offline';
    message?: string;
    referral?: string;
    reject: boolean;
    convert: boolean;
    created_at: string;
    updated_at?: string;
    status: 'pending' | 'converted' | 'rejected';
}

export interface LeadCreatePayload {
    client: {
        name: string;
        email: string;
        number: string;
        client_category: number[]; // IDs
        organisation?: number[] | { name: string }[]; // IDs or new org objects
    } | number; // Or just client ID
    venue: {
        name: string;
        address?: string;
        capacity?: number;
        type_of_venue?: string;
        region?: string;
    } | number; // Or just venue ID
    source: string;
    message: string;
    referral?: string;
    type_of_event?: string;
    category?: string;
    start_date?: string;
    end_date?: string;
    event_dates?: string[];
}

export interface LeadConvertPayload {
    company: 'redmagic events' | 'bling square events';
    client_category: 'b2b' | 'b2c' | 'b2g'; // Code
    organisation?: number; // ID
    venue: number | { name: string; address?: string; capacity?: number };
    start_date: string;
    end_date: string;
    type_of_event: string;
    category: string;
    event_dates?: { date: string }[];
    vendors?: number[];
}

export interface CreateClientRequest {
    name: string;
    email: string;
    number: string;
    client_category: number[];
    organisation?: number[];
}

export interface CreateVenueRequest {
    name: string;
    address: string;
    capacity: number;
    type_of_venue: string;
    region: string;
}

export interface LeadStatistics {
    total_leads: number;
    converted_leads: number;
    rejected_leads: number;
    pending_leads: number;
    conversion_rate: number;
}

// Finance Management Types
export interface Sales {
    id: number;
    amount: number;
    discount: number;
    date: string;
    payment_status: 'completed' | 'pending' | 'not_yet';
    event: number;
    created_by?: number;
    payments?: SalesPayment[];
    created_at?: string;
    updated_at?: string;
}

export interface SalesPayment {
    id: number;
    sale: number;
    payment_amount: number;
    payment_date: string;
    mode_of_payment: 'cash' | 'cheque' | 'upi' | 'bank_transfer';
    notes?: string;
}

export interface Expense {
    id: number;
    event?: number;
    vendor?: number;
    created_by: number;
    particulars: string;
    booked_by?: string;
    paid_to?: string;
    details: string;
    amount: number;
    payment_status: 'paid' | 'not_paid' | 'partial_paid';
    mode_of_payment: 'Cash' | 'Credit Card' | 'Debit Card' | 'Cheque' | 'Bank Transfer' | 'Gpay' | 'Other';
    payment_made_by: string;
    photo?: string;
    date: string;
    expense_date: string;
    reimbursed: string;
    bill_evidence: 'yes' | 'no';
    bill_no?: string;
    created_at: string;
    updated_at: string;
}

export interface FinanceSummary {
    total_sales: number;
    total_expenses: number;
    net_profit: number;
    payment_status: {
        completed: number;
        pending: number;
        not_yet: number;
    };
    expense_status: {
        paid: number;
        not_paid: number;
        partial_paid: number;
    };
}

// Aliases for compatibility with service
export type CreateLeadRequest = LeadCreatePayload;
export type ConvertLeadRequest = LeadConvertPayload;
