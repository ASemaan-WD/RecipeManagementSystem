import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { PaginatedResponse } from '@/types/recipe';

// ─── Types ───

interface CommentAuthor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentAuthor;
}

// ─── Fetcher Functions ───

async function fetchComments(
  recipeId: string,
  page: number,
  limit: number
): Promise<PaginatedResponse<Comment>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`/api/recipes/${recipeId}/comments?${params}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch comments');
  }
  return res.json() as Promise<PaginatedResponse<Comment>>;
}

async function createComment(
  recipeId: string,
  content: string
): Promise<Comment> {
  const res = await fetch(`/api/recipes/${recipeId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to create comment');
  }
  return res.json() as Promise<Comment>;
}

async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const res = await fetch(`/api/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to update comment');
  }
  return res.json() as Promise<Comment>;
}

async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to delete comment');
  }
}

// ─── Query Hooks ───

export function useComments(recipeId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['comments', recipeId, page, limit],
    queryFn: () => fetchComments(recipeId, page, limit),
  });
}

// ─── Mutation Hooks ───

interface CreateCommentParams {
  recipeId: string;
  content: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, content }: CreateCommentParams) =>
      createComment(recipeId, content),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Comment posted');
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface UpdateCommentParams {
  commentId: string;
  content: string;
  recipeId: string;
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: UpdateCommentParams) =>
      updateComment(commentId, content),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Comment updated');
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface DeleteCommentParams {
  commentId: string;
  recipeId: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: DeleteCommentParams) =>
      deleteComment(commentId),

    onSuccess: (_data, { recipeId }) => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
