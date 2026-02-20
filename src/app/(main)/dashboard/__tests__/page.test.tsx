import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DashboardPage from '@/app/(main)/dashboard/page';

const mockRedirect = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { count: vi.fn() },
    userRecipeTag: { count: vi.fn() },
  },
}));

vi.mock('@/generated/prisma/client', () => ({
  TagStatus: {
    FAVORITE: 'FAVORITE',
    TO_TRY: 'TO_TRY',
    MADE_BEFORE: 'MADE_BEFORE',
  },
}));

const mockAuth = vi.mocked(auth);
const mockRecipeCount = vi.mocked(prisma.recipe.count);
const mockUserRecipeTagCount = vi.mocked(prisma.userRecipeTag.count);

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderDashboard() {
  const page = await DashboardPage();
  return render(page);
}

describe('DashboardPage', () => {
  describe('when not authenticated', () => {
    it('redirects to /login', async () => {
      mockAuth.mockResolvedValueOnce(null);

      await expect(DashboardPage()).rejects.toThrow('NEXT_REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
          username: 'testuser',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      mockRecipeCount.mockResolvedValue(5);
      mockUserRecipeTagCount.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    });

    it('renders welcome message with user name', async () => {
      await renderDashboard();
      expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument();
    });

    it('renders "Welcome back, Chef" when user has no name', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          name: null,
          email: 'test@example.com',
          image: null,
          username: 'testuser',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      mockRecipeCount.mockResolvedValue(0);
      mockUserRecipeTagCount
        .mockReset()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await renderDashboard();
      expect(screen.getByText(/Welcome back, Chef/)).toBeInTheDocument();
    });

    it('renders subtitle text', async () => {
      await renderDashboard();
      expect(
        screen.getByText(/here's what's happening with your recipes/i)
      ).toBeInTheDocument();
    });

    it('renders Total Recipes stat card with count', async () => {
      await renderDashboard();
      expect(screen.getByText('Total Recipes')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders Favorites stat card with count', async () => {
      await renderDashboard();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders To Try stat card with count', async () => {
      await renderDashboard();
      expect(screen.getByText('To Try')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders "Add Recipe" quick action link with href /recipes/new', async () => {
      await renderDashboard();
      const links = screen.getAllByRole('link', { name: /add recipe/i });
      const quickActionLink = links.find(
        (link) => link.getAttribute('href') === '/recipes/new'
      );
      expect(quickActionLink).toBeDefined();
    });

    it('renders "Browse Community" quick action link with href /community', async () => {
      await renderDashboard();
      const link = screen.getByRole('link', { name: /browse community/i });
      expect(link).toHaveAttribute('href', '/community');
    });

    it('renders "View Collection" quick action link with href /my-collection', async () => {
      await renderDashboard();
      const link = screen.getByRole('link', { name: /view collection/i });
      expect(link).toHaveAttribute('href', '/my-collection');
    });

    it('renders empty state for recent recipes section', async () => {
      await renderDashboard();
      expect(screen.getByText('No recipes yet')).toBeInTheDocument();
    });

    it('renders "Create Your First Recipe" link with href /recipes/new', async () => {
      await renderDashboard();
      const link = screen.getByRole('link', {
        name: /create your first recipe/i,
      });
      expect(link).toHaveAttribute('href', '/recipes/new');
    });

    it('calls prisma.recipe.count with correct authorId', async () => {
      await renderDashboard();
      expect(mockRecipeCount).toHaveBeenCalledWith({
        where: { authorId: 'user-1' },
      });
    });

    it('calls prisma.userRecipeTag.count for FAVORITE and TO_TRY', async () => {
      await renderDashboard();
      expect(mockUserRecipeTagCount).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'FAVORITE' },
      });
      expect(mockUserRecipeTagCount).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'TO_TRY' },
      });
    });
  });
});
