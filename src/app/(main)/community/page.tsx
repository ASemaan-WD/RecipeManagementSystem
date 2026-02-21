'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, SearchX } from 'lucide-react';

import { RecipeGrid } from '@/components/recipes/recipe-grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecipeListItem, PaginatedResponse } from '@/types/recipe';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const PAGE_SIZE = 12;

async function fetchPublicRecipes(
  page: number,
  sort: SortValue
): Promise<PaginatedResponse<RecipeListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort,
  });
  const res = await fetch(`/api/recipes?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return res.json() as Promise<PaginatedResponse<RecipeListItem>>;
}

export default function CommunityPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortValue>('newest');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['community-recipes', page, sort],
    queryFn: () => fetchPublicRecipes(page, sort),
  });

  const recipes = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  function handleSortChange(value: SortValue) {
    setSort(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Globe className="size-7" />
            Community Recipes
          </h1>
          <p className="text-muted-foreground text-sm">
            Discover recipes shared by the community
          </p>
        </div>

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recipe grid */}
      <RecipeGrid
        recipes={recipes}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={() => setPage((p) => p + 1)}
        isLoadingMore={isFetching && !isLoading}
        emptyState={
          <div className="space-y-2">
            <SearchX className="text-muted-foreground mx-auto size-12" />
            <p className="text-muted-foreground text-sm">
              No public recipes yet. Be the first to share!
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
