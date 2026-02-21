import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { TagStatus } from '@/generated/prisma/client';
import type { RecipeListItem, PaginatedResponse } from '@/types/recipe';

// ─── Fetcher Functions ───

async function addTag(recipeId: string, status: TagStatus): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to add tag');
  }
}

async function removeTag(recipeId: string, status: TagStatus): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/tags`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to remove tag');
  }
}

async function saveRecipe(recipeId: string): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/save`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to save recipe');
  }
}

async function unsaveRecipe(recipeId: string): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/save`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to unsave recipe');
  }
}

// ─── Optimistic Update Helpers ───

function updateRecipeTagsInList(
  old: PaginatedResponse<RecipeListItem> | undefined,
  recipeId: string,
  status: TagStatus,
  isAdding: boolean
): PaginatedResponse<RecipeListItem> | undefined {
  if (!old) return old;
  return {
    ...old,
    data: old.data.map((recipe) => {
      if (recipe.id !== recipeId) return recipe;
      const currentTags = recipe.userTags ?? [];
      const updatedTags = isAdding
        ? [...currentTags, { status }]
        : currentTags.filter((t) => t.status !== status);
      return { ...recipe, userTags: updatedTags };
    }),
  };
}

function updateRecipeSaveInList(
  old: PaginatedResponse<RecipeListItem> | undefined,
  recipeId: string,
  isSaved: boolean
): PaginatedResponse<RecipeListItem> | undefined {
  if (!old) return old;
  return {
    ...old,
    data: old.data.map((recipe) => {
      if (recipe.id !== recipeId) return recipe;
      return { ...recipe, isSaved };
    }),
  };
}

// ─── Mutation Hooks ───

interface ToggleTagParams {
  recipeId: string;
  status: TagStatus;
  isActive: boolean;
}

export function useToggleTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, status, isActive }: ToggleTagParams) =>
      isActive ? removeTag(recipeId, status) : addTag(recipeId, status),

    onMutate: async ({ recipeId, status, isActive }) => {
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
      await queryClient.cancelQueries({ queryKey: ['recipes'] });

      // Snapshot previous cache
      const previousRecipe = queryClient.getQueryData(['recipe', recipeId]);
      const previousRecipes = queryClient.getQueriesData<
        PaginatedResponse<RecipeListItem>
      >({ queryKey: ['recipes'] });

      // Optimistically update single recipe cache
      queryClient.setQueryData(
        ['recipe', recipeId],
        (old: RecipeListItem | undefined) => {
          if (!old) return old;
          const currentTags = old.userTags ?? [];
          const updatedTags = isActive
            ? currentTags.filter((t) => t.status !== status)
            : [...currentTags, { status }];
          return { ...old, userTags: updatedTags };
        }
      );

      // Optimistically update recipes list cache
      queryClient.setQueriesData<PaginatedResponse<RecipeListItem>>(
        { queryKey: ['recipes'] },
        (old) => updateRecipeTagsInList(old, recipeId, status, !isActive)
      );

      return { previousRecipe, previousRecipes };
    },

    onError: (_err, { recipeId }, context) => {
      // Revert optimistic updates
      if (context?.previousRecipe) {
        queryClient.setQueryData(['recipe', recipeId], context.previousRecipe);
      }
      if (context?.previousRecipes) {
        for (const [key, data] of context.previousRecipes) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to update tag.');
    },

    onSettled: (_data, _error, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}

interface ToggleSaveParams {
  recipeId: string;
  isSaved: boolean;
}

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, isSaved }: ToggleSaveParams) =>
      isSaved ? unsaveRecipe(recipeId) : saveRecipe(recipeId),

    onMutate: async ({ recipeId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
      await queryClient.cancelQueries({ queryKey: ['recipes'] });

      const previousRecipe = queryClient.getQueryData(['recipe', recipeId]);
      const previousRecipes = queryClient.getQueriesData<
        PaginatedResponse<RecipeListItem>
      >({ queryKey: ['recipes'] });

      // Optimistically update single recipe cache
      queryClient.setQueryData(
        ['recipe', recipeId],
        (old: RecipeListItem | undefined) => {
          if (!old) return old;
          return { ...old, isSaved: !isSaved };
        }
      );

      // Optimistically update recipes list cache
      queryClient.setQueriesData<PaginatedResponse<RecipeListItem>>(
        { queryKey: ['recipes'] },
        (old) => updateRecipeSaveInList(old, recipeId, !isSaved)
      );

      return { previousRecipe, previousRecipes };
    },

    onSuccess: (_data, { isSaved }) => {
      toast.success(
        isSaved
          ? 'Recipe removed from collection'
          : 'Recipe saved to collection'
      );
    },

    onError: (_err, { recipeId }, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(['recipe', recipeId], context.previousRecipe);
      }
      if (context?.previousRecipes) {
        for (const [key, data] of context.previousRecipes) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to update save status.');
    },

    onSettled: (_data, _error, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}

// ─── Collection Types ───

export interface CollectionCounts {
  all: number;
  favorites: number;
  toTry: number;
  madeBefore: number;
  saved: number;
}

export interface CollectionFilters {
  tab: string;
  page: number;
  limit: number;
  sort: string;
}

export type CollectionResponse = PaginatedResponse<RecipeListItem> & {
  counts: CollectionCounts;
};

// ─── Collection Fetcher ───

async function fetchCollection(
  filters: CollectionFilters
): Promise<CollectionResponse> {
  const params = new URLSearchParams();
  params.set('tab', filters.tab);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('sort', filters.sort);

  const res = await fetch(`/api/collections?${params.toString()}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch collection');
  }
  return res.json() as Promise<CollectionResponse>;
}

// ─── Collection Query Hook ───

export function useCollection(filters: CollectionFilters) {
  return useQuery({
    queryKey: ['collection', filters],
    queryFn: () => fetchCollection(filters),
  });
}
