'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchX } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecipeGrid } from '@/components/recipes/recipe-grid';
import { SearchBar } from '@/components/search/search-bar';
import { FilterPanel } from '@/components/search/filter-panel';
import { ActiveFilters } from '@/components/search/active-filters';
import {
  useSearch,
  useDebouncedValue,
  type SearchFilters,
} from '@/hooks/use-search';
import type { RecipeListItem } from '@/types/recipe';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'prepTime', label: 'Prep Time' },
  { value: 'title', label: 'Title A-Z' },
] as const;

const PAGE_SIZE = 12;

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <SearchX className="text-muted-foreground size-12" />
      <div>
        <h3 className="text-lg font-medium">No recipes found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Try different keywords or adjust your filters.
        </p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL
  const initialQ = searchParams.get('q') ?? '';
  const initialCuisine = searchParams.get('cuisine') ?? undefined;
  const initialDifficulty = searchParams.get('difficulty') ?? undefined;
  const initialMaxPrepTime = searchParams.get('maxPrepTime')
    ? Number(searchParams.get('maxPrepTime'))
    : undefined;
  const initialMaxCookTime = searchParams.get('maxCookTime')
    ? Number(searchParams.get('maxCookTime'))
    : undefined;
  const initialDietary = searchParams.getAll('dietary');
  const initialMinRating = searchParams.get('minRating')
    ? Number(searchParams.get('minRating'))
    : undefined;
  const initialSort = searchParams.get('sort') ?? undefined;

  // Local state for search query (uncontrolled, debounced)
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Filter state
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [maxPrepTime, setMaxPrepTime] = useState(initialMaxPrepTime);
  const [maxCookTime, setMaxCookTime] = useState(initialMaxCookTime);
  const [dietary, setDietary] = useState<string[] | undefined>(
    initialDietary.length > 0 ? initialDietary : undefined
  );
  const [minRating, setMinRating] = useState(initialMinRating);
  const [sort, setSort] = useState(
    initialSort ?? (initialQ ? 'relevance' : 'newest')
  );
  const [pages, setPages] = useState(1);
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([]);

  // Build search filters for the hook
  const filters: SearchFilters = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      cuisine,
      difficulty,
      maxPrepTime,
      maxCookTime,
      dietary,
      minRating,
      sort,
      page: pages,
      limit: PAGE_SIZE,
    }),
    [
      debouncedQuery,
      cuisine,
      difficulty,
      maxPrepTime,
      maxCookTime,
      dietary,
      minRating,
      sort,
      pages,
    ]
  );

  const { data, isLoading } = useSearch(filters);

  // Accumulate recipes for "Load More" pattern
  const recipes =
    pages === 1 ? (data?.data ?? []) : [...allRecipes, ...(data?.data ?? [])];
  const totalPages = data?.pagination.totalPages ?? 1;
  const total = data?.pagination.total ?? 0;
  const hasMore = pages < totalPages;

  // Update URL with current filter state
  const updateUrl = useCallback(
    (overrides: Partial<SearchFilters & { q: string }>) => {
      const params = new URLSearchParams();

      const q = overrides.q !== undefined ? overrides.q : searchQuery;
      const c = overrides.cuisine !== undefined ? overrides.cuisine : cuisine;
      const d =
        overrides.difficulty !== undefined ? overrides.difficulty : difficulty;
      const mp =
        overrides.maxPrepTime !== undefined
          ? overrides.maxPrepTime
          : maxPrepTime;
      const mc =
        overrides.maxCookTime !== undefined
          ? overrides.maxCookTime
          : maxCookTime;
      const dt = overrides.dietary !== undefined ? overrides.dietary : dietary;
      const mr =
        overrides.minRating !== undefined ? overrides.minRating : minRating;
      const s = overrides.sort !== undefined ? overrides.sort : sort;

      if (q) params.set('q', q);
      if (c) params.set('cuisine', c);
      if (d) params.set('difficulty', d);
      if (mp) params.set('maxPrepTime', String(mp));
      if (mc) params.set('maxCookTime', String(mc));
      if (dt && dt.length > 0) {
        for (const tag of dt) params.append('dietary', tag);
      }
      if (mr) params.set('minRating', String(mr));
      if (s && s !== 'relevance') params.set('sort', s);

      const query = params.toString();
      router.replace(query ? `/search?${query}` : '/search');
    },
    [
      searchQuery,
      cuisine,
      difficulty,
      maxPrepTime,
      maxCookTime,
      dietary,
      minRating,
      sort,
      router,
    ]
  );

  function handleSearch(q: string) {
    setSearchQuery(q);
    setPages(1);
    setAllRecipes([]);
    // Default sort to relevance when there's a search query
    if (q && sort !== 'relevance') {
      setSort('relevance');
      updateUrl({ q, sort: 'relevance' });
    } else if (!q && sort === 'relevance') {
      setSort('newest');
      updateUrl({ q, sort: 'newest' });
    } else {
      updateUrl({ q });
    }
  }

  function handleFilterChange(changes: Partial<SearchFilters>) {
    if (changes.cuisine !== undefined) setCuisine(changes.cuisine);
    if (changes.difficulty !== undefined) setDifficulty(changes.difficulty);
    if (changes.maxPrepTime !== undefined) setMaxPrepTime(changes.maxPrepTime);
    if (changes.maxCookTime !== undefined) setMaxCookTime(changes.maxCookTime);
    if (changes.dietary !== undefined) setDietary(changes.dietary);
    if (changes.minRating !== undefined) setMinRating(changes.minRating);

    setPages(1);
    setAllRecipes([]);
    updateUrl(changes);
  }

  function handleRemoveFilter(key: string, value?: string) {
    if (key === 'dietary' && value) {
      const updated = dietary?.filter((id) => id !== value);
      setDietary(updated && updated.length > 0 ? updated : undefined);
      setPages(1);
      setAllRecipes([]);
      updateUrl({
        dietary: updated && updated.length > 0 ? updated : undefined,
      });
    } else {
      handleFilterChange({ [key]: undefined });
    }
  }

  function handleClearAll() {
    setCuisine(undefined);
    setDifficulty(undefined);
    setMaxPrepTime(undefined);
    setMaxCookTime(undefined);
    setDietary(undefined);
    setMinRating(undefined);
    setPages(1);
    setAllRecipes([]);
    updateUrl({
      cuisine: undefined,
      difficulty: undefined,
      maxPrepTime: undefined,
      maxCookTime: undefined,
      dietary: undefined,
      minRating: undefined,
    });
  }

  function handleSortChange(value: string) {
    setSort(value);
    setPages(1);
    setAllRecipes([]);
    updateUrl({ sort: value });
  }

  function handleLoadMore() {
    if (data?.data) {
      setAllRecipes((prev) => [...prev, ...data.data]);
    }
    setPages((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar
        defaultValue={initialQ}
        variant="page"
        onSearch={handleSearch}
      />

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Main Content */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />

        {/* Results */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Result count + Sort */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground shrink-0 text-sm">
              {isLoading ? (
                'Searching...'
              ) : total > 0 ? (
                <>
                  <span className="text-foreground font-medium">{total}</span>{' '}
                  {total === 1 ? 'recipe' : 'recipes'} found
                </>
              ) : data ? (
                'No recipes found'
              ) : null}
            </p>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
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

          {/* Recipe Grid */}
          <RecipeGrid
            recipes={recipes}
            isLoading={isLoading && pages === 1}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoading && pages > 1}
            emptyState={<EmptyState />}
          />
        </div>
      </div>
    </div>
  );
}
