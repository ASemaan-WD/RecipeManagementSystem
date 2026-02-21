import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '@/components/search/filter-panel';
import type { SearchFilters } from '@/hooks/use-search';

const mockCuisines = ['Italian', 'Mexican', 'Japanese'];
const mockDietaryTags = [
  { id: 'tag-1', name: 'Vegetarian' },
  { id: 'tag-2', name: 'Vegan' },
  { id: 'tag-3', name: 'Gluten-Free' },
];

vi.mock('@/hooks/use-search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-search')>();
  return {
    ...actual,
    useCuisineOptions: () => ({
      data: mockCuisines,
      isLoading: false,
    }),
    useDietaryTags: () => ({
      data: mockDietaryTags,
      isLoading: false,
    }),
  };
});

const defaultFilters: SearchFilters = {};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FilterPanel', () => {
  describe('desktop sidebar', () => {
    it('renders the cuisine filter label', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('Cuisine')).toBeInTheDocument();
    });

    it('renders difficulty options', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('renders prep time presets', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('< 15 min')).toBeInTheDocument();
      expect(screen.getByText('Max Prep Time')).toBeInTheDocument();
      // < 30 min appears in both prep and cook time; just verify the label exists
      expect(screen.getAllByText('< 30 min').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('< 60 min').length).toBeGreaterThanOrEqual(1);
    });

    it('renders cook time presets', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('< 120 min')).toBeInTheDocument();
    });

    it('renders dietary tag checkboxes', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Vegan')).toBeInTheDocument();
      expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    });

    it('renders min rating stars', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('Minimum Rating')).toBeInTheDocument();
      expect(screen.getByLabelText('1+ stars')).toBeInTheDocument();
      expect(screen.getByLabelText('5+ stars')).toBeInTheDocument();
    });
  });

  describe('filter interactions', () => {
    it('calls onFilterChange when difficulty is clicked', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel filters={defaultFilters} onFilterChange={onFilterChange} />
      );

      await user.click(screen.getByText('Easy'));

      expect(onFilterChange).toHaveBeenCalledWith({ difficulty: 'EASY' });
    });

    it('calls onFilterChange when prep time preset is clicked', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel filters={defaultFilters} onFilterChange={onFilterChange} />
      );

      await user.click(screen.getByText('< 15 min'));

      expect(onFilterChange).toHaveBeenCalledWith({ maxPrepTime: 15 });
    });

    it('toggles off prep time when same preset is clicked again', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel
          filters={{ maxPrepTime: 15 }}
          onFilterChange={onFilterChange}
        />
      );

      await user.click(screen.getByText('< 15 min'));

      expect(onFilterChange).toHaveBeenCalledWith({ maxPrepTime: undefined });
    });

    it('calls onFilterChange when rating star is clicked', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel filters={defaultFilters} onFilterChange={onFilterChange} />
      );

      await user.click(screen.getByLabelText('3+ stars'));

      expect(onFilterChange).toHaveBeenCalledWith({ minRating: 3 });
    });

    it('toggles off rating when same star is clicked again', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel
          filters={{ minRating: 3 }}
          onFilterChange={onFilterChange}
        />
      );

      await user.click(screen.getByLabelText('3+ stars'));

      expect(onFilterChange).toHaveBeenCalledWith({ minRating: undefined });
    });
  });

  describe('clear all filters', () => {
    it('does not render "Clear All Filters" when no filters active', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });

    it('renders "Clear All Filters" when filters are active', () => {
      render(
        <FilterPanel
          filters={{ difficulty: 'EASY' }}
          onFilterChange={vi.fn()}
        />
      );
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    it('calls onFilterChange to clear all when button is clicked', async () => {
      const onFilterChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterPanel
          filters={{ difficulty: 'EASY', cuisine: 'Italian' }}
          onFilterChange={onFilterChange}
        />
      );

      await user.click(screen.getByText('Clear All Filters'));

      expect(onFilterChange).toHaveBeenCalledWith({
        cuisine: undefined,
        difficulty: undefined,
        maxPrepTime: undefined,
        maxCookTime: undefined,
        dietary: undefined,
        minRating: undefined,
      });
    });
  });

  describe('mobile trigger', () => {
    it('renders the mobile "Filters" button', () => {
      render(<FilterPanel filters={defaultFilters} onFilterChange={vi.fn()} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('shows active filter count badge on mobile button', () => {
      const { container } = render(
        <FilterPanel
          filters={{ difficulty: 'EASY', minRating: 3 }}
          onFilterChange={vi.fn()}
        />
      );
      // The badge shows the count of active filters
      // 2 filters: difficulty + minRating
      const badges = container.querySelectorAll('[class*="rounded-full"]');
      const countBadge = Array.from(badges).find((b) => b.textContent === '2');
      expect(countBadge).toBeTruthy();
    });
  });
});
