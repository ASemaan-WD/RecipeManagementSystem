import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Types ───

interface RatingData {
  avgRating: number | null;
  ratingCount: number;
  userRating: number | null;
}

// ─── Fetcher Functions ───

async function fetchRating(recipeId: string): Promise<RatingData> {
  const res = await fetch(`/api/recipes/${recipeId}/ratings`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch rating');
  }
  return res.json() as Promise<RatingData>;
}

async function rateRecipe(
  recipeId: string,
  value: number
): Promise<RatingData> {
  const res = await fetch(`/api/recipes/${recipeId}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to rate recipe');
  }
  return res.json() as Promise<RatingData>;
}

// ─── Query Hooks ───

export function useRecipeRating(recipeId: string) {
  return useQuery({
    queryKey: ['recipe-rating', recipeId],
    queryFn: () => fetchRating(recipeId),
  });
}

// ─── Mutation Hooks ───

interface RateRecipeParams {
  recipeId: string;
  value: number;
}

export function useRateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, value }: RateRecipeParams) =>
      rateRecipe(recipeId, value),

    onMutate: async ({ recipeId, value }) => {
      await queryClient.cancelQueries({
        queryKey: ['recipe-rating', recipeId],
      });

      const previous = queryClient.getQueryData<RatingData>([
        'recipe-rating',
        recipeId,
      ]);

      // Optimistic update
      queryClient.setQueryData<RatingData>(
        ['recipe-rating', recipeId],
        (old) => {
          if (!old) return old;
          return { ...old, userRating: value };
        }
      );

      return { previous };
    },

    onError: (error: Error, { recipeId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['recipe-rating', recipeId], context.previous);
      }
      toast.error(error.message);
    },

    onSettled: (_data, _error, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: ['recipe-rating', recipeId],
      });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
