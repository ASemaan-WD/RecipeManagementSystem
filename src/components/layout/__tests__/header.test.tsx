import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signOut } from 'next-auth/react';
import { createMockSession } from '@/test/factories';
import { Header } from '@/components/layout/header';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/components/layout/mobile-nav', () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

vi.mock('@/components/search/search-bar', () => ({
  SearchBar: () => <div data-testid="search-bar" />,
}));

vi.mock('@/components/layout/theme-toggle', () => ({
  ThemeToggleMenuItem: () => <div data-testid="theme-toggle-menu-item" />,
}));

const mockUseSession = vi.mocked(useSession);

function mockAuthenticated() {
  mockUseSession.mockReturnValue({
    data: createMockSession(),
    status: 'authenticated',
    update: vi.fn(),
  } as ReturnType<typeof useSession>);
}

function mockUnauthenticated() {
  mockUseSession.mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  } as ReturnType<typeof useSession>);
}

function mockLoading() {
  mockUseSession.mockReturnValue({
    data: null,
    status: 'loading',
    update: vi.fn(),
  } as ReturnType<typeof useSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header', () => {
  describe('common elements', () => {
    beforeEach(() => {
      mockUnauthenticated();
    });

    it('renders the RecipeApp logo text', () => {
      render(<Header />);
      expect(screen.getByText('RecipeApp')).toBeInTheDocument();
    });

    it('renders the search bar component', () => {
      render(<Header />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('renders the hamburger menu button for mobile', () => {
      render(<Header />);
      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
    });

    it('renders the MobileNav component', () => {
      render(<Header />);
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });
  });

  describe('navigation links', () => {
    beforeEach(() => {
      mockUnauthenticated();
    });

    it('renders My Recipes link with href /my-recipes', () => {
      render(<Header />);
      const link = screen.getByRole('link', { name: /my recipes/i });
      expect(link).toHaveAttribute('href', '/my-recipes');
    });

    it('renders Community link with href /community', () => {
      render(<Header />);
      const link = screen.getByRole('link', { name: /community/i });
      expect(link).toHaveAttribute('href', '/community');
    });

    it('renders Shopping Lists link with href /shopping-lists', () => {
      render(<Header />);
      const link = screen.getByRole('link', { name: /shopping lists/i });
      expect(link).toHaveAttribute('href', '/shopping-lists');
    });

    it('renders main navigation with correct aria-label', () => {
      render(<Header />);
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' })
      ).toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      mockAuthenticated();
    });

    it('renders user avatar button', () => {
      render(<Header />);
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('renders "Add Recipe" link with href /recipes/new', () => {
      render(<Header />);
      const link = screen.getByRole('link', { name: /add recipe/i });
      expect(link).toHaveAttribute('href', '/recipes/new');
    });

    it('does not render "Sign In" button', () => {
      render(<Header />);
      expect(
        screen.queryByRole('link', { name: /sign in/i })
      ).not.toBeInTheDocument();
    });

    it('renders logo link to /dashboard', () => {
      render(<Header />);
      const logoLink = screen.getByRole('link', { name: /recipeapp/i });
      expect(logoLink).toHaveAttribute('href', '/dashboard');
    });

    it('opens dropdown with user info when avatar is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const avatarButton = screen.getByText('TU').closest('button')!;
      await user.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });
    });

    it('renders "My Collection" link in desktop navigation', () => {
      render(<Header />);

      const link = screen.getByRole('link', { name: /my collection/i });
      expect(link).toHaveAttribute('href', '/my-collection');
    });

    it('renders "Settings" link in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const avatarButton = screen.getByText('TU').closest('button')!;
      await user.click(avatarButton);

      await waitFor(() => {
        const link = screen.getByRole('menuitem', { name: /settings/i });
        expect(link).toHaveAttribute('href', '/settings');
      });
    });

    it('renders "Sign Out" in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const avatarButton = screen.getByText('TU').closest('button')!;
      await user.click(avatarButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /sign out/i })
        ).toBeInTheDocument();
      });
    });

    it('calls signOut with callbackUrl when Sign Out is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const avatarButton = screen.getByText('TU').closest('button')!;
      await user.click(avatarButton);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /sign out/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /sign out/i }));
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('renders ThemeToggleMenuItem in dropdown', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const avatarButton = screen.getByText('TU').closest('button')!;
      await user.click(avatarButton);

      await waitFor(() => {
        expect(
          screen.getByTestId('theme-toggle-menu-item')
        ).toBeInTheDocument();
      });
    });
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      mockUnauthenticated();
    });

    it('renders "Sign In" link with href /login', () => {
      render(<Header />);
      const link = screen.getByRole('link', { name: /sign in/i });
      expect(link).toHaveAttribute('href', '/login');
    });

    it('does not render "Add Recipe" button', () => {
      render(<Header />);
      expect(
        screen.queryByRole('link', { name: /add recipe/i })
      ).not.toBeInTheDocument();
    });

    it('does not render user avatar', () => {
      render(<Header />);
      expect(screen.queryByText('TU')).not.toBeInTheDocument();
    });

    it('renders logo link to /', () => {
      render(<Header />);
      const logoLink = screen.getByRole('link', { name: /recipeapp/i });
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      mockLoading();
    });

    it('renders a loading skeleton', () => {
      const { container } = render(<Header />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('does not render "Sign In" button', () => {
      render(<Header />);
      expect(
        screen.queryByRole('link', { name: /sign in/i })
      ).not.toBeInTheDocument();
    });

    it('does not render user avatar', () => {
      render(<Header />);
      expect(screen.queryByText('TU')).not.toBeInTheDocument();
    });
  });
});
