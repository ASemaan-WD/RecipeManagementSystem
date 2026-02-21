import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeFormWizard } from '@/components/recipes/recipe-form/recipe-form-wizard';

// ─── Polyfill for Radix UI ───
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

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

vi.mock('next-cloudinary', () => ({
  CldUploadWidget: ({
    children,
  }: {
    children: (args: { open: () => void }) => React.ReactNode;
  }) => children({ open: vi.fn() }),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  mode: 'create' as const,
  onSubmit: vi.fn(),
  dietaryTags: [
    { id: 'tag-1', name: 'Vegetarian' },
    { id: 'tag-2', name: 'Vegan' },
  ],
};

const validDefaultValues = {
  name: 'Test Recipe',
  description: 'Description',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'EASY' as const,
  cuisineType: 'Italian',
  visibility: 'PRIVATE' as const,
  ingredients: [{ name: 'Flour', quantity: '2 cups', order: 0 }],
  steps: [{ instruction: 'Mix it', stepNumber: 1 }],
  dietaryTagIds: [],
  images: [],
};

describe('RecipeFormWizard', () => {
  it('renders the first step (Basic Info) by default', () => {
    render(<RecipeFormWizard {...defaultProps} />);

    expect(screen.getByText('Recipe Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Prep Time (min)')).toBeInTheDocument();
  });

  it('shows Previous button disabled on first step', () => {
    render(<RecipeFormWizard {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('shows Next button on non-last steps', () => {
    render(<RecipeFormWizard {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Create Recipe' })
    ).not.toBeInTheDocument();
  });

  it('blocks navigation when validation fails', async () => {
    const user = userEvent.setup();
    render(<RecipeFormWizard {...defaultProps} />);

    // The default values have name='', which should fail validation
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Should still be on step 1 (Basic Info visible)
    await waitFor(() => {
      expect(screen.getByText('Recipe Name')).toBeInTheDocument();
    });
  });

  it('navigates to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup();
    render(
      <RecipeFormWizard {...defaultProps} defaultValues={validDefaultValues} />
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Should navigate to step 2 — the IngredientsStep has heading "Ingredients"
    // and the progress bar also shows "Ingredients", so use getAllByText
    await waitFor(() => {
      expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
    });
  });

  it('can navigate back with Previous button', async () => {
    const user = userEvent.setup();

    render(
      <RecipeFormWizard {...defaultProps} defaultValues={validDefaultValues} />
    );

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
    });

    // Navigate back
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => {
      expect(screen.getByText('Recipe Name')).toBeInTheDocument();
    });
  });

  it('shows submit button on last step in create mode', async () => {
    const user = userEvent.setup();

    render(
      <RecipeFormWizard {...defaultProps} defaultValues={validDefaultValues} />
    );

    // Navigate through all 4 steps (0→1→2→3→4)
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
      // Wait for the step to actually change
      await waitFor(() => {
        // On the last step, 'Next' will be replaced by 'Create Recipe'
        if (i < 3) {
          expect(
            screen.getByRole('button', { name: 'Next' })
          ).toBeInTheDocument();
        }
      });
    }

    // On last step, should show submit button
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Create Recipe' })
      ).toBeInTheDocument();
    });
  });

  it('shows "Save Changes" button in edit mode', async () => {
    const user = userEvent.setup();

    render(
      <RecipeFormWizard
        {...defaultProps}
        mode="edit"
        defaultValues={validDefaultValues}
      />
    );

    // Navigate to last step
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
      await waitFor(() => {
        if (i < 3) {
          expect(
            screen.getByRole('button', { name: 'Next' })
          ).toBeInTheDocument();
        }
      });
    }

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeInTheDocument();
    });
  });

  it('renders step progress with current step info', () => {
    render(<RecipeFormWizard {...defaultProps} />);

    // The mobile progress text is "Step 1 of 5 — Basic Info"
    expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
  });
});
