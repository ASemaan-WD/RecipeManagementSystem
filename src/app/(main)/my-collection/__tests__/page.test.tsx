import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyCollectionPage from '@/app/(main)/my-collection/page';

const mockReplace = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

const mockUseCollection = vi.fn();

vi.mock('@/hooks/use-tags', () => ({
  useCollection: (...args: unknown[]) => mockUseCollection(...args),
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
      {isLoading && <div>Loading...</div>}
      {recipes.length === 0 && !isLoading && emptyState}
      {recipes.length > 0 && <div>Recipes: {recipes.length}</div>}
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockReturnValue(null);
});

const mockCounts = {
  all: 10,
  favorites: 4,
  toTry: 3,
  madeBefore: 1,
  saved: 5,
};

describe('MyCollectionPage', () => {
  it('renders tab navigation with all five tabs', () => {
    mockUseCollection.mockReturnValue({
      data: { data: [], pagination: { totalPages: 0 }, counts: mockCounts },
      isLoading: false,
    });

    render(<MyCollectionPage />);

    expect(screen.getByText('All (10)')).toBeInTheDocument();
    expect(screen.getByText('Favorites (4)')).toBeInTheDocument();
    expect(screen.getByText('To Try (3)')).toBeInTheDocument();
    expect(screen.getByText('Made Before (1)')).toBeInTheDocument();
    expect(screen.getByText('Saved (5)')).toBeInTheDocument();
  });

  it('renders page title', () => {
    mockUseCollection.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<MyCollectionPage />);
    expect(screen.getByText('My Collection')).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    mockUseCollection.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<MyCollectionPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state for all tab', () => {
    mockUseCollection.mockReturnValue({
      data: {
        data: [],
        pagination: { totalPages: 0 },
        counts: { all: 0, favorites: 0, toTry: 0, madeBefore: 0, saved: 0 },
      },
      isLoading: false,
    });

    render(<MyCollectionPage />);
    expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
    expect(
      screen.getByText('Browse the community to discover recipes!')
    ).toBeInTheDocument();
  });

  it('tab selection updates URL search params', async () => {
    const user = userEvent.setup();
    mockUseCollection.mockReturnValue({
      data: {
        data: [],
        pagination: { totalPages: 0 },
        counts: mockCounts,
      },
      isLoading: false,
    });

    render(<MyCollectionPage />);

    await user.click(screen.getByText('Favorites (4)'));
    expect(mockReplace).toHaveBeenCalledWith('/my-collection?tab=favorites');
  });

  it('renders sort dropdown with default value', () => {
    mockUseCollection.mockReturnValue({
      data: {
        data: [],
        pagination: { totalPages: 0 },
        counts: mockCounts,
      },
      isLoading: false,
    });

    render(<MyCollectionPage />);

    // Sort dropdown should be rendered
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('reads initial tab from URL', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'tab') return 'saved';
      if (key === 'sort') return 'rating';
      return null;
    });

    mockUseCollection.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<MyCollectionPage />);

    // The hook should be called with the initial filters from URL
    expect(mockUseCollection).toHaveBeenCalledWith(
      expect.objectContaining({
        tab: 'saved',
        sort: 'rating',
      })
    );
  });

  it('displays recipes when data is available', () => {
    mockUseCollection.mockReturnValue({
      data: {
        data: [
          { id: '1', name: 'Recipe 1' },
          { id: '2', name: 'Recipe 2' },
        ],
        pagination: { totalPages: 1 },
        counts: mockCounts,
      },
      isLoading: false,
    });

    render(<MyCollectionPage />);
    expect(screen.getByText('Recipes: 2')).toBeInTheDocument();
  });
});
