import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  RecipeListItem,
  RecipeDetail,
  RecipeFilters,
  RecipeFormData,
  PaginatedResponse,
} from '@/types/recipe';

// ─── Fetcher Functions ───

async function fetchRecipes(
  filters: RecipeFilters
): Promise<PaginatedResponse<RecipeListItem>> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.maxPrepTime)
    params.set('maxPrepTime', String(filters.maxPrepTime));
  if (filters.maxCookTime)
    params.set('maxCookTime', String(filters.maxCookTime));
  if (filters.dietary) {
    filters.dietary.forEach((d) => params.append('dietary', d));
  }
  if (filters.minRating) params.set('minRating', String(filters.minRating));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.visibility) params.set('visibility', filters.visibility);

  const res = await fetch(`/api/recipes?${params}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch recipes');
  }
  return res.json() as Promise<PaginatedResponse<RecipeListItem>>;
}

async function fetchRecipe(id: string): Promise<RecipeDetail> {
  const res = await fetch(`/api/recipes/${id}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch recipe');
  }
  return res.json() as Promise<RecipeDetail>;
}

async function createRecipe(data: RecipeFormData): Promise<RecipeDetail> {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to create recipe');
  }
  return res.json() as Promise<RecipeDetail>;
}

async function updateRecipe({
  id,
  data,
}: {
  id: string;
  data: RecipeFormData;
}): Promise<RecipeDetail> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to update recipe');
  }
  return res.json() as Promise<RecipeDetail>;
}

async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to delete recipe');
  }
}

async function duplicateRecipe(id: string): Promise<RecipeDetail> {
  const res = await fetch(`/api/recipes/${id}/duplicate`, { method: 'POST' });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to duplicate recipe');
  }
  return res.json() as Promise<RecipeDetail>;
}

// ─── Query Hooks ───

export function useRecipes(filters: RecipeFilters = {}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => fetchRecipes(filters),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ───

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
      toast.success('Recipe updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.removeQueries({ queryKey: ['recipe', id] });
      toast.success('Recipe deleted successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDuplicateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe duplicated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
