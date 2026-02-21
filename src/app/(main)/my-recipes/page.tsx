'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, ChefHat } from 'lucide-react';

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
import { useRecipes } from '@/hooks/use-recipes';
import type { RecipeFilters, RecipeListItem } from '@/types/recipe';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'SHARED', label: 'Shared' },
  { value: 'PRIVATE', label: 'Private' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title A-Z' },
] as const;

const PAGE_SIZE = 12;

function EmptyState({ tab }: { tab: string }) {
  if (tab === 'all') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <ChefHat className="text-muted-foreground size-12" />
        <div>
          <h3 className="text-lg font-medium">No recipes yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            You haven&apos;t created any recipes yet. Start by creating your
            first recipe!
          </p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="size-4" />
            Create Your First Recipe
          </Link>
        </Button>
      </div>
    );
  }

  const label = tab.charAt(0) + tab.slice(1).toLowerCase();
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-muted-foreground">No {label} recipes found.</p>
    </div>
  );
}

export default function MyRecipesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get('tab') ?? 'all';
  const initialSort = searchParams.get('sort') ?? 'newest';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sort, setSort] = useState(initialSort);
  const [pages, setPages] = useState(1);
  const [allRecipes, setAllRecipes] = useState<RecipeListItem[]>([]);

  const filters: RecipeFilters = {
    page: pages,
    limit: PAGE_SIZE,
    sort,
    visibility:
      activeTab === 'all'
        ? undefined
        : (activeTab as RecipeFilters['visibility']),
  };

  const { data, isLoading } = useRecipes(filters);

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
    router.replace(query ? `/my-recipes?${query}` : '/my-recipes');
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
        <h1 className="text-2xl font-bold tracking-tight">My Recipes</h1>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="size-4" />
            Create New Recipe
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
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
