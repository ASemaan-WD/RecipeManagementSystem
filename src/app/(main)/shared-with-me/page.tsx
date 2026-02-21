'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, Inbox } from 'lucide-react';

import { RecipeGrid } from '@/components/recipes/recipe-grid';
import type { RecipeListItem, PaginatedResponse } from '@/types/recipe';

const PAGE_SIZE = 12;

interface SharedRecipeItem extends RecipeListItem {
  sharedAt: string;
}

async function fetchSharedRecipes(
  page: number
): Promise<PaginatedResponse<SharedRecipeItem>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  const res = await fetch(`/api/recipes/shared-with-me?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch shared recipes');
  }
  return res.json() as Promise<PaginatedResponse<SharedRecipeItem>>;
}

export default function SharedWithMePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['shared-recipes', page],
    queryFn: () => fetchSharedRecipes(page),
  });

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Share2 className="size-7" />
          Shared With Me
        </h1>
        <p className="text-muted-foreground text-sm">
          Recipes that other users have shared with you
        </p>
      </div>

      {/* Recipe grid */}
      <RecipeGrid
        recipes={recipes as RecipeListItem[]}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={() => setPage((p) => p + 1)}
        isLoadingMore={isFetching && !isLoading}
        emptyState={
          <div className="space-y-2">
            <Inbox className="text-muted-foreground mx-auto size-12" />
            <p className="text-muted-foreground text-sm">
              No one has shared recipes with you yet.
            </p>
          </div>
        }
      />

      {/* Pagination info */}
      {pagination && pagination.total > 0 && (
        <p className="text-muted-foreground text-center text-xs">
          Showing {recipes.length} of {pagination.total} recipes
        </p>
      )}
    </div>
  );
}
