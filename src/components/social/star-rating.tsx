'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRecipeRating, useRateRecipe } from '@/hooks/use-ratings';

interface StarRatingProps {
  recipeId: string;
  initialAvgRating: number | null;
  initialRatingCount: number;
  initialUserRating: number | null;
  isOwner: boolean;
  isAuthenticated: boolean;
  readOnly?: boolean;
}

export function StarRating({
  recipeId,
  initialAvgRating,
  initialRatingCount,
  initialUserRating,
  isOwner,
  isAuthenticated,
  readOnly = false,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { data: ratingData } = useRecipeRating(recipeId);
  const rateRecipe = useRateRecipe();

  const avgRating = ratingData?.avgRating ?? initialAvgRating;
  const ratingCount = ratingData?.ratingCount ?? initialRatingCount;
  const userRating = ratingData?.userRating ?? initialUserRating;

  const isInteractive = isAuthenticated && !isOwner && !readOnly;

  function handleRate(value: number) {
    if (!isInteractive) return;
    rateRecipe.mutate({ recipeId, value });
  }

  function handleMouseEnter(value: number) {
    if (!isInteractive) return;
    setHoveredStar(value);
  }

  function handleMouseLeave() {
    setHoveredStar(null);
  }

  // Display value: hovered > user rating > avg rating
  const displayValue = hoveredStar ?? userRating ?? avgRating ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-0.5"
        onMouseLeave={handleMouseLeave}
        role={isInteractive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${avgRating ?? 'No ratings'} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;

          return (
            <button
              key={star}
              type="button"
              className={cn(
                'transition-colors',
                isInteractive
                  ? 'cursor-pointer hover:scale-110'
                  : 'cursor-default'
              )}
              onClick={() => handleRate(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={!isInteractive}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'size-5',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/40'
                )}
              />
            </button>
          );
        })}
      </div>

      <span className="text-muted-foreground text-sm">
        {avgRating !== null ? avgRating.toFixed(1) : '—'}
        <span className="ml-1">
          ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
        </span>
      </span>

      {isOwner && (
        <span className="text-muted-foreground text-xs italic">
          You cannot rate your own recipe
        </span>
      )}
    </div>
  );
}
