/**
 * Events Store - Centralized State Management
 * Professional Zustand store for event management module
 */
import React from 'react';
import { create } from "zustand";
import eventsService from "../services/events.service";
import type {
  Lead,
  AppEvent,
  Client,
  Venue,
  ClientCategory,
  Organisation,
  LeadStatistics,
  CreateLeadRequest,
  ConvertLeadRequest,
  CreateClientRequest,
  CreateVenueRequest,
} from "../types/events";

// Types for better state management
type LoadingState = {
  [key: string]: boolean;
};

type ErrorState = {
  [key: string]: string | null;
};

type FilterState = {
  leads: {
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  };
  events: {
    status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  };
  clients: {
    category?: number;
    search?: string;
    [key: string]: any;
  };
  venues: {
    search?: string;
    [key: string]: any;
  };
};

type CacheState = {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // time to live in ms
  };
};

interface EventsState {
  // Data
  leads: Lead[];
  events: AppEvent[];
  clients: Client[];
  venues: Venue[];
  clientCategories: ClientCategory[];
  organisations: Organisation[];
  leadStatistics: LeadStatistics | null;

  // UI State
  loading: LoadingState;
  errors: ErrorState;
  filters: FilterState;

  // Cache Management
  cache: CacheState;

  // Pagination
  pagination: {
    leads: { page: number; hasMore: boolean; total?: number };
    events: { page: number; hasMore: boolean; total?: number };
    clients: { page: number; hasMore: boolean; total?: number };
    venues: { page: number; hasMore: boolean; total?: number };
  };

  // Selected Items (for UI state)
  selectedItems: {
    lead?: Lead;
    event?: AppEvent;
    client?: Client;
    venue?: Venue;
  };

  // Actions - Data Fetching
  fetchLeads: (refresh?: boolean) => Promise<void>;
  fetchEvents: (refresh?: boolean) => Promise<void>;
  fetchClients: (refresh?: boolean) => Promise<void>;
  fetchVenues: (refresh?: boolean) => Promise<void>;
  fetchClientCategories: (refresh?: boolean) => Promise<void>;
  fetchOrganisations: (refresh?: boolean) => Promise<void>;
  fetchLeadStatistics: (refresh?: boolean) => Promise<void>;

  // Actions - Data Manipulation
  createLead: (data: CreateLeadRequest) => Promise<Lead>;
  updateLead: (id: number, data: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: number) => Promise<void>;
  convertLead: (id: number, data: ConvertLeadRequest) => Promise<Event>;
  rejectLead: (id: number, reason?: string) => Promise<Lead>;

  createClient: (data: CreateClientRequest) => Promise<Client>;
  updateClient: (id: number, data: Partial<CreateClientRequest>) => Promise<Client>;
  deleteClient: (id: number) => Promise<void>;

  createVenue: (data: CreateVenueRequest) => Promise<Venue>;
  updateVenue: (id: number, data: Partial<CreateVenueRequest>) => Promise<Venue>;
  deleteVenue: (id: number) => Promise<void>;

  updateEvent: (id: number, data: Partial<AppEvent>) => Promise<AppEvent>;
  deleteEvent: (id: number) => Promise<void>;

  // Actions - UI State
  setFilter: (entity: keyof FilterState, filters: any) => void;
  clearFilters: (entity?: keyof FilterState) => void;
  setSelectedItem: (type: keyof EventsState['selectedItems'], item: any) => void;
  clearSelection: () => void;

  // Actions - Utility
  clearCache: (key?: string) => void;
  clearErrors: (key?: string) => void;
  reset: () => void;

  // Cache helpers
  getCachedData: <T>(key: string, fallback?: T) => T | null;
  setCachedData: <T>(key: string, data: T, ttl?: number) => void;

  // Computed getters
  getFilteredLeads: () => Lead[];
  getFilteredEvents: () => AppEvent[];
  getFilteredClients: () => Client[];
  getFilteredVenues: () => Venue[];

  // Statistics helpers
  getLeadsByStatus: () => Record<string, Lead[]>;
  getEventsByStatus: () => Record<string, AppEvent[]>;
  getTotalCounts: () => {
    leads: number;
    events: number;
    clients: number;
    venues: number;
  };
}

const CACHE_TTL = {
  DEFAULT: 5 * 60 * 1000, // 5 minutes
  REFERENCE: 30 * 60 * 1000, // 30 minutes for categories, organisations
  STATISTICS: 2 * 60 * 1000, // 2 minutes for statistics
};

const initialFilters: FilterState = {
  leads: {},
  events: {},
  clients: {},
  venues: {},
};

