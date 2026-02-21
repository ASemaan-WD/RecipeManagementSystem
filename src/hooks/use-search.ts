import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import type { RecipeListItem, PaginatedResponse } from '@/types/recipe';

// ─── Types ───

export interface SearchFilters {
  q?: string;
  cuisine?: string;
  difficulty?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
  dietary?: string[];
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

// ─── Fetcher Functions ───

async function fetchSearchResults(
  filters: SearchFilters
): Promise<PaginatedResponse<RecipeListItem>> {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.maxPrepTime)
    params.set('maxPrepTime', String(filters.maxPrepTime));
  if (filters.maxCookTime)
    params.set('maxCookTime', String(filters.maxCookTime));
  if (filters.dietary && filters.dietary.length > 0) {
    for (const tag of filters.dietary) {
      params.append('dietary', tag);
    }
  }
  if (filters.minRating) params.set('minRating', String(filters.minRating));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to search recipes');
  }
  return res.json() as Promise<PaginatedResponse<RecipeListItem>>;
}

async function fetchCuisineOptions(): Promise<string[]> {
  const res = await fetch('/api/search/cuisines');
  if (!res.ok) throw new Error('Failed to fetch cuisine options');
  const data = (await res.json()) as { data: string[] };
  return data.data;
}

async function fetchDietaryTags(): Promise<{ id: string; name: string }[]> {
  const res = await fetch('/api/search/dietary-tags');
  if (!res.ok) throw new Error('Failed to fetch dietary tags');
  const data = (await res.json()) as { data: { id: string; name: string }[] };
  return data.data;
}

// ─── Utility Hooks ───

function hasActiveFilters(filters: SearchFilters): boolean {
  return !!(
    filters.q ||
    filters.cuisine ||
    filters.difficulty ||
    filters.maxPrepTime ||
    filters.maxCookTime ||
    (filters.dietary && filters.dietary.length > 0) ||
    filters.minRating
  );
}

export function useDebouncedValue(value: string, delay = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── Query Hooks ───

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => fetchSearchResults(filters),
    enabled: hasActiveFilters(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCuisineOptions() {
  return useQuery({
    queryKey: ['cuisine-options'],
    queryFn: fetchCuisineOptions,
    staleTime: 300_000,
  });
}

export function useDietaryTags() {
  return useQuery({
    queryKey: ['dietary-tags'],
    queryFn: fetchDietaryTags,
    staleTime: 300_000,
  });
}
