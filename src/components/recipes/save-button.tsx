'use client';

import { useState } from 'react';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToggleSave } from '@/hooks/use-tags';

interface SaveButtonProps {
  recipeId: string;
  initialSaved: boolean;
  variant?: 'compact' | 'full';
  disabled?: boolean;
}

export function SaveButton({
  recipeId,
  initialSaved,
  variant = 'full',
  disabled = false,
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const toggleSave = useToggleSave();

  function handleToggle() {
    if (disabled) return;

    // Optimistic local state update
    setIsSaved((prev) => !prev);

    toggleSave.mutate(
      { recipeId, isSaved },
      {
        onError: () => {
          // Revert local state on error
          setIsSaved(isSaved);
        },
      }
    );
  }

  const isCompact = variant === 'compact';
  const Icon = isSaved ? BookmarkCheck : BookmarkPlus;
  const label = isSaved ? 'Saved' : 'Save';

  const button = (
    <Button
      variant="ghost"
      size={isCompact ? 'icon' : 'sm'}
      disabled={disabled}
      className={cn(
        isCompact ? 'size-8' : 'h-8',
        isSaved
          ? 'fill-primary text-primary'
          : 'text-muted-foreground hover:text-primary'
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      aria-label={isCompact ? label : undefined}
      aria-pressed={isSaved}
    >
      <Icon className={cn('size-4', isSaved && 'fill-primary text-primary')} />
      {!isCompact && <span className="text-xs">{label}</span>}
    </Button>
  );

  if (isCompact) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
