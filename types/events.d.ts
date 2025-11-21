// Event Management Type Definitions

export interface ClientCategory {
  id: number;
  name: string;
  code?: string;  // B2B, B2C, B2G codes
  description?: string;
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
  source?: string;
  message?: string;
  status: 'pending' | 'converted' | 'rejected';
  user: number;
  user_name?: string;
  event?: number;
  reject: boolean;
  convert: boolean;
  referral?: string;
  is_active: boolean;
  created_at: string;
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
  service_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

export interface EventActiveDay {
  date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
}

export interface EventVendor {
  vendor_id: number;
  service_type: string;
  budget?: number;
}

export interface Event {
  id: number;
  name: string;
  client: Client;
  venue: Venue;
  description?: string;
  start_date: string;
  end_date: string;
  active_days: EventActiveDay[];
  event_vendors: EventVendor[];
  total_budget?: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  lead: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
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
  category_id: number;
  organisation_id?: number;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  capacity?: number;
  contact_person?: string;
  contact_phone?: string;
  facilities?: string;
}

// Statistics
export interface LeadStatistics {
  total_leads: number;
  pending_leads: number;
  converted_leads: number;
  rejected_leads: number;
  conversion_rate: number;
}
