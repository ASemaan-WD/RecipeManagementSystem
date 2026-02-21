import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/search/search-bar';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SearchBar', () => {
  describe('rendering', () => {
    it('renders the search input with placeholder', () => {
      render(<SearchBar />);
      expect(
        screen.getByPlaceholderText('Search recipes...')
      ).toBeInTheDocument();
    });

    it('renders with defaultValue pre-filled', () => {
      render(<SearchBar defaultValue="pasta" />);
      expect(screen.getByDisplayValue('pasta')).toBeInTheDocument();
    });

    it('renders with aria-label for accessibility', () => {
      render(<SearchBar />);
      expect(screen.getByLabelText('Search recipes')).toBeInTheDocument();
    });

    it('renders Ctrl+K badge in header variant when input is empty', () => {
      render(<SearchBar variant="header" />);
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
    });

    it('does not render Ctrl+K badge in page variant', () => {
      render(<SearchBar variant="page" />);
      expect(screen.queryByText('Ctrl+K')).not.toBeInTheDocument();
    });

    it('does not render clear button when input is empty', () => {
      render(<SearchBar />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('renders clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      await user.type(screen.getByLabelText('Search recipes'), 'test');

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });
  });

  describe('header variant', () => {
    it('navigates to /search with query on Enter', async () => {
      const user = userEvent.setup();
      render(<SearchBar variant="header" />);

      const input = screen.getByLabelText('Search recipes');
      await user.type(input, 'chicken{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=chicken');
    });

    it('navigates to /search without query when Enter with empty input', async () => {
      const user = userEvent.setup();
      render(<SearchBar variant="header" />);

      const input = screen.getByLabelText('Search recipes');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/search');
    });

    it('hides Ctrl+K badge when value is typed', async () => {
      const user = userEvent.setup();
      render(<SearchBar variant="header" />);

      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();

      await user.type(screen.getByLabelText('Search recipes'), 'a');

      expect(screen.queryByText('Ctrl+K')).not.toBeInTheDocument();
    });
  });

  describe('page variant', () => {
    it('calls onSearch callback on Enter', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar variant="page" onSearch={onSearch} />);

      const input = screen.getByLabelText('Search recipes');
      await user.type(input, 'pasta{Enter}');

      expect(onSearch).toHaveBeenCalledWith('pasta');
    });

    it('does not navigate on Enter', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar variant="page" onSearch={onSearch} />);

      await user.type(screen.getByLabelText('Search recipes'), 'test{Enter}');

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('clear button', () => {
    it('clears the input when clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar defaultValue="chicken" />);

      expect(screen.getByDisplayValue('chicken')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Clear search'));

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('calls onSearch with empty string on clear in page variant', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(
        <SearchBar variant="page" defaultValue="chicken" onSearch={onSearch} />
      );

      await user.click(screen.getByLabelText('Clear search'));

      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  describe('keyboard shortcut', () => {
    it('focuses input on Ctrl+K', async () => {
      const user = userEvent.setup();
      render(<SearchBar variant="header" />);

      const input = screen.getByLabelText('Search recipes');
      expect(input).not.toHaveFocus();

      await user.keyboard('{Control>}k{/Control}');

      expect(input).toHaveFocus();
    });
  });
});
