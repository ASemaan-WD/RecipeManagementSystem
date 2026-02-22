import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { createMockRecipeListItem } from '@/test/factories';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    ...props
  }: {
    alt: string;
    src: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} data-testid="recipe-image" {...props} />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecipeCard', () => {
  it('renders recipe name as a link', () => {
    const recipe = createMockRecipeListItem();
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/recipes/recipe-1');
  });

  it('renders primary image when available', () => {
    const recipe = createMockRecipeListItem({
      primaryImage: { url: 'https://example.com/recipe.jpg' },
    });
    render(<RecipeCard recipe={recipe} />);

    const img = screen.getByTestId('recipe-image');
    expect(img).toHaveAttribute('src', 'https://example.com/recipe.jpg');
  });

  it('renders fallback when no image', () => {
    const recipe = createMockRecipeListItem({ primaryImage: null });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.queryByTestId('recipe-image')).not.toBeInTheDocument();
  });

  it('renders cuisine badge', () => {
    const recipe = createMockRecipeListItem({ cuisineType: 'Mexican' });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('Mexican')).toBeInTheDocument();
  });

  it('renders difficulty badge with correct label', () => {
    const recipe = createMockRecipeListItem({ difficulty: 'HARD' });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('renders rating when available', () => {
    const recipe = createMockRecipeListItem({
      avgRating: 4.5,
      ratingCount: 12,
    });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('4.5 (12)')).toBeInTheDocument();
  });

  it('renders "No ratings" when no rating', () => {
    const recipe = createMockRecipeListItem({
      avgRating: null,
      ratingCount: 0,
    });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('No ratings')).toBeInTheDocument();
  });

  it('renders author name', () => {
    const recipe = createMockRecipeListItem({
      author: {
        id: 'user-1',
        name: 'Chef Gordon',
        username: 'gordon',
        image: null,
      },
    });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('Chef Gordon')).toBeInTheDocument();
  });

  it('renders total time display', () => {
    const recipe = createMockRecipeListItem({ prepTime: 15, cookTime: 30 });
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText('45m total')).toBeInTheDocument();
    expect(screen.getByText('15m prep')).toBeInTheDocument();
  });
});
