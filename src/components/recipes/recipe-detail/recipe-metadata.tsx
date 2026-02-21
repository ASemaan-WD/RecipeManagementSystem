import { Clock, UtensilsCrossed, Users, Timer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { RecipeDetail } from '@/types/recipe';

const DIFFICULTY_STYLES = {
  EASY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HARD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
} as const;

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

interface RecipeMetadataProps {
  recipe: RecipeDetail;
}

export function RecipeMetadata({ recipe }: RecipeMetadataProps) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {recipe.prepTime && (
        <div className="text-muted-foreground flex items-center gap-1.5">
          <UtensilsCrossed className="size-4" />
          <span>{formatTime(recipe.prepTime)} prep</span>
        </div>
      )}

      {recipe.cookTime && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>{formatTime(recipe.cookTime)} cook</span>
          </div>
        </>
      )}

      {totalTime > 0 && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Timer className="size-4" />
            <span>{formatTime(totalTime)} total</span>
          </div>
        </>
      )}

      {recipe.servings && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Users className="size-4" />
            <span>{recipe.servings} servings</span>
          </div>
        </>
      )}

      {recipe.difficulty && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <Badge
            variant="secondary"
            className={cn(DIFFICULTY_STYLES[recipe.difficulty])}
          >
            {recipe.difficulty.charAt(0) +
              recipe.difficulty.slice(1).toLowerCase()}
          </Badge>
        </>
      )}

      {recipe.cuisineType && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="secondary">{recipe.cuisineType}</Badge>
        </>
      )}
    </div>
  );
}
