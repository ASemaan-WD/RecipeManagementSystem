import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RecipeActions } from '@/components/recipes/recipe-detail/recipe-actions';

// ─── Module Mocks ───
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/recipes/recipe-detail/delete-recipe-dialog', () => ({
  DeleteRecipeDialog: () => null,
}));

vi.mock('@/components/social/share-dialog', () => ({
  ShareDialog: () => null,
}));

// ─── Global Setup ───
beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Test Suite ───
describe('RecipeActions', () => {
  it('renders Print button for all users', () => {
    render(
      <RecipeActions
        recipeId="recipe-1"
        isOwner={false}
        recipeName="Test Recipe"
      />
    );

    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
  });

  it('renders Duplicate button for all users', () => {
    render(
      <RecipeActions
        recipeId="recipe-1"
        isOwner={false}
        recipeName="Test Recipe"
      />
    );

    expect(
      screen.getByRole('button', { name: /duplicate/i })
    ).toBeInTheDocument();
  });

  it('renders owner-only actions when isOwner is true', () => {
    render(
      <RecipeActions
        recipeId="recipe-1"
        isOwner={true}
        recipeName="Test Recipe"
      />
    );

    expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('does not render owner-only actions when isOwner is false', () => {
    render(
      <RecipeActions
        recipeId="recipe-1"
        isOwner={false}
        recipeName="Test Recipe"
      />
    );

    expect(
      screen.queryByRole('link', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it('calls window.print when Print button is clicked', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <RecipeActions
        recipeId="recipe-1"
        isOwner={false}
        recipeName="Test Recipe"
      />
    );

    await user.click(screen.getByRole('button', { name: /print/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });
});
