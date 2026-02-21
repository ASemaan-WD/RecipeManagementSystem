import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeGrid } from '@/components/recipes/recipe-grid';
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
    <img alt={alt} src={src} {...props} />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecipeGrid', () => {
  it('renders recipe cards', () => {
    const recipes = [
      createMockRecipeListItem({ id: 'r1', name: 'Recipe One' }),
      createMockRecipeListItem({ id: 'r2', name: 'Recipe Two' }),
    ];
    render(<RecipeGrid recipes={recipes} />);

    expect(screen.getByText('Recipe One')).toBeInTheDocument();
    expect(screen.getByText('Recipe Two')).toBeInTheDocument();
  });

  it('renders skeletons when loading', () => {
    const { container } = render(
      <RecipeGrid recipes={[]} isLoading skeletonCount={4} />
    );

    // Skeletons render as Card-like divs within the grid
    const gridItems = container.querySelectorAll('[data-slot="card"]');
    expect(gridItems.length).toBeGreaterThanOrEqual(4);
  });

  it('renders empty state when no recipes', () => {
    render(<RecipeGrid recipes={[]} emptyState={<p>No recipes found!</p>} />);

    expect(screen.getByText('No recipes found!')).toBeInTheDocument();
  });

  it('renders default empty state when no custom one provided', () => {
    render(<RecipeGrid recipes={[]} />);

    expect(screen.getByText('No recipes found.')).toBeInTheDocument();
  });

  it('renders Load More button when hasMore is true', () => {
    const recipes = [createMockRecipeListItem()];
    render(<RecipeGrid recipes={recipes} hasMore onLoadMore={() => {}} />);

    expect(
      screen.getByRole('button', { name: /load more/i })
    ).toBeInTheDocument();
  });

  it('calls onLoadMore when Load More is clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const recipes = [createMockRecipeListItem()];

    render(<RecipeGrid recipes={recipes} hasMore onLoadMore={onLoadMore} />);

    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not render Load More button when hasMore is false', () => {
    const recipes = [createMockRecipeListItem()];
    render(<RecipeGrid recipes={recipes} hasMore={false} />);

    expect(
      screen.queryByRole('button', { name: /load more/i })
    ).not.toBeInTheDocument();
  });

  it('disables Load More button when loading more', () => {
    const recipes = [createMockRecipeListItem()];
    render(
      <RecipeGrid
        recipes={recipes}
        hasMore
        onLoadMore={() => {}}
        isLoadingMore
      />
    );

    expect(screen.getByRole('button', { name: /load more/i })).toBeDisabled();
  });
});
