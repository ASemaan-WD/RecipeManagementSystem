import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagToggles } from '@/components/recipes/tag-toggles';

const mockMutate = vi.fn();

vi.mock('@/hooks/use-tags', () => ({
  useToggleTag: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock('@/generated/prisma/client', () => ({
  TagStatus: {
    FAVORITE: 'FAVORITE',
    TO_TRY: 'TO_TRY',
    MADE_BEFORE: 'MADE_BEFORE',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TagToggles', () => {
  it('renders all three buttons in full variant', () => {
    render(<TagToggles recipeId="recipe-1" initialTags={[]} variant="full" />);

    expect(screen.getByText('Favorite')).toBeInTheDocument();
    expect(screen.getByText('To Try')).toBeInTheDocument();
    expect(screen.getByText('Made Before')).toBeInTheDocument();
  });

  it('renders three icon-only buttons in compact variant', () => {
    render(
      <TagToggles recipeId="recipe-1" initialTags={[]} variant="compact" />
    );

    // Compact variant should not show text labels
    expect(screen.queryByText('Favorite')).not.toBeInTheDocument();
    expect(screen.queryByText('To Try')).not.toBeInTheDocument();
    expect(screen.queryByText('Made Before')).not.toBeInTheDocument();

    // Should have exactly 3 buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('calls mutate when a tag button is clicked', async () => {
    const user = userEvent.setup();
    render(<TagToggles recipeId="recipe-1" initialTags={[]} variant="full" />);

    await user.click(screen.getByText('Favorite'));

    expect(mockMutate).toHaveBeenCalledWith(
      { recipeId: 'recipe-1', status: 'FAVORITE', isActive: false },
      expect.any(Object)
    );
  });

  it('toggles active tag off when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TagToggles
        recipeId="recipe-1"
        initialTags={['FAVORITE']}
        variant="full"
      />
    );

    await user.click(screen.getByText('Favorite'));

    expect(mockMutate).toHaveBeenCalledWith(
      { recipeId: 'recipe-1', status: 'FAVORITE', isActive: true },
      expect.any(Object)
    );
  });

  it('does not call mutate when disabled', async () => {
    const user = userEvent.setup();
    render(
      <TagToggles
        recipeId="recipe-1"
        initialTags={[]}
        variant="full"
        disabled
      />
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }

    // Clicking disabled buttons should not trigger mutate
    await user.click(buttons[0]!);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
