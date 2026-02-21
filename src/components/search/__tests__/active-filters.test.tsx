import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveFilters } from '@/components/search/active-filters';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActiveFilters', () => {
  describe('rendering', () => {
    it('returns null when no filters are active', () => {
      const { container } = render(
        <ActiveFilters
          filters={{}}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders a chip for cuisine filter', () => {
      render(
        <ActiveFilters
          filters={{ cuisine: 'Italian' }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
    });

    it('renders a chip for difficulty filter', () => {
      render(
        <ActiveFilters
          filters={{ difficulty: 'EASY' }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Difficulty: Easy')).toBeInTheDocument();
    });

    it('renders a chip for maxPrepTime filter', () => {
      render(
        <ActiveFilters
          filters={{ maxPrepTime: 30 }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Prep: < 30 min')).toBeInTheDocument();
    });

    it('renders a chip for maxCookTime filter', () => {
      render(
        <ActiveFilters
          filters={{ maxCookTime: 60 }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Cook: < 60 min')).toBeInTheDocument();
    });

    it('renders a chip for each dietary tag', () => {
      render(
        <ActiveFilters
          filters={{ dietary: ['vegan', 'gluten-free'] }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Dietary: vegan')).toBeInTheDocument();
      expect(screen.getByText('Dietary: gluten-free')).toBeInTheDocument();
    });

    it('renders a chip for minRating filter', () => {
      render(
        <ActiveFilters
          filters={{ minRating: 4 }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Rating: 4+')).toBeInTheDocument();
    });

    it('renders multiple chips for multiple filters', () => {
      render(
        <ActiveFilters
          filters={{
            cuisine: 'Italian',
            difficulty: 'HARD',
            minRating: 3,
          }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
      expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
      expect(screen.getByText('Rating: 3+')).toBeInTheDocument();
    });
  });

  describe('remove interactions', () => {
    it('calls onRemoveFilter when chip X is clicked', async () => {
      const onRemoveFilter = vi.fn();
      const user = userEvent.setup();
      render(
        <ActiveFilters
          filters={{ cuisine: 'Italian' }}
          onRemoveFilter={onRemoveFilter}
          onClearAll={vi.fn()}
        />
      );

      await user.click(screen.getByLabelText('Remove Cuisine: Italian'));

      expect(onRemoveFilter).toHaveBeenCalledWith('cuisine', undefined);
    });

    it('calls onRemoveFilter with value for dietary tag', async () => {
      const onRemoveFilter = vi.fn();
      const user = userEvent.setup();
      render(
        <ActiveFilters
          filters={{ dietary: ['vegan', 'keto'] }}
          onRemoveFilter={onRemoveFilter}
          onClearAll={vi.fn()}
        />
      );

      await user.click(screen.getByLabelText('Remove Dietary: vegan'));

      expect(onRemoveFilter).toHaveBeenCalledWith('dietary', 'vegan');
    });
  });

  describe('clear all', () => {
    it('does not render "Clear All" with only 1 filter', () => {
      render(
        <ActiveFilters
          filters={{ cuisine: 'Italian' }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('renders "Clear All" with 2+ filters', () => {
      render(
        <ActiveFilters
          filters={{ cuisine: 'Italian', difficulty: 'EASY' }}
          onRemoveFilter={vi.fn()}
          onClearAll={vi.fn()}
        />
      );
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('calls onClearAll when "Clear All" is clicked', async () => {
      const onClearAll = vi.fn();
      const user = userEvent.setup();
      render(
        <ActiveFilters
          filters={{ cuisine: 'Italian', difficulty: 'EASY' }}
          onRemoveFilter={vi.fn()}
          onClearAll={onClearAll}
        />
      );

      await user.click(screen.getByText('Clear All'));

      expect(onClearAll).toHaveBeenCalledTimes(1);
    });
  });
});
