/**
 * React Query Configuration and Provider
 * Professional data fetching with caching, background updates, and error handling
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with production-ready configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, 
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Show loading state for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query Keys for consistent cache management
export const queryKeys = {
  // Events module queries
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.events.details(), id] as const,
  },
  
  // Leads module queries
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.leads.details(), id] as const,
  },
  
  // Clients module queries
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.clients.details(), id] as const,
  },
  
  // Venues module queries
  venues: {
    all: ['venues'] as const,
    lists: () => [...queryKeys.venues.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.venues.lists(), filters] as const,
    details: () => [...queryKeys.venues.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.venues.details(), id] as const,
  },
  
  // Reference data
  categories: ['categories'] as const,
  organisations: ['organisations'] as const,
} as const;

// Provider component for app
interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Cache management utilities
export const cacheUtils = {
  // Invalidate all events data
  invalidateEvents: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  },
  
  // Invalidate all leads data
  invalidateLeads: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
  },
  
  // Invalidate all clients data
  invalidateClients: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
  },
  
  // Invalidate all venues data
  invalidateVenues: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
  },
  
  // Invalidate specific resource
  invalidateResource: (resourceType: 'events' | 'leads' | 'clients' | 'venues') => {
    queryClient.invalidateQueries({ queryKey: queryKeys[resourceType].all });
  },
  
  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },
  
  // Prefetch data for better UX
  prefetchEvents: (filters: Record<string, any> = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.events.list(filters),
      queryFn: () => import('../services/events.service').then(m => m.default.getEvents(filters)),
    });
  },
};