export const useEventsStore = create<EventsState>((set, get) => ({
  // Initial Data State
  leads: [],
  events: [],
  clients: [],
  venues: [],
  clientCategories: [],
  organisations: [],
  leadStatistics: null,

  // Initial UI State
  loading: {},
  errors: {},
  filters: initialFilters,
  cache: {},

  pagination: {
    leads: { page: 1, hasMore: true },
    events: { page: 1, hasMore: true },
    clients: { page: 1, hasMore: true },
    venues: { page: 1, hasMore: true },
  },

  selectedItems: {},

  // Helper Functions
  getCachedData: <T>(key: string, fallback?: T): T | null => {
    const cached = get().cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return fallback || null;
  },

  setCachedData: <T>(key: string, data: T, ttl = CACHE_TTL.DEFAULT) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp: Date.now(), ttl }
      }
    }));
  },

  // Data Fetching Actions
  fetchLeads: async (refresh = false) => {
    const cacheKey = `leads-${JSON.stringify(get().filters.leads)}`;

    console.log('🔍 fetchLeads called:', { refresh, cacheKey, currentLeadsCount: get().leads.length });

    if (!refresh) {
      const cached = get().getCachedData<Lead[]>(cacheKey);
      if (cached) {
        console.log('✅ Using cached leads:', cached.length);
        set({ leads: cached });
        return;
      }
    }

    console.log('📡 Fetching leads from API...');
    set((state) => ({
      loading: { ...state.loading, leads: true },
      errors: { ...state.errors, leads: null }
    }));

    try {
      const queryParams = {
        ...get().filters.leads,
        page_size: 500  // Request 500 leads to get all data
      };
      console.log('🔍 fetchLeads: Calling service with params:', JSON.stringify(queryParams));

      const response = await eventsService.getLeads(queryParams);

      // Extract results array from paginated response
      const leads = response.results || [];
      console.log('✅ Leads fetched successfully:', leads.length, 'of', response.count);
      set({ leads });
      console.log('📦 Leads stored in state:', get().leads.length);
      get().setCachedData(cacheKey, leads);
    } catch (error) {
      // Silently handle leads fetch error - non-critical
      console.log('⚠️ Leads fetch skipped (non-critical)');
      set((state) => ({
        errors: {
          ...state.errors,
          leads: null // Don't show error since it's non-critical
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, leads: false }
      }));
    }
  },

  fetchEvents: async (refresh = false) => {
    const cacheKey = `events-${JSON.stringify(get().filters.events)}`;

    console.log('🔍 fetchEvents called:', { refresh, cacheKey, currentEventsCount: get().events.length });

    if (!refresh) {
      const cached = get().getCachedData<AppEvent[]>(cacheKey);
      if (cached) {
        console.log('✅ Using cached events:', cached.length);
        set({ events: cached });
        return;
      }
    }

    console.log('📡 Fetching events from API...');
    set((state) => ({
      loading: { ...state.loading, events: true },
      errors: { ...state.errors, events: null }
    }));

    try {
      const queryParams = {
        ...get().filters.events,
        page_size: 500  // Request 500 events to get all data
      };
      console.log('🔍 fetchEvents: Calling service with params:', JSON.stringify(queryParams));

      const events = await eventsService.getEvents(queryParams);

      console.log('✅ Events fetched successfully:', events.length);
      set({ events });
      get().setCachedData(cacheKey, events);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      set((state) => ({
        errors: {
          ...state.errors,
          events: error instanceof Error ? error.message : 'Failed to fetch events'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, events: false }
      }));
    }
  },

  fetchClients: async (refresh = false) => {
    const cacheKey = `clients-${JSON.stringify(get().filters.clients)}`;

    console.log('🔍 fetchClients called:', { refresh, cacheKey, currentClientsCount: get().clients.length });

    if (!refresh) {
      const cached = get().getCachedData<Client[]>(cacheKey);
      if (cached) {
        console.log('✅ Using cached clients:', cached.length);
        set({ clients: cached });
        return;
      }
    }

    console.log('📡 Fetching clients from API...');
    set((state) => ({
      loading: { ...state.loading, clients: true },
      errors: { ...state.errors, clients: null }
    }));

    try {
      const clients = await eventsService.getClients(get().filters.clients);

      console.log('✅ Clients fetched successfully:', clients.length);
      set({ clients });
      get().setCachedData(cacheKey, clients);
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          clients: error instanceof Error ? error.message : 'Failed to fetch clients'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, clients: false }
      }));
    }
  },

  fetchVenues: async (refresh = false) => {
    const cacheKey = `venues-${JSON.stringify(get().filters.venues)}`;

    if (!refresh) {
      const cached = get().getCachedData<Venue[]>(cacheKey);
      if (cached) {
        set({ venues: cached });
        return;
      }
    }

    set((state) => ({
      loading: { ...state.loading, venues: true },
      errors: { ...state.errors, venues: null }
    }));

    try {
      const venues = await eventsService.getVenues(get().filters.venues);

      set({ venues });
      get().setCachedData(cacheKey, venues);
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          venues: error instanceof Error ? error.message : 'Failed to fetch venues'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, venues: false }
      }));
    }
  },

  fetchClientCategories: async (refresh = false) => {
    const cacheKey = 'client-categories';

    if (!refresh) {
      const cached = get().getCachedData<ClientCategory[]>(cacheKey);
      if (cached) {
        set({ clientCategories: cached });
        return;
      }
    }

    set((state) => ({
      loading: { ...state.loading, clientCategories: true },
      errors: { ...state.errors, clientCategories: null }
    }));

    try {
      const clientCategories = await eventsService.getClientCategories();

      set({ clientCategories });
      get().setCachedData(cacheKey, clientCategories, CACHE_TTL.REFERENCE);
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          clientCategories: error instanceof Error ? error.message : 'Failed to fetch categories'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, clientCategories: false }
      }));
    }
  },

  fetchOrganisations: async (refresh = false) => {
    const cacheKey = 'organisations';

    if (!refresh) {
      const cached = get().getCachedData<Organisation[]>(cacheKey);
      if (cached) {
        set({ organisations: cached });
        return;
      }
    }

    set((state) => ({
      loading: { ...state.loading, organisations: true },
      errors: { ...state.errors, organisations: null }
    }));

    try {
      const organisations = await eventsService.getOrganisations();

      set({ organisations });
      get().setCachedData(cacheKey, organisations, CACHE_TTL.REFERENCE);
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          organisations: error instanceof Error ? error.message : 'Failed to fetch organisations'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, organisations: false }
      }));
    }
  },

  fetchLeadStatistics: async (refresh = false) => {
    const cacheKey = 'lead-statistics';

    if (!refresh) {
      const cached = get().getCachedData<LeadStatistics>(cacheKey);
      if (cached) {
        set({ leadStatistics: cached });
        return;
      }
    }

    set((state) => ({
      loading: { ...state.loading, statistics: true },
      errors: { ...state.errors, statistics: null }
    }));

    try {
      const leadStatistics = await eventsService.getLeadStatistics();

      set({ leadStatistics });
      get().setCachedData(cacheKey, leadStatistics, CACHE_TTL.STATISTICS);
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          statistics: error instanceof Error ? error.message : 'Failed to fetch statistics'
        }
      }));
    } finally {
      set((state) => ({
        loading: { ...state.loading, statistics: false }
      }));
    }
  },

  // CRUD Operations for Leads
  createLead: async (data: CreateLeadRequest) => {
    set((state) => ({
      loading: { ...state.loading, createLead: true },
      errors: { ...state.errors, createLead: null }
    }));

    try {
      const newLead = await eventsService.createLeadComplete(data);

      set((state) => ({
        leads: [newLead, ...state.leads]
      }));

      // Invalidate cache
      get().clearCache('leads');
      get().fetchLeadStatistics(true); // Refresh statistics

      return newLead;
    } catch (error) {
      set((state) => ({
        errors: {
          ...state.errors,
          createLead: error instanceof Error ? error.message : 'Failed to create lead'
        }
      }));
      throw error;
    } finally {
      set((state) => ({
        loading: { ...state.loading, createLead: false }
      }));
    }
  },

  updateLead: async (id: number, data: Partial<Lead>) => {
    try {
      const updatedLead = await eventsService.updateLead(id, data);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? { ...lead, ...updatedLead } : lead
        )
      }));

      get().clearCache('leads');
      return updatedLead;
    } catch (error) {
      throw error;
    }
  },

  deleteLead: async (id: number) => {
    try {
      await eventsService.deleteLead(id);

      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id)
      }));

      get().clearCache('leads');
      get().fetchLeadStatistics(true);
    } catch (error) {
      throw error;
    }
  },

  convertLead: async (id: number, data: ConvertLeadRequest) => {
    try {
      const newEvent = await eventsService.convertLeadToEvent(id, data);

      // Update lead status
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? { ...lead, status: 'converted', convert: true } : lead
        ),
        events: [newEvent, ...state.events]
      }));

      get().clearCache();
      get().fetchLeadStatistics(true);

      return newEvent;
    } catch (error) {
      throw error;
    }
  },

  rejectLead: async (id: number, reason?: string) => {
    try {
      const updatedLead = await eventsService.rejectLead(id, reason);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? { ...lead, ...updatedLead } : lead
        )
      }));

      get().clearCache('leads');
      get().fetchLeadStatistics(true);

      return updatedLead;
    } catch (error) {
      throw error;
    }
  },

  // CRUD Operations for Clients
  createClient: async (data: CreateClientRequest) => {
    try {
      const newClient = await eventsService.createClient(data);

      set((state) => ({
        clients: [newClient, ...state.clients]
      }));

      get().clearCache('clients');
      return newClient;
    } catch (error) {
      throw error;
    }
  },

  updateClient: async (id: number, data: Partial<CreateClientRequest>) => {
    try {
      const updatedClient = await eventsService.updateClient(id, data);

      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? { ...client, ...updatedClient } : client
        )
      }));

      get().clearCache('clients');
      return updatedClient;
    } catch (error) {
      throw error;
    }
  },

  deleteClient: async (id: number) => {
    try {
      await eventsService.deleteClient(id);

      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id)
      }));

      get().clearCache('clients');
    } catch (error) {
      throw error;
    }
  },

  // CRUD Operations for Venues
  createVenue: async (data: CreateVenueRequest) => {
    try {
      const newVenue = await eventsService.createVenue(data);

      set((state) => ({
        venues: [newVenue, ...state.venues]
      }));

      get().clearCache('venues');
      return newVenue;
    } catch (error) {
      throw error;
    }
  },

  updateVenue: async (id: number, data: Partial<CreateVenueRequest>) => {
    try {
      const updatedVenue = await eventsService.updateVenue(id, data);

      set((state) => ({
        venues: state.venues.map((venue) =>
          venue.id === id ? { ...venue, ...updatedVenue } : venue
        )
      }));

      get().clearCache('venues');
      return updatedVenue;
    } catch (error) {
      throw error;
    }
  },

  deleteVenue: async (id: number) => {
    try {
      await eventsService.deleteVenue(id);

      set((state) => ({
        venues: state.venues.filter((venue) => venue.id !== id)
      }));

      get().clearCache('venues');
    } catch (error) {
      throw error;
    }
  },

  // CRUD Operations for Events
  updateEvent: async (id: number, data: Partial<AppEvent>) => {
    try {
      const updatedEvent = await eventsService.updateEvent(id, data);

      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? { ...event, ...updatedEvent } : event
        )
      }));

      get().clearCache('events');
      return updatedEvent;
    } catch (error) {
      throw error;
    }
  },

  deleteEvent: async (id: number) => {
    try {
      await eventsService.deleteEvent(id);

      set((state) => ({
        events: state.events.filter((event) => event.id !== id)
      }));

      get().clearCache('events');
    } catch (error) {
      throw error;
    }
  },

  // Filter Management
  setFilter: (entity: keyof FilterState, filters: any) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [entity]: { ...state.filters[entity], ...filters }
      }
    }));

    // Auto-fetch data when filters change
    switch (entity) {
      case 'leads':
        get().fetchLeads(true);
        break;
      case 'events':
        get().fetchEvents(true);
        break;
      case 'clients':
        get().fetchClients(true);
        break;
      case 'venues':
        get().fetchVenues(true);
        break;
    }
  },

  clearFilters: (entity?: keyof FilterState) => {
    if (entity) {
      set((state) => ({
        filters: { ...state.filters, [entity]: {} }
      }));
    } else {
      set({ filters: initialFilters });
    }
  },

  // Selection Management
  setSelectedItem: (type, item) => {
    set((state) => ({
      selectedItems: { ...state.selectedItems, [type]: item }
    }));
  },

  clearSelection: () => {
    set({ selectedItems: {} });
  },

  // Cache Management
  clearCache: (key?: string) => {
    if (key) {
      set((state) => {
        const newCache = { ...state.cache };
        // Remove all cache entries that start with the key
        Object.keys(newCache).forEach(cacheKey => {
          if (cacheKey.startsWith(key)) {
            delete newCache[cacheKey];
          }
        });
        return { cache: newCache };
      });
    } else {
      set({ cache: {} });
    }
  },

  // Error Management
  clearErrors: (key?: string) => {
    if (key) {
      set((state) => ({
        errors: { ...state.errors, [key]: null }
      }));
    } else {
      set({ errors: {} });
    }
  },

  // Reset Store
  reset: () => {
    set({
      leads: [],
      events: [],
      clients: [],
      venues: [],
      clientCategories: [],
      organisations: [],
      leadStatistics: null,
      loading: {},
      errors: {},
      filters: initialFilters,
      cache: {},
      selectedItems: {},
      pagination: {
        leads: { page: 1, hasMore: true },
        events: { page: 1, hasMore: true },
        clients: { page: 1, hasMore: true },
        venues: { page: 1, hasMore: true },
      }
    });
  },

  // Computed Getters
  getFilteredLeads: () => {
    const { leads, filters } = get();
    console.log('🔍 getFilteredLeads called:', {
      totalLeads: leads.length,
      filters: filters.leads,
      sampleLead: leads[0]
    });

    let filtered = [...leads];

    if (filters.leads.status && filters.leads.status !== 'all') {
      console.log('🔍 Filtering by status:', filters.leads.status);
      filtered = filtered.filter(lead => lead.status === filters.leads.status);
    }

    if (filters.leads.search) {
      const search = filters.leads.search.toLowerCase();
      console.log('🔍 Filtering by search:', search);
      filtered = filtered.filter(lead =>
        lead.client.name.toLowerCase().includes(search) ||
        lead.source?.toLowerCase().includes(search) ||
        lead.message?.toLowerCase().includes(search)
      );
    }

    console.log('✅ getFilteredLeads returning:', filtered.length, 'leads');
    return filtered;
  },

  getFilteredEvents: () => {
    const { events, filters } = get();
    let filtered = [...events];

    if (filters.events.status) {
      filtered = filtered.filter(event => event.status === filters.events.status);
    }

    if (filters.events.search) {
      const search = filters.events.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(search) ||
        event.client.name.toLowerCase().includes(search) ||
        event.venue.name.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  getFilteredClients: () => {
    const { clients, filters } = get();
    let filtered = [...clients];

    if (filters.clients.category) {
      filtered = filtered.filter(client =>
        (client as any).category?.some((cat: any) => cat.id === filters.clients.category)
      );
    }

    if (filters.clients.search) {
      const search = filters.clients.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(search) ||
        client.email?.toLowerCase().includes(search) ||
        client.leadperson?.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  getFilteredVenues: () => {
    const { venues, filters } = get();
    let filtered = [...venues];

    if (filters.venues.search) {
      const search = filters.venues.search.toLowerCase();
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(search) ||
        venue.location.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  // Statistics helpers
  getLeadsByStatus: () => {
    const { leads } = get();
    return leads.reduce((acc, lead) => {
      const status = lead.status || 'new';
      if (!acc[status]) acc[status] = [];
      acc[status].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  },

  getEventsByStatus: () => {
    const { events } = get();
    return events.reduce((acc, event) => {
      const status = event.status || 'upcoming';
      if (!acc[status]) acc[status] = [];
      acc[status].push(event);
      return acc;
    }, {} as Record<string, AppEvent[]>);
  },

  getTotalCounts: () => {
    const { leads, events, clients, venues } = get();
    return {
      leads: leads.length,
      events: events.length,
      clients: clients.length,
      venues: venues.length,
    };
  },
}));

// Selector Hooks
export const useLeads = () => {
  const store = useEventsStore();
  return {
    leads: store.leads,
    loading: store.loading.leads,
    error: store.errors.leads,
    statistics: store.leadStatistics,
    convert: store.convertLead,
    reject: store.rejectLead,
    delete: store.deleteLead,
    setFilter: (filters: any) => store.setFilter('leads', filters),
  };
};

export const useEvents = () => {
  const store = useEventsStore();
  return {
    events: store.events,
    loading: store.loading.events,
    error: store.errors.events,
    update: store.updateEvent,
    delete: store.deleteEvent,
    setFilter: (filters: any) => store.setFilter('events', filters),
  };
};

export const useClients = () => {
  const store = useEventsStore();
  return {
    clients: store.clients,
    loading: store.loading.clients,
    error: store.errors.clients,
    categories: store.clientCategories,
    create: store.createClient,
    update: store.updateClient,
    delete: store.deleteClient,
    setFilter: (filters: any) => store.setFilter('clients', filters),
  };
};

export const useVenues = () => {
  const store = useEventsStore();
  return {
    venues: store.venues,
    loading: store.loading.venues,
    error: store.errors.venues,
    create: store.createVenue,
    update: store.updateVenue,
    delete: store.deleteVenue,
    setFilter: (filters: any) => store.setFilter('venues', filters),
  };
};