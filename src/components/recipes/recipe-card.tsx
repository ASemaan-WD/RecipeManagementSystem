import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  Users,
  Star,
  Lock,
  Globe,
  UtensilsCrossed,
  ChefHat,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { TagToggles } from '@/components/recipes/tag-toggles';
import { SaveButton } from '@/components/recipes/save-button';
import type { TagStatus } from '@/generated/prisma/client';
import type { RecipeListItem } from '@/types/recipe';

const DIFFICULTY_STYLES = {
  EASY: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HARD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
} as const;

const VISIBILITY_ICONS = {
  PRIVATE: Lock,
  SHARED: Users,
  PUBLIC: Globe,
} as const;

function formatTime(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getInitials(name: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface RecipeCardProps {
  recipe: RecipeListItem;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const VisibilityIcon = VISIBILITY_ICONS[recipe.visibility];
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0) || null;

  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all group-hover:scale-[1.02] group-hover:shadow-lg">
        {/* Image */}
        <div className="bg-muted relative aspect-[4/3] overflow-hidden">
          {recipe.primaryImage ? (
            <Image
              src={recipe.primaryImage.url}
              alt={recipe.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20">
              <ChefHat className="text-muted-foreground/40 size-12" />
            </div>
          )}

          {/* Visibility icon */}
          <div className="absolute top-2 right-2">
            <div className="rounded-full bg-black/40 p-1.5">
              <VisibilityIcon className="size-3.5 text-white" />
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          <h3 className="line-clamp-2 text-sm leading-tight font-semibold">
            {recipe.name}
          </h3>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Cuisine + Difficulty badges */}
          <div className="flex flex-wrap gap-1.5">
            {recipe.cuisineType && (
              <Badge variant="secondary" className="text-xs">
                {recipe.cuisineType}
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge
                variant="secondary"
                className={cn('text-xs', DIFFICULTY_STYLES[recipe.difficulty])}
              >
                {recipe.difficulty.charAt(0) +
                  recipe.difficulty.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>

          {/* Time */}
          {totalTime && (
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatTime(totalTime)} total
              </span>
              {recipe.prepTime && (
                <span className="flex items-center gap-1">
                  <UtensilsCrossed className="size-3" />
                  {formatTime(recipe.prepTime)} prep
                </span>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Star
              className={cn(
                'size-3.5',
                recipe.avgRating && 'fill-yellow-400 text-yellow-400'
              )}
            />
            {recipe.avgRating ? (
              <span>
                {recipe.avgRating.toFixed(1)} ({recipe.ratingCount})
              </span>
            ) : (
              <span>No ratings</span>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              {recipe.author.image && (
                <AvatarImage
                  src={recipe.author.image}
                  alt={recipe.author.name ?? 'Author'}
                />
              )}
              <AvatarFallback className="text-[10px]">
                {getInitials(recipe.author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground truncate text-xs">
              {recipe.author.name ?? recipe.author.username ?? 'Anonymous'}
            </span>
          </div>

          {/* Tag & Save actions (authenticated users only) */}
          {recipe.userTags !== undefined && (
            <div
              className="flex items-center justify-between border-t pt-2"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.preventDefault()}
            >
              <TagToggles
                recipeId={recipe.id}
                initialTags={
                  (recipe.userTags?.map((t) => t.status) ?? []) as TagStatus[]
                }
                variant="compact"
              />
              <SaveButton
                recipeId={recipe.id}
                initialSaved={recipe.isSaved ?? false}
                variant="compact"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
