'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { RecipeCardSkeleton } from '@/components/recipes/recipe-card-skeleton';
import type { RecipeListItem } from '@/types/recipe';

const DEFAULT_SKELETON_COUNT = 8;

interface RecipeGridProps {
  recipes: RecipeListItem[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyState?: React.ReactNode;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function RecipeGrid({
  recipes,
  isLoading = false,
  skeletonCount = DEFAULT_SKELETON_COUNT,
  emptyState,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: RecipeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {emptyState ?? (
          <p className="text-muted-foreground">No recipes found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore && <Loader2 className="size-4 animate-spin" />}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
