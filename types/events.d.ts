// Event Management Type Definitions

export interface ClientCategory {
  id: number;
  name: string;
  code?: string;  // B2B, B2C, B2G codes
  description?: string;
  requires_organisation?: boolean; // Whether this category requires organisation details
  created_at: string;
  updated_at: string;
}

export interface Organisation {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  number?: string;
  email?: string;
  bookings_count: number;
  category?: ClientCategory[];  // Array because it's ManyToMany
  organisation?: Organisation[];  // Array because it's ManyToMany
  client_category?: ClientCategory[];  // Raw field name
  leadperson?: string;
  created_by?: number;
  is_active: boolean;
}

export interface Lead {
  id: number;
  client: Client;
  venue?: Venue;  // Venue from linked event (populated by serializer)
  event_id?: number;  // Event ID
  source: 'online' | 'offline';
  message?: string;
  status: 'pending' | 'converted' | 'rejected';
  user: number;
  user_name?: string;
  event?: number | Event;  // Can be ID or full object
  reject: boolean;
  convert: boolean;
  referral?: string;
  is_active: boolean;
  created_at: string;
  sales?: number;  // Optional sales FK
}

export interface GoodsList {
  id: number;
  sender: number;
  sender_name?: string;
  receiver: number;
  receiver_name?: string;
  event: number | Event;
  event_details?: Event;
  venue: number | Venue;
  venue_details?: Venue;
  type_of_event: string;
  event_date: string;
  event_start_at: string;
  event_end_at: string;
  day_of_event: string;
  list_of_good: string;  // JSON string or text
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  capacity?: number;
  contact_person?: string;
  contact_phone?: string;
  facilities?: string;
  type?: string;
  created_by: number;
}

export interface Vendor {
  id: number;
  name: string;
  organization_name: string;
  gstin?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  category: string;
  comments?: string;
}

export interface EventActiveDay {
  date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
}

export interface EventVendor {
  id?: number;
  event: number;
  vendor: number | Vendor;  // Can be ID or full object
  vendor_details?: Vendor;   // Populated by serializer
  work_assigned: number;
  work_assigned_name?: string;
  bill_value: number;
  date: string;
  completion_date: string;
  image?: string;
  is_active: boolean;
}

export interface Event {
  id: number;
  name?: string;
  eventId?: string;
  company?: 'redmagic events' | 'bling square events' | string;
  client: Client | number;
  client_details?: Client;
  venue: Venue | number;
  venue_details?: Venue;
  client_category_for_event?: ClientCategory | number;
  organisation_for_event?: Organisation | number;
  description?: string;
  start_date: string;
  end_date: string;
  type_of_event?: string;
  category?: 'social events' | 'weddings' | 'corporate events' | 'religious events' | 'sports' | 'other';
  duration?: string;
  active_days: EventActiveDay[];
  event_vendors?: EventVendor[];  // Optional, might not always be loaded
  vendors?: Vendor[];              // ManyToMany relationship
  goods_list?: GoodsList[];        // Related goods
  total_budget?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  eventlead?: string;
  lead?: number | Lead;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Request payloads
export interface CreateLeadRequest {
  client_data: {
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address?: string;
    category_id: number;
    organisation_id?: number;
  };
  source?: string;
  notes?: string;
}

export interface ConvertLeadRequest {
  event_name?: string;
  venue_id?: number;
  description?: string;
  start_date: string;
  end_date: string;
  active_days?: EventActiveDay[];
  event_vendors?: EventVendor[];
  total_budget?: number;
  company?: string;
  client_category?: string;
  organisation?: number;
  venue?: number;
  type_of_event?: string;
  category?: string;
  event_dates?: EventActiveDay[];
}

export interface CreateClientRequest {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  category_ids: number[];  // Changed to array for multi-select
  organisation_ids?: number[];  // Changed to array for multi-select
  
  // Legacy single-select support (deprecated)
  category_id?: number;
  organisation_id?: number;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  capacity?: number;
  contact_person?: string;
  contact_phone?: string;
// Goods List Request
export interface CreateGoodsListRequest {
  sender: number;
  receiver: number;
  event: number;
  venue: number;
  type_of_event: string;
  event_date: string;
  event_start_at: string;
  event_end_at: string;
  day_of_event: string;
  list_of_good: string;
}

export interface UpdateGoodsListRequest extends Partial<CreateGoodsListRequest> {
  id: number;
}

// Statistics
export interface LeadStatistics {
  total_leads: number;
  pending_leads: number;
  converted_leads: number;
  rejected_leads: number;
  conversion_rate: number;
}

export interface EventStatistics {
  total_events: number;
  scheduled_events: number;
  ongoing_events: number;
  completed_events: number;
  cancelled_events: number;
  total_revenue?: number;
  average_event_duration?: number;
}

export interface ClientStatistics {
  total_clients: number;
  b2b_clients: number;
  b2c_clients: number;
  b2g_clients: number;
  active_clients: number;
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
