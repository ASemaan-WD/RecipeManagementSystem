'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FolderHeart,
  Heart,
  Bookmark,
  CheckCircle,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeGrid } from '@/components/recipes/recipe-grid';
import {
  useCollection,
  type CollectionFilters,
  type CollectionCounts,
} from '@/hooks/use-tags';
import type { RecipeListItem } from '@/types/recipe';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'to-try', label: 'To Try' },
  { value: 'made-before', label: 'Made Before' },
  { value: 'saved', label: 'Saved' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'title', label: 'Title A-Z' },
] as const;

const PAGE_SIZE = 12;

const EMPTY_STATES: Record<
  string,
  { message: string; description: string; cta: string; href: string }
> = {
  all: {
    message: 'Your collection is empty',
    description: 'Browse the community to discover recipes!',
    cta: 'Browse Recipes',
    href: '/search',
  },
  favorites: {
    message: 'No favorites yet',
    description: 'Tap the heart icon on recipes you love.',
    cta: 'Browse Recipes',
    href: '/search',
  },
  'to-try': {
    message: 'No recipes marked to try',
    description: 'Bookmark recipes you want to cook.',
    cta: 'Browse Recipes',
    href: '/search',
  },
  'made-before': {
    message: 'No recipes marked as made',
    description: "Check off recipes you've cooked.",
    cta: 'Browse Recipes',
    href: '/search',
  },
  saved: {
    message: 'No saved recipes',
    description: 'Save recipes from the community to your collection.',
    cta: 'Browse Recipes',
    href: '/search',
  },
};

function EmptyState({ tab }: { tab: string }) {
  const state = EMPTY_STATES[tab] ?? EMPTY_STATES['all']!;
  const Icon =
    tab === 'favorites'
      ? Heart
      : tab === 'saved'
        ? Bookmark
        : tab === 'made-before'
          ? CheckCircle
          : FolderHeart;

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Icon className="text-muted-foreground size-12" />
      <div>
        <h3 className="text-lg font-medium">{state.message}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {state.description}
        </p>
      </div>
      <Button asChild>
        <Link href={state.href}>
          <Search className="size-4" />
          {state.cta}
        </Link>
      </Button>
    </div>
  );
}

function getTabLabel(
  tab: (typeof TABS)[number],
  counts: CollectionCounts | undefined
): string {
  if (!counts) return tab.label;

  const countMap: Record<string, number> = {
    all: counts.all,
    favorites: counts.favorites,
    'to-try': counts.toTry,
    'made-before': counts.madeBefore,
    saved: counts.saved,
  };

  const count = countMap[tab.value];
  return count !== undefined ? `${tab.label} (${count})` : tab.label;
}

export default function MyCollectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get('tab') ?? 'all';
  const initialSort = searchParams.get('sort') ?? 'newest';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sort, setSort] = useState(initialSort);
  const [pages, setPages] = useState(1);
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([]);

  const filters: CollectionFilters = {
    tab: activeTab,
    page: pages,
    limit: PAGE_SIZE,
    sort,
  };

  const { data, isLoading } = useCollection(filters);

  // Accumulate recipes for "Load More" pattern
  const recipes =
    pages === 1 ? (data?.data ?? []) : [...allRecipes, ...(data?.data ?? [])];

  const totalPages = data?.pagination.totalPages ?? 1;
  const hasMore = pages < totalPages;

  function updateUrl(tab: string, sortValue: string) {
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('tab', tab);
    if (sortValue !== 'newest') params.set('sort', sortValue);
    const query = params.toString();
    router.replace(query ? `/my-collection?${query}` : '/my-collection');
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPages(1);
    setAllRecipes([]);
    updateUrl(tab, sort);
  }

  function handleSortChange(value: string) {
    setSort(value);
    setPages(1);
    setAllRecipes([]);
    updateUrl(activeTab, value);
  }

  function handleLoadMore() {
    if (data?.data) {
      setAllRecipes((prev) => [...prev, ...data.data]);
    }
    setPages((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Collection</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {getTabLabel(tab, data?.counts)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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

      <RecipeGrid
        recipes={recipes}
        isLoading={isLoading && pages === 1}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoading && pages > 1}
        emptyState={<EmptyState tab={activeTab} />}
      />
    </div>
  );
}
