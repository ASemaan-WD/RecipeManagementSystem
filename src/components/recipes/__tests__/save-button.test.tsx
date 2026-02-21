import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveButton } from '@/components/recipes/save-button';

const mockMutate = vi.fn();

vi.mock('@/hooks/use-tags', () => ({
  useToggleSave: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SaveButton', () => {
  it('renders unsaved state in full variant', () => {
    render(
      <SaveButton recipeId="recipe-1" initialSaved={false} variant="full" />
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders saved state in full variant', () => {
    render(
      <SaveButton recipeId="recipe-1" initialSaved={true} variant="full" />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders compact variant without text', () => {
    render(
      <SaveButton recipeId="recipe-1" initialSaved={false} variant="compact" />
    );

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls mutate with isSaved=false when saving', async () => {
    const user = userEvent.setup();
    render(
      <SaveButton recipeId="recipe-1" initialSaved={false} variant="full" />
    );

    await user.click(screen.getByText('Save'));

    expect(mockMutate).toHaveBeenCalledWith(
      { recipeId: 'recipe-1', isSaved: false },
      expect.any(Object)
    );
  });

  it('calls mutate with isSaved=true when unsaving', async () => {
    const user = userEvent.setup();
    render(
      <SaveButton recipeId="recipe-1" initialSaved={true} variant="full" />
    );

    await user.click(screen.getByText('Saved'));

    expect(mockMutate).toHaveBeenCalledWith(
      { recipeId: 'recipe-1', isSaved: true },
      expect.any(Object)
    );
  });

  it('does not call mutate when disabled', async () => {
    const user = userEvent.setup();
    render(
      <SaveButton
        recipeId="recipe-1"
        initialSaved={false}
        variant="full"
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
