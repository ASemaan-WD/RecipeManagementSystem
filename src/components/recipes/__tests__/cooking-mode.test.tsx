import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CookingMode } from '@/components/recipes/cooking-mode';
import {
  createMockRecipeIngredient,
  createMockRecipeStep,
} from '@/test/factories';

// Mock the Sheet component to simplify testing
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

const mockSteps = [
  createMockRecipeStep({
    id: 'step-1',
    stepNumber: 1,
    instruction: 'Preheat the oven.',
    duration: 10,
  }),
  createMockRecipeStep({
    id: 'step-2',
    stepNumber: 2,
    instruction: 'Mix ingredients.',
    duration: null,
  }),
  createMockRecipeStep({
    id: 'step-3',
    stepNumber: 3,
    instruction: 'Bake for 30 minutes.',
    duration: 30,
  }),
];

const mockIngredients = [
  createMockRecipeIngredient({
    id: 'ing-1',
    name: 'Flour',
    quantity: '2 cups',
    order: 0,
  }),
  createMockRecipeIngredient({
    id: 'ing-2',
    name: 'Sugar',
    quantity: '1 cup',
    order: 1,
  }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CookingMode', () => {
  it('renders the first step', () => {
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Preheat the oven.')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(screen.getByText('Mix ingredients.')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('navigates to previous step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Previous step' }));

    expect(screen.getByText('Preheat the oven.')).toBeInTheDocument();
  });

  it('disables previous button on first step', () => {
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Previous step' })
    ).toBeDisabled();
  });

  it('shows finish button on last step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(
      screen.getByRole('button', { name: 'Finish cooking' })
    ).toBeInTheDocument();
  });

  it('calls onClose when exit button is clicked (no active timers)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Exit cooking mode' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows ingredients in the panel', () => {
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Sugar')).toBeInTheDocument();
  });

  it('has a dialog role with recipe name', () => {
    const onClose = vi.fn();
    render(
      <CookingMode
        steps={mockSteps}
        ingredients={mockIngredients}
        recipeName="Test Recipe"
        onClose={onClose}
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Cooking mode for Test Recipe'
    );
  });
});
