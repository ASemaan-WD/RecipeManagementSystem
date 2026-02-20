import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import { MobileNav } from '@/components/layout/mobile-nav';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'system',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
    forcedTheme: undefined,
  })),
}));

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MobileNav', () => {
  describe('when authenticated', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      user: mockUser,
      isAuthenticated: true,
    };

    it('renders Dashboard link with href /dashboard', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders My Recipes link with href /my-recipes', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /my recipes/i });
      expect(link).toHaveAttribute('href', '/my-recipes');
    });

    it('renders Community link with href /community', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /community/i });
      expect(link).toHaveAttribute('href', '/community');
    });

    it('renders My Collection link with href /my-collection', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /my collection/i });
      expect(link).toHaveAttribute('href', '/my-collection');
    });

    it('renders Shopping Lists link with href /shopping-lists', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /shopping lists/i });
      expect(link).toHaveAttribute('href', '/shopping-lists');
    });

    it('renders Add Recipe link with href /recipes/new', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /add recipe/i });
      expect(link).toHaveAttribute('href', '/recipes/new');
    });

    it('renders Settings link with href /settings', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /settings/i });
      expect(link).toHaveAttribute('href', '/settings');
    });

    it('renders user name', () => {
      render(<MobileNav {...defaultProps} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('renders username with @ prefix', () => {
      render(<MobileNav {...defaultProps} />);
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });

    it('renders RecipeApp logo as link to /dashboard', () => {
      render(<MobileNav {...defaultProps} />);
      const logoLink = screen.getByRole('link', { name: /recipeapp/i });
      expect(logoLink).toHaveAttribute('href', '/dashboard');
    });

    it('renders Sign Out button', () => {
      render(<MobileNav {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: /sign out/i })
      ).toBeInTheDocument();
    });

    it('calls signOut when Sign Out is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileNav {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /sign out/i }));
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('calls onOpenChange(false) when a nav link is clicked', async () => {
      const mockOnOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<MobileNav {...defaultProps} onOpenChange={mockOnOpenChange} />);

      await user.click(screen.getByRole('link', { name: /dashboard/i }));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('renders ThemeToggleMenuItem', () => {
      render(<MobileNav {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: 'Toggle theme' })
      ).toBeInTheDocument();
    });
  });

  describe('when unauthenticated', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      user: null,
      isAuthenticated: false,
    };

    it('does not render user info section', () => {
      render(<MobileNav {...defaultProps} />);
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      expect(screen.queryByText('@testuser')).not.toBeInTheDocument();
    });

    it('renders Sign In link with href /login', () => {
      render(<MobileNav {...defaultProps} />);
      const link = screen.getByRole('link', { name: /sign in/i });
      expect(link).toHaveAttribute('href', '/login');
    });

    it('does not render Sign Out button', () => {
      render(<MobileNav {...defaultProps} />);
      expect(
        screen.queryByRole('button', { name: /sign out/i })
      ).not.toBeInTheDocument();
    });

    it('renders RecipeApp logo as link to /', () => {
      render(<MobileNav {...defaultProps} />);
      const logoLink = screen.getByRole('link', { name: /recipeapp/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });
});
