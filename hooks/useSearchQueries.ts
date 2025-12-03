/**
 * Search React Query Hooks
 * Custom hooks for search functionality with caching
 */

import { useQuery } from '@tanstack/react-query';
import searchService, { type GlobalSearchResults, type SearchFilters } from '@/services/search.service';

/**
 * Query keys for search data
 */
export const searchKeys = {
  all: ['search'] as const,
  global: (query: string, filters?: SearchFilters) => [...searchKeys.all, 'global', query, filters] as const,
  people: (query: string) => [...searchKeys.all, 'people', query] as const,
  projects: (query: string) => [...searchKeys.all, 'projects', query] as const,
  tasks: (query: string) => [...searchKeys.all, 'tasks', query] as const,
  documents: (query: string) => [...searchKeys.all, 'documents', query] as const,
};

/**
 * Hook for global search across all categories
 */
export function useGlobalSearch(query: string, filters?: SearchFilters) {
  return useQuery({
    queryKey: searchKeys.global(query, filters),
    queryFn: () => searchService.globalSearch(query, filters),
    enabled: query.length > 0, // Only search when there's a query
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to search only people
 */
export function useSearchPeople(query: string, limit: number = 10) {
  return useQuery({
    queryKey: searchKeys.people(query),
    queryFn: () => searchService.searchPeople(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to search only projects
 */
export function useSearchProjects(query: string, limit: number = 10) {
  return useQuery({
    queryKey: searchKeys.projects(query),
    queryFn: () => searchService.searchProjects(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to search only tasks
 */
export function useSearchTasks(query: string, limit: number = 10) {
  return useQuery({
    queryKey: searchKeys.tasks(query),
    queryFn: () => searchService.searchTasks(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to search only documents
 */
export function useSearchDocuments(query: string, limit: number = 10) {
  return useQuery({
    queryKey: searchKeys.documents(query),
    queryFn: () => searchService.searchDocuments(query, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
