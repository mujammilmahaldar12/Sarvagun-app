/**
 * Enhanced Events Service with React Query Integration
 * Professional data fetching, caching, and mutation handling
 * Enhanced with authentication state management
 */
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, queryClient, cacheUtils } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';
import eventsService from '../services/events.service';
import type { Event, Lead, Client, Venue } from '../types/events';

// Types for API responses with pagination
interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  total_pages: number;
}

interface EventFilters {
  search?: string;
  status?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

interface LeadFilters {
  search?: string;
  status?: string;
  company?: string;
  created_date?: string;
  page?: number;
  page_size?: number;
}

// ==================== EVENTS HOOKS ====================

// Fetch events with advanced filtering and pagination
export const useEvents = (filters: EventFilters = {}) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => eventsService.getEvents(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes for events data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
};

// Infinite scroll for events
export const useInfiniteEvents = (filters: Omit<EventFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.events.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => eventsService.getEvents({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage: PaginatedResponse<Event>) => {
      return lastPage.next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
};

// Fetch single event
export const useEvent = (eventId: number) => {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventsService.getEvent(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // Event details are less volatile
  });
};

// Create new event
export const useCreateEvent = () => {
  return useMutation({
    mutationFn: eventsService.createEvent,
    onSuccess: () => {
      // Invalidate and refetch events list
      cacheUtils.invalidateEvents();
      // Show success notification
      console.log('Event created successfully');
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
    },
  });
};

// Update existing event
export const useUpdateEvent = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => 
      eventsService.updateEvent(id, data),
    onSuccess: (updatedEvent) => {
      // Update the specific event in cache
      queryClient.setQueryData(
        queryKeys.events.detail(updatedEvent.id),
        updatedEvent
      );
      // Invalidate events list to reflect changes
      cacheUtils.invalidateEvents();
    },
  });
};

// Delete event
export const useDeleteEvent = () => {
  return useMutation({
    mutationFn: eventsService.deleteEvent,
    onSuccess: () => {
      cacheUtils.invalidateEvents();
    },
  });
};

// ==================== LEADS HOOKS ====================

// Fetch leads with filtering
export const useLeads = (filters: LeadFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: () => eventsService.getLeads(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000, // 1 minute for leads (more dynamic)
  });
};

// Infinite scroll for leads
export const useInfiniteLeads = (filters: Omit<LeadFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.leads.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => eventsService.getLeads({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage: PaginatedResponse<Lead>) => {
      return lastPage.next ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000,
  });
};

// Fetch single lead
export const useLead = (leadId: number) => {
  return useQuery({
    queryKey: queryKeys.leads.detail(leadId),
    queryFn: () => eventsService.getLead(leadId),
    enabled: !!leadId,
  });
};

// Create new lead
export const useCreateLead = () => {
  return useMutation({
    mutationFn: eventsService.createLead,
    onSuccess: () => {
      cacheUtils.invalidateLeads();
    },
  });
};

// Update lead
export const useUpdateLead = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lead> }) => 
      eventsService.updateLead(id, data),
    onSuccess: (updatedLead) => {
      queryClient.setQueryData(
        queryKeys.leads.detail(updatedLead.id),
        updatedLead
      );
      cacheUtils.invalidateLeads();
    },
  });
};

// Convert lead to event (special mutation)
export const useConvertLead = () => {
  return useMutation({
    mutationFn: ({ leadId, eventData }: { leadId: number; eventData: any }) => 
      eventsService.convertLead(leadId, eventData),
    onSuccess: () => {
      // Invalidate both leads and events since conversion affects both
      cacheUtils.invalidateLeads();
      cacheUtils.invalidateEvents();
    },
  });
};

// ==================== CLIENTS HOOKS ====================

// Fetch clients
export const useClients = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => eventsService.getClients(filters),
    staleTime: 10 * 60 * 1000, // Clients data is more stable
  });
};

// Fetch single client
export const useClient = (clientId: number) => {
  return useQuery({
    queryKey: queryKeys.clients.detail(clientId),
    queryFn: () => eventsService.getClient(clientId),
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000,
  });
};

// Create client
export const useCreateClient = () => {
  return useMutation({
    mutationFn: eventsService.createClient,
    onSuccess: () => {
      cacheUtils.invalidateClients();
    },
  });
};

// ==================== VENUES HOOKS ====================

// Fetch venues
export const useVenues = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.venues.list(filters),
    queryFn: () => eventsService.getVenues(filters),
    staleTime: 15 * 60 * 1000, // Venues are very stable
  });
};

// ==================== REFERENCE DATA HOOKS ====================

// Fetch categories (static reference data)
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: eventsService.getCategories,
    staleTime: 30 * 60 * 1000, // Categories rarely change
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
};

// Fetch organisations (static reference data)
export const useOrganisations = () => {
  return useQuery({
    queryKey: queryKeys.organisations,
    queryFn: eventsService.getOrganisations,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

// ==================== ANALYTICS HOOKS ====================

// Fetch events analytics with caching
export const useEventsAnalytics = (timeRange = '30days') => {
  return useQuery({
    queryKey: ['analytics', 'events', timeRange],
    queryFn: () => eventsService.getEventsAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // Analytics refresh every 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
};

// ==================== BULK OPERATIONS ====================

// Bulk update events
export const useBulkUpdateEvents = () => {
  return useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: Partial<Event> }) =>
      eventsService.bulkUpdateEvents(ids, data),
    onSuccess: () => {
      cacheUtils.invalidateEvents();
    },
  });
};

// Bulk delete events
export const useBulkDeleteEvents = () => {
  return useMutation({
    mutationFn: eventsService.bulkDeleteEvents,
    onSuccess: () => {
      cacheUtils.invalidateEvents();
    },
  });
};

// ==================== SEARCH HOOKS ====================

// Global search across events, leads, clients
export const useGlobalSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['search', 'global', query],
    queryFn: () => eventsService.globalSearch(query),
    enabled: enabled && query.length > 2, // Only search with 3+ characters
    staleTime: 30 * 1000, // Search results are fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Clean up search cache quickly
  });
};

// ==================== UTILITY FUNCTIONS ====================

// Prefetch related data for better UX
export const prefetchEventDetails = (eventId: number) => {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventsService.getEvent(eventId),
  });
};

export const prefetchLeadDetails = (leadId: number) => {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.leads.detail(leadId),
    queryFn: () => eventsService.getLead(leadId),
  });
};