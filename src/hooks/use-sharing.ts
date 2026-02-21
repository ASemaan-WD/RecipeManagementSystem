import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Visibility } from '@/generated/prisma/client';

// ─── Types ───

interface SharedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface RecipeShare {
  id: string;
  sharedAt: string;
  user: SharedUser;
}

interface ShareLink {
  id: string;
  token: string;
  createdAt: string;
}

interface SharesResponse {
  shares: RecipeShare[];
  shareLinks: ShareLink[];
}

interface UserSearchResult {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

// ─── Fetcher Functions ───

async function fetchRecipeShares(recipeId: string): Promise<SharesResponse> {
  const res = await fetch(`/api/recipes/${recipeId}/shares`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch shares');
  }
  return res.json() as Promise<SharesResponse>;
}

async function shareWithUser(
  recipeId: string,
  username: string
): Promise<RecipeShare> {
  const res = await fetch(`/api/recipes/${recipeId}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to share recipe');
  }
  return res.json() as Promise<RecipeShare>;
}

async function revokeShare(recipeId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/shares`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to revoke share');
  }
}

async function updateVisibility(
  recipeId: string,
  visibility: Visibility
): Promise<{ id: string; visibility: Visibility }> {
  const res = await fetch(`/api/recipes/${recipeId}/visibility`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to update visibility');
  }
  return res.json() as Promise<{ id: string; visibility: Visibility }>;
}

async function createShareLink(recipeId: string): Promise<ShareLink> {
  const res = await fetch(`/api/recipes/${recipeId}/share-link`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to create share link');
  }
  return res.json() as Promise<ShareLink>;
}

async function revokeShareLink(
  recipeId: string,
  linkId: string
): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/share-link`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to revoke share link');
  }
}

async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to search users');
  }
  const result = (await res.json()) as { data: UserSearchResult[] };
  return result.data;
}

// ─── Query Hooks ───

export function useRecipeShares(recipeId: string) {
  return useQuery({
    queryKey: ['recipe-shares', recipeId],
    queryFn: () => fetchRecipeShares(recipeId),
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 1,
  });
}

// ─── Mutation Hooks ───

interface ShareRecipeParams {
  recipeId: string;
  username: string;
}

export function useShareRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, username }: ShareRecipeParams) =>
      shareWithUser(recipeId, username),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Recipe shared successfully');
      queryClient.invalidateQueries({ queryKey: ['recipe-shares', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface RevokeShareParams {
  recipeId: string;
  userId: string;
}

export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, userId }: RevokeShareParams) =>
      revokeShare(recipeId, userId),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Share revoked');
      queryClient.invalidateQueries({ queryKey: ['recipe-shares', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface UpdateVisibilityParams {
  recipeId: string;
  visibility: Visibility;
}

export function useUpdateVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, visibility }: UpdateVisibilityParams) =>
      updateVisibility(recipeId, visibility),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Visibility updated');
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface CreateShareLinkParams {
  recipeId: string;
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId }: CreateShareLinkParams) =>
      createShareLink(recipeId),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Share link created');
      queryClient.invalidateQueries({ queryKey: ['recipe-shares', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface RevokeShareLinkParams {
  recipeId: string;
  linkId: string;
}

export function useRevokeShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, linkId }: RevokeShareLinkParams) =>
      revokeShareLink(recipeId, linkId),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Share link revoked');
      queryClient.invalidateQueries({ queryKey: ['recipe-shares', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
