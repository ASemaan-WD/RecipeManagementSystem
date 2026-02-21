'use client';

import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SearchFilters } from '@/hooks/use-search';

interface ActiveFiltersProps {
  filters: SearchFilters;
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}

interface FilterChip {
  key: string;
  label: string;
  value?: string;
}

function getFilterChips(filters: SearchFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.cuisine) {
    chips.push({ key: 'cuisine', label: `Cuisine: ${filters.cuisine}` });
  }
  if (filters.difficulty) {
    const label =
      filters.difficulty.charAt(0) + filters.difficulty.slice(1).toLowerCase();
    chips.push({ key: 'difficulty', label: `Difficulty: ${label}` });
  }
  if (filters.maxPrepTime) {
    chips.push({
      key: 'maxPrepTime',
      label: `Prep: < ${filters.maxPrepTime} min`,
    });
  }
  if (filters.maxCookTime) {
    chips.push({
      key: 'maxCookTime',
      label: `Cook: < ${filters.maxCookTime} min`,
    });
  }
  if (filters.dietary && filters.dietary.length > 0) {
    for (const tagId of filters.dietary) {
      chips.push({
        key: 'dietary',
        label: `Dietary: ${tagId}`,
        value: tagId,
      });
    }
  }
  if (filters.minRating) {
    chips.push({
      key: 'minRating',
      label: `Rating: ${filters.minRating}+`,
    });
  }

  return chips;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const chips = getFilterChips(filters);

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {chips.map((chip, i) => (
        <Badge
          key={`${chip.key}-${chip.value ?? i}`}
          variant="secondary"
          className="shrink-0 gap-1 pr-1"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className="hover:bg-muted rounded-full p-0.5"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {chips.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs"
          onClick={onClearAll}
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
