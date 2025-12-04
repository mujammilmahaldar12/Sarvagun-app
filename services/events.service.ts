import { apiClient } from '@lib/api';
import type {
  Lead,
  Event,
  Client,
  Venue,
  Vendor,
  EventVendor,
  GoodsList,
  ClientCategory,
  Organisation,
  CreateLeadRequest,
  ConvertLeadRequest,
  CreateClientRequest,
  CreateVenueRequest,
  CreateGoodsListRequest,
  LeadStatistics,
  EventStatistics,
  ClientStatistics,
  Sales,
  Expense,
  FinanceSummary,
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
    start_date?: string;
    end_date?: string;
  }) {
    try {
      console.log('🌐 Calling API /events/leads/ with params:', params);
      const response = await apiClient.get<any>('/events/leads/', { params });

      console.log('📊 Leads API Response:', {
        responseType: typeof response,
        hasResults: response && 'results' in response,
        count: response?.count,
        resultsLength: response?.results?.length
      });

      // Return paginated response with metadata
      if (response && 'results' in response) {
        return {
          results: response.results || [],
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
        };
      }

      // Fallback for non-paginated responses
      const results = Array.isArray(response) ? response : [];
      return { results, count: results.length, next: null, previous: null };
    } catch (error) {
      // Silently handle leads fetch error - non-critical
      console.log('⚠️ Leads API call failed (non-critical)');
      throw error;
    }
  }

  async getLeadById(id: number) {
    try {
      const response = await apiClient.get<Lead>(`/events/leads/${id}/`);
      return response;
    } catch (error) {
      console.error('Error fetching lead details:', error);
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
      console.log('🌐 Calling API /events/events/ with params:', params);
      const response = await apiClient.get<any>('/events/events/', { params });

      console.log('📊 Events API Response (after apiClient processing):', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasResults: response && 'results' in response,
        length: Array.isArray(response) ? response.length : (response?.results?.length || 0),
        firstItem: Array.isArray(response) && response.length > 0 ? response[0] : null
      });

      // Handle paginated response
      const events = response && 'results' in response ? response.results : (Array.isArray(response) ? response : []);
      console.log('✅ Returning', events.length, 'events');
      return events;
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
   * @deprecated Events can only be created by converting leads. Use convertLeadToEvent() instead.
   * This method is blocked by the backend and will return 403 Forbidden.
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
    try {
      console.log('🌐 Calling API /events/clients/ with params:', params);
      const response = await apiClient.get<any>('/events/clients/', { params });

      console.log('📊 Clients API Response:', {
        isArray: Array.isArray(response),
        hasResults: response && 'results' in response,
        length: Array.isArray(response) ? response.length : (response?.results?.length || 0)
      });

      // Handle paginated response
      const clients = response && 'results' in response ? response.results : (Array.isArray(response) ? response : []);
      console.log('✅ Returning', clients.length, 'clients');
      return clients;
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      throw error;
    }
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
    try {
      console.log('🌐 Calling API /events/venues/ with params:', params);
      const response = await apiClient.get<any>('/events/venues/', { params });

      console.log('📊 Venues API Response:', {
        isArray: Array.isArray(response),
        hasResults: response && 'results' in response,
        length: Array.isArray(response) ? response.length : (response?.results?.length || 0)
      });

      // Handle paginated response
      const venues = response && 'results' in response ? response.results : (Array.isArray(response) ? response : []);
      console.log('✅ Returning', venues.length, 'venues');
      return venues;
    } catch (error) {
      console.error('❌ Error fetching venues:', error);
      throw error;
    }
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
  /**
   * Get all client categories (B2B, B2C, B2G)
   */
  async getClientCategories() {
    try {
      const response = await apiClient.get<any>('/events/client-categories/');
      return Array.isArray(response) ? response : (response?.results || []);
    } catch (error) {
      console.error('Error fetching client categories:', error);
      return [];
    }
  }

  /**
   * Get all organisations
   */
  async getOrganisations(params?: { search?: string }) {
    try {
      const response = await apiClient.get<any>('/events/organisations/', { params });
      return Array.isArray(response) ? response : (response?.results || []);
    } catch (error) {
      console.error('Error fetching organisations:', error);
      return [];
    }
  }

  /**
   * Create new organisation
   */
  async createOrganisation(data: Partial<Organisation>) {
    return await apiClient.post<Organisation>('/events/organisations/', data);
  }

  // ==================== EVENT VENDORS ====================

  /**
   * Get vendors assigned to an event
   */
  async getEventVendors(eventId: number) {
    try {
      return await apiClient.get<EventVendor[]>(`/events/events/${eventId}/vendors/`);
    } catch (error) {
      console.error('Error fetching event vendors:', error);
      throw error;
    }
  }

  /**
   * Assign vendor to event
   */
  async assignVendorToEvent(eventId: number, data: {
    vendor_id: number;
    bill_value: number;
    completion_date: string;
    image?: any;
  }) {
    try {
      const formData = new FormData();
      formData.append('vendor', data.vendor_id.toString());
      formData.append('bill_value', data.bill_value.toString());
      formData.append('completion_date', data.completion_date);
      if (data.image) {
        formData.append('image', data.image);
      }

      return await apiClient.post<EventVendor>(
        `/events/events/${eventId}/vendors/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
    } catch (error) {
      console.error('Error assigning vendor to event:', error);
      throw error;
    }
  }

  /**
   * Update event vendor assignment
   */
  async updateEventVendor(eventId: number, vendorId: number, data: Partial<EventVendor>) {
    try {
      return await apiClient.patch<EventVendor>(
        `/events/events/${eventId}/vendors/${vendorId}/`,
        data
      );
    } catch (error) {
      console.error('Error updating event vendor:', error);
      throw error;
    }
  }

  /**
   * Remove vendor from event (soft delete)
   */
  async removeVendorFromEvent(eventId: number, vendorId: number) {
    try {
      await apiClient.delete(`/events/events/${eventId}/vendors/${vendorId}/`);
    } catch (error) {
      console.error('Error removing vendor from event:', error);
      throw error;
    }
  }

  // ==================== GOODS LIST ====================

  /**
   * Get all goods lists with filtering
   */
  async getGoodsLists(params?: {
    event_id?: number;
    sender?: number;
    receiver?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) {
    try {
      const response = await apiClient.get<GoodsList[]>('/events/goods/', { params });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching goods lists:', error);
      throw error;
    }
  }

  /**
   * Get single goods list by ID
   */
  async getGoodsList(id: number) {
    try {
      return await apiClient.get<GoodsList>(`/events/goods/${id}/`);
    } catch (error) {
      console.error('Error fetching goods list:', error);
      throw error;
    }
  }

  /**
   * Create new goods list
   */
  async createGoodsList(data: CreateGoodsListRequest) {
    try {
      return await apiClient.post<GoodsList>('/events/goods/', data);
    } catch (error) {
      console.error('Error creating goods list:', error);
      throw error;
    }
  }

  /**
   * Update goods list
   */
  async updateGoodsList(id: number, data: Partial<CreateGoodsListRequest>) {
    try {
      return await apiClient.patch<GoodsList>(`/events/goods/${id}/`, data);
    } catch (error) {
      console.error('Error updating goods list:', error);
      throw error;
    }
  }

  /**
   * Delete goods list (soft delete)
   */
  async deleteGoodsList(id: number) {
    try {
      return await apiClient.delete(`/events/goods/${id}/`);
    } catch (error) {
      console.error('Error deleting goods list:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get events analytics
   */
  async getEventsAnalytics(timeRange: string = '30days') {
    return await apiClient.get<any>(`/events/analytics/events/?range=${timeRange}`);
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics() {
    try {
      return await apiClient.get<LeadStatistics>('/events/leads/statistics/');
    } catch (error) {
      console.error('Error fetching lead statistics:', error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(params?: {
    start_date?: string;
    end_date?: string;
    company?: string;
  }) {
    try {
      return await apiClient.get<EventStatistics>('/events/statistics/', { params });
    } catch (error) {
      console.error('Error fetching event statistics:', error);
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  async getClientStatistics() {
    try {
      return await apiClient.get<ClientStatistics>('/events/clients/statistics/');
    } catch (error) {
      console.error('Error fetching client statistics:', error);
      throw error;
    }
  }

  // ==================== FINANCE ====================

  /**
   * Get sales records for an event
   */
  /**
   * Get sales records for an event
   */
  async getEventSales(eventId: number) {
    try {
      const response = await apiClient.get<any>(`/finance_management/sales/?event=${eventId}`);
      return Array.isArray(response) ? response : response?.results || [];
    } catch (error) {
      console.error('Error fetching event sales:', error);
      throw error;
    }
  }

  /**
   * Get expenses for an event
   */
  async getEventExpenses(eventId: number) {
    try {
      const response = await apiClient.get<any>(`/finance_management/expenses/?event=${eventId}`);
      return Array.isArray(response) ? response : response?.results || [];
    } catch (error) {
      console.error('Error fetching event expenses:', error);
      throw error;
    }
  }

  /**
   * Get finance summary for an event
   */
  async getEventFinanceSummary(eventId: number) {
    try {
      return await apiClient.get<any>(`/finance_management/events/${eventId}/summary/`);
    } catch (error) {
      console.error('Error fetching finance summary:', error);
      // Return fallback summary
      return {
        total_sales: 0,
        total_expenses: 0,
        net_profit: 0,
        payment_status: { completed: 0, pending: 0, not_yet: 0 },
        expense_status: { paid: 0, not_paid: 0, partial_paid: 0 },
      };
    }
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
