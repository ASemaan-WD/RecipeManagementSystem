'use client';

import { useState } from 'react';
import { Heart, Bookmark, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToggleTag } from '@/hooks/use-tags';
import type { TagStatus } from '@/generated/prisma/client';

const TAG_CONFIG = [
  {
    status: 'FAVORITE' as TagStatus,
    label: 'Favorite',
    icon: Heart,
    activeClass: 'fill-red-500 text-red-500',
    hoverClass: 'hover:text-red-500',
  },
  {
    status: 'TO_TRY' as TagStatus,
    label: 'To Try',
    icon: Bookmark,
    activeClass: 'fill-amber-500 text-amber-500',
    hoverClass: 'hover:text-amber-500',
  },
  {
    status: 'MADE_BEFORE' as TagStatus,
    label: 'Made Before',
    icon: CheckCircle,
    activeClass: 'fill-green-500 text-green-500',
    hoverClass: 'hover:text-green-500',
  },
] as const;

interface TagTogglesProps {
  recipeId: string;
  initialTags: TagStatus[];
  variant?: 'compact' | 'full';
  disabled?: boolean;
}

export function TagToggles({
  recipeId,
  initialTags,
  variant = 'full',
  disabled = false,
}: TagTogglesProps) {
  const [activeTags, setActiveTags] = useState<Set<TagStatus>>(
    new Set(initialTags)
  );
  const toggleTag = useToggleTag();

  function handleToggle(status: TagStatus) {
    if (disabled) return;

    const isActive = activeTags.has(status);

    // Optimistic local state update
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (isActive) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });

    toggleTag.mutate(
      { recipeId, status, isActive },
      {
        onError: () => {
          // Revert local state on error
          setActiveTags((prev) => {
            const next = new Set(prev);
            if (isActive) {
              next.add(status);
            } else {
              next.delete(status);
            }
            return next;
          });
        },
      }
    );
  }

  const isCompact = variant === 'compact';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {TAG_CONFIG.map((config) => {
          const Icon = config.icon;
          const isActive = activeTags.has(config.status);

          const button = (
            <Button
              key={config.status}
              variant="ghost"
              size={isCompact ? 'icon' : 'sm'}
              disabled={disabled}
              className={cn(
                isCompact ? 'size-8' : 'h-8',
                isActive
                  ? config.activeClass
                  : cn('text-muted-foreground', config.hoverClass)
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(config.status);
              }}
              aria-label={
                isCompact
                  ? `${isActive ? 'Remove' : 'Mark as'} ${config.label}`
                  : undefined
              }
              aria-pressed={isActive}
            >
              <Icon className={cn('size-4', isActive && config.activeClass)} />
              {!isCompact && <span className="text-xs">{config.label}</span>}
            </Button>
          );

          if (isCompact) {
            return (
              <Tooltip key={config.status}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{config.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}
