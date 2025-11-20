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

class EventsService {
  // ==================== LEADS ====================
  
  /**
   * Get all leads
   */
  async getLeads(params?: { status?: string; search?: string }) {
    return await apiClient.get<Lead[]>('/events/leads/', { params });
  }

  /**
   * Get single lead by ID
   */
  async getLead(id: number) {
    return await apiClient.get<Lead>(`/events/leads/${id}/`);
  }

  /**
   * Create lead with existing client
   */
  async createLead(data: { client_id: number; source: string; notes?: string; referral?: string }) {
    return await apiClient.post<Lead>('/events/leads/', data);
  }

  /**
   * Create lead with client in one atomic transaction
   */
  async createLeadComplete(data: CreateLeadRequest) {
    return await apiClient.post<Lead>('/events/leads/create-complete/', data);
  }

  /**
   * Convert lead to event
   */
  async convertLeadToEvent(leadId: number, data: ConvertLeadRequest) {
    return await apiClient.post<Event>(`/events/leads/${leadId}/convert-to-event/`, data);
  }

  /**
   * Update lead
   */
  async updateLead(leadId: number, data: Partial<Lead>) {
    return await apiClient.patch<Lead>(`/events/leads/${leadId}/`, data);
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
   * Get all events
   */
  async getEvents(params?: { status?: string; search?: string }) {
    return await apiClient.get<Event[]>('/events/events/', { params });
  }

  /**
   * Get single event by ID
   */
  async getEvent(id: number) {
    return await apiClient.get<Event>(`/events/events/${id}/`);
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
}

export default new EventsService();
