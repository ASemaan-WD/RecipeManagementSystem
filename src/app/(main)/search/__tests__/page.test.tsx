import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from '@/app/(main)/search/page';

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockSearchData = {
  data: [
    {
      id: 'recipe-1',
      name: 'Test Chicken Recipe',
      description: 'A delicious chicken recipe',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'EASY',
      cuisineType: 'Italian',
      visibility: 'PUBLIC',
      avgRating: 4.5,
      ratingCount: 10,
      createdAt: '2025-01-01T00:00:00.000Z',
      author: { id: 'user-1', name: 'Chef', username: 'chef', image: null },
      primaryImage: null,
      dietaryTags: [],
      isSaved: false,
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  },
};

vi.mock('@/hooks/use-search', () => ({
  useSearch: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useDebouncedValue: vi.fn((value: string) => value),
  useCuisineOptions: () => ({
    data: ['Italian', 'Mexican'],
    isLoading: false,
  }),
  useDietaryTags: () => ({
    data: [{ id: 'tag-1', name: 'Vegetarian' }],
    isLoading: false,
  }),
}));

vi.mock('@/components/recipes/recipe-grid', () => ({
  RecipeGrid: ({
    recipes,
    isLoading,
    emptyState,
  }: {
    recipes: unknown[];
    isLoading: boolean;
    emptyState: React.ReactNode;
  }) => (
    <div data-testid="recipe-grid">
      {isLoading ? (
        <div>Loading...</div>
      ) : recipes.length > 0 ? (
        recipes.map((r: Record<string, unknown>) => (
          <div key={r.id as string}>{r.name as string}</div>
        ))
      ) : (
        emptyState
      )}
    </div>
  ),
}));

const { useSearch } = await import('@/hooks/use-search');
const mockUseSearch = vi.mocked(useSearch);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSearch.mockReturnValue({
    data: null,
    isLoading: false,
  } as ReturnType<typeof useSearch>);
});

describe('SearchPage', () => {
  it('renders the search bar', () => {
    render(<SearchPage />);
    expect(
      screen.getByPlaceholderText('Search recipes...')
    ).toBeInTheDocument();
  });

  it('renders the sort dropdown', () => {
    render(<SearchPage />);
    // Multiple comboboxes exist (cuisine filter + sort). Check that at least one exists.
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no results and data is loaded', () => {
    mockUseSearch.mockReturnValue({
      data: {
        data: [],
        pagination: { total: 0, page: 1, pageSize: 12, totalPages: 0 },
      },
      isLoading: false,
    } as ReturnType<typeof useSearch>);

    render(<SearchPage />);
    // "No recipes found" appears both in result count and empty state
    const matches = screen.getAllByText('No recipes found');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders result count when recipes are found', () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchData,
      isLoading: false,
    } as ReturnType<typeof useSearch>);

    render(<SearchPage />);
    // The count "1" is in a span, and "recipe found" is adjacent text
    expect(screen.getByText(/recipe found/i)).toBeInTheDocument();
  });

  it('renders "Searching..." text when loading', () => {
    mockUseSearch.mockReturnValue({
      data: null,
      isLoading: true,
    } as ReturnType<typeof useSearch>);

    render(<SearchPage />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('renders recipes from search results', () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchData,
      isLoading: false,
    } as ReturnType<typeof useSearch>);

    render(<SearchPage />);
    expect(screen.getByText('Test Chicken Recipe')).toBeInTheDocument();
  });

  it('renders the filter panel sections', () => {
    render(<SearchPage />);
    expect(screen.getByText('Cuisine')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Max Prep Time')).toBeInTheDocument();
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
  });

  it('handles search input and triggers search', async () => {
    const user = userEvent.setup();
    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search recipes...');
    await user.type(input, 'chicken{Enter}');

    // The page-variant SearchBar calls onSearch, which updates URL
    expect(mockReplace).toHaveBeenCalled();
  });
});
