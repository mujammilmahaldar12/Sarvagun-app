import { apiClient } from '@lib/api';
import type {
  Lead,
  Event,
  Client,
  Venue,
  ClientCategory,
  Organisation,
  CreateLeadRequest,
  ConvertLeadRequest,
  CreateClientRequest,
  CreateVenueRequest,
  LeadStatistics,
} from '@/types/events';

// Enhanced service with React Query support
class EventsService {
  // ==================== LEADS ====================
  
  /**
   * Get all leads with pagination support
   */
  async getLeads(params?: { 
    status?: string; 
    search?: string; 
    company?: string;
    created_date?: string;
    page?: number;
    page_size?: number;
  }) {
    try {
      return await apiClient.get<any>('/events/leads/', { params });
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(id: number) {
    try {
      return await apiClient.get<Lead>(`/events/leads/${id}/`);
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  /**
   * Create lead with existing client
   */
  async createLead(data: { client_id: number; source: string; notes?: string; referral?: string }) {
    try {
      return await apiClient.post<Lead>('/events/leads/', data);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Create lead with client in one atomic transaction
   */
  async createLeadComplete(data: CreateLeadRequest) {
    try {
      return await apiClient.post<Lead>('/events/leads/create-complete/', data);
    } catch (error) {
      console.error('Error creating complete lead:', error);
      throw error;
    }
  }

  /**
   * Convert lead to event (alias for convertLeadToEvent for React Query)
   */
  async convertLead(leadId: number, eventData: ConvertLeadRequest) {
    return this.convertLeadToEvent(leadId, eventData);
  }

  /**
   * Convert lead to event
   */
  async convertLeadToEvent(leadId: number, data: ConvertLeadRequest) {
    try {
      return await apiClient.post<Event>(`/events/leads/${leadId}/convert-to-event/`, data);
    } catch (error) {
      console.error('Error converting lead to event:', error);
      throw error;
    }
  }

  /**
   * Update lead (using service layer)
   */
  async updateLead(leadId: number, data: any) {
    try {
      return await apiClient.patch<Lead>(`/events/leads/${leadId}/update-lead/`, data);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Delete lead (soft delete)
   */
  async deleteLead(leadId: number) {
    return await apiClient.delete(`/events/leads/${leadId}/`);
  }

  /**
   * Reject a lead
   */
  async rejectLead(leadId: number, reason?: string) {
    return await apiClient.patch<Lead>(`/events/leads/${leadId}/`, { 
      reject: true,
      message: reason 
    });
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics() {
    return await apiClient.get<LeadStatistics>('/events/leads/statistics/');
  }

  // ==================== EVENTS ====================
  
  /**
   * Get all events with pagination support
   */
  async getEvents(params?: { 
    status?: string; 
    search?: string; 
    company?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }) {
    try {
      const response = await apiClient.get<any>('/events/events/', { params });
      
      // Debug: Log API response structure
      console.log('📊 Events API Response:', {
        total: response?.length || 0,
        isArray: Array.isArray(response),
        firstEvent: response?.[0],
        fields: response?.[0] ? Object.keys(response[0]) : [],
      });
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get single event by ID
   */
  async getEvent(id: number) {
    return await apiClient.get<Event>(`/events/events/${id}/`);
  }

  /**
   * Create new event
   */
  async createEvent(data: Partial<Event>) {
    return await apiClient.post<Event>('/events/events/', data);
  }

  /**
   * Update event
   */
  async updateEvent(id: number, data: Partial<Event>) {
    return await apiClient.patch<Event>(`/events/events/${id}/`, data);
  }

  /**
   * Delete event (soft delete)
   */
  async deleteEvent(id: number) {
    await apiClient.delete(`/events/events/${id}/`);
  }

  /**
   * Bulk update events
   */
  async bulkUpdateEvents(ids: number[], data: Partial<Event>) {
    return await apiClient.patch<Event[]>('/events/events/bulk-update/', { ids, data });
  }

  /**
   * Bulk delete events
   */
  async bulkDeleteEvents(ids: number[]) {
    return await apiClient.delete('/events/events/bulk-delete/', { data: { ids } });
  }

  // ==================== CLIENTS ====================
  
  /**
   * Get all clients
   */
  async getClients(params?: { category?: number; search?: string }) {
    return await apiClient.get<Client[]>('/events/clients/', { params });
  }

  /**
   * Get single client by ID
   */
  async getClient(id: number) {
    return await apiClient.get<Client>(`/events/clients/${id}/`);
  }

  /**
   * Create new client
   */
  async createClient(data: CreateClientRequest) {
    return await apiClient.post<Client>('/events/clients/', data);
  }

  /**
   * Update client
   */
  async updateClient(id: number, data: Partial<CreateClientRequest>) {
    return await apiClient.patch<Client>(`/events/clients/${id}/`, data);
  }

  /**
   * Delete client (soft delete)
   */
  async deleteClient(id: number) {
    await apiClient.delete(`/events/clients/${id}/`);
  }

  // ==================== VENUES ====================
  
  /**
   * Get all venues
   */
  async getVenues(params?: { search?: string }) {
    return await apiClient.get<Venue[]>('/events/venues/', { params });
  }

  /**
   * Get single venue by ID
   */
  async getVenue(id: number) {
    return await apiClient.get<Venue>(`/events/venues/${id}/`);
  }

  /**
   * Create new venue
   */
  async createVenue(data: CreateVenueRequest) {
    return await apiClient.post<Venue>('/events/venues/', data);
  }

  /**
   * Update venue
   */
  async updateVenue(id: number, data: Partial<CreateVenueRequest>) {
    return await apiClient.patch<Venue>(`/events/venues/${id}/`, data);
  }

  /**
   * Delete venue (soft delete)
   */
  async deleteVenue(id: number) {
    await apiClient.delete(`/events/venues/${id}/`);
  }

  // ==================== REFERENCE DATA ====================
  
  /**
   * Get all client categories (alias for React Query)
   */
  async getCategories() {
    return this.getClientCategories();
  }

  /**
   * Get all client categories (B2B, B2C, B2G)
   */
  async getClientCategories() {
    return await apiClient.get<ClientCategory[]>('/events/client-categories/');
  }

  /**
   * Get all organisations
   */
  async getOrganisations(params?: { search?: string }) {
    return await apiClient.get<Organisation[]>('/events/organisations/', { params });
  }

  /**
   * Create new organisation
   */
  async createOrganisation(data: Partial<Organisation>) {
    return await apiClient.post<Organisation>('/events/organisations/', data);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get events analytics
   */
  async getEventsAnalytics(timeRange: string = '30days') {
    return await apiClient.get<any>(`/events/analytics/events/?range=${timeRange}`);
  }

  // ==================== SEARCH ====================

  /**
   * Global search across events, leads, clients
   */
  async globalSearch(query: string) {
    return await apiClient.get<any>(`/events/search/?q=${encodeURIComponent(query)}`);
  }
}

export default new EventsService();
