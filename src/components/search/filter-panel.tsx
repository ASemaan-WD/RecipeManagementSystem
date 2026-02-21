'use client';

import { useState } from 'react';
import { SlidersHorizontal, Star, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCuisineOptions, useDietaryTags } from '@/hooks/use-search';
import type { SearchFilters } from '@/hooks/use-search';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

const PREP_TIME_PRESETS = [
  { value: 15, label: '< 15 min' },
  { value: 30, label: '< 30 min' },
  { value: 60, label: '< 60 min' },
] as const;

const COOK_TIME_PRESETS = [
  { value: 30, label: '< 30 min' },
  { value: 60, label: '< 60 min' },
  { value: 120, label: '< 120 min' },
] as const;

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  isLoading?: boolean;
}

function FilterContent({
  filters,
  onFilterChange,
  isLoading,
}: FilterPanelProps) {
  const { data: cuisines, isLoading: cuisinesLoading } = useCuisineOptions();
  const { data: dietaryTags, isLoading: tagsLoading } = useDietaryTags();

  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-6">
      {/* Cuisine */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cuisine</Label>
        {cuisinesLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={filters.cuisine ?? '__any__'}
            onValueChange={(val) =>
              onFilterChange({ cuisine: val === '__any__' ? undefined : val })
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any cuisine</SelectItem>
              {cuisines?.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {/* Difficulty */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Difficulty</Label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={
                (filters.difficulty ?? '') === option.value
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({
                  difficulty: option.value || undefined,
                })
              }
              disabled={isLoading}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Prep Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Max Prep Time</Label>
        <div className="flex flex-wrap gap-2">
          {PREP_TIME_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={
                filters.maxPrepTime === preset.value ? 'default' : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({
                  maxPrepTime:
                    filters.maxPrepTime === preset.value
                      ? undefined
                      : preset.value,
                })
              }
              disabled={isLoading}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Cook Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Max Cook Time</Label>
        <div className="flex flex-wrap gap-2">
          {COOK_TIME_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={
                filters.maxCookTime === preset.value ? 'default' : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({
                  maxCookTime:
                    filters.maxCookTime === preset.value
                      ? undefined
                      : preset.value,
                })
              }
              disabled={isLoading}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Dietary Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Dietary</Label>
        {tagsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {dietaryTags?.map((tag) => {
              const isChecked = filters.dietary?.includes(tag.id) ?? false;
              return (
                <div key={tag.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`dietary-${tag.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const current = filters.dietary ?? [];
                      const updated = checked
                        ? [...current, tag.id]
                        : current.filter((id) => id !== tag.id);
                      onFilterChange({
                        dietary: updated.length > 0 ? updated : undefined,
                      });
                    }}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`dietary-${tag.id}`}
                    className="text-sm font-normal"
                  >
                    {tag.name}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Min Rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Minimum Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() =>
                onFilterChange({
                  minRating: filters.minRating === rating ? undefined : rating,
                })
              }
              className="hover:bg-accent rounded p-1 transition-colors"
              disabled={isLoading}
              aria-label={`${rating}+ stars`}
            >
              <Star
                className={cn(
                  'size-5',
                  rating <= (filters.minRating ?? 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                )}
              />
            </button>
          ))}
          {filters.minRating && (
            <span className="text-muted-foreground ml-1 self-center text-xs">
              {filters.minRating}+
            </span>
          )}
        </div>
      </div>

      {/* Clear All */}
      {activeCount > 0 && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() =>
              onFilterChange({
                cuisine: undefined,
                difficulty: undefined,
                maxPrepTime: undefined,
                maxCookTime: undefined,
                dietary: undefined,
                minRating: undefined,
              })
            }
          >
            <X className="size-4" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );
}

function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.cuisine) count++;
  if (filters.difficulty) count++;
  if (filters.maxPrepTime) count++;
  if (filters.maxCookTime) count++;
  if (filters.dietary && filters.dietary.length > 0)
    count += filters.dietary.length;
  if (filters.minRating) count++;
  return count;
}

export function FilterPanel(props: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = countActiveFilters(props.filters);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-[280px] shrink-0 md:block">
        <div className="sticky top-20">
          <FilterContent {...props} />
        </div>
      </div>

      {/* Mobile trigger + sheet */}
      <div className="md:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 size-5 justify-center rounded-full p-0 text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="sr-only">
                Filter search results
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 py-4">
              <FilterContent {...props} />
            </div>
            <SheetFooter>
              <Button className="w-full" onClick={() => setMobileOpen(false)}>
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
