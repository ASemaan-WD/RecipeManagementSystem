import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findMany: vi.fn(), count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockFindMany = vi.mocked(prisma.recipe.findMany);
const mockCount = vi.mocked(prisma.recipe.count);
const mockQueryRaw = vi.mocked(prisma.$queryRaw);

function createMockDbRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipe-1',
    name: 'Chicken Pasta',
    description: 'Delicious pasta',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'EASY',
    cuisineType: 'Italian',
    visibility: 'PUBLIC',
    avgRating: 4.5,
    ratingCount: 10,
    createdAt: new Date('2025-01-01'),
    author: {
      id: 'author-1',
      name: 'Chef',
      username: 'chef',
      image: null,
    },
    images: [{ url: 'https://example.com/img.jpg' }],
    dietaryTags: [{ dietaryTag: { id: 'dt-1', name: 'Gluten-Free' } }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue(null);
});

describe('GET /api/search', () => {
  describe('with text query (FTS)', () => {
    it('returns FTS-ranked results for q=chicken', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null);
      mockQueryRaw.mockResolvedValueOnce([
        { id: 'recipe-1', rank: 0.8 },
        { id: 'recipe-2', rank: 0.5 },
      ] as never);

      const recipe1 = createMockDbRecipe({ id: 'recipe-1' });
      const recipe2 = createMockDbRecipe({
        id: 'recipe-2',
        name: 'Chicken Soup',
      });
      mockFindMany.mockResolvedValueOnce([recipe2, recipe1] as never);

      const req = new NextRequest('http://localhost/api/search?q=chicken');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(2);
      // Should be sorted by rank: recipe-1 (0.8) before recipe-2 (0.5)
      expect(body.data[0].id).toBe('recipe-1');
      expect(body.data[1].id).toBe('recipe-2');
      expect(body.pagination.total).toBe(2);
    });

    it('returns empty results when FTS finds no matches', async () => {
      mockQueryRaw.mockResolvedValueOnce([] as never);

      const req = new NextRequest('http://localhost/api/search?q=nonexistent');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });

    it('handles special characters in q gracefully', async () => {
      mockQueryRaw.mockResolvedValueOnce([] as never);

      const req = new NextRequest(
        "http://localhost/api/search?q=chicken's%20%26%20pasta"
      );
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
    });

    it('handles tsquery parse errors by returning empty results', async () => {
      mockQueryRaw.mockRejectedValueOnce(new Error('tsquery error'));

      const req = new NextRequest('http://localhost/api/search?q=test');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });
  });

  describe('without text query (filter-only)', () => {
    it('returns filter-only results when no q', async () => {
      const recipe = createMockDbRecipe();
      mockFindMany.mockResolvedValueOnce([recipe] as never);
      mockCount.mockResolvedValueOnce(1);

      const req = new NextRequest(
        'http://localhost/api/search?cuisine=Italian'
      );
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].cuisineType).toBe('Italian');
    });

    it('applies pagination correctly', async () => {
      mockFindMany.mockResolvedValueOnce([] as never);
      mockCount.mockResolvedValueOnce(25);

      const req = new NextRequest(
        'http://localhost/api/search?page=3&limit=10'
      );
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.pagination).toEqual({
        total: 25,
        page: 3,
        pageSize: 10,
        totalPages: 3,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('applies sort=rating ordering', async () => {
      mockFindMany.mockResolvedValueOnce([] as never);
      mockCount.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost/api/search?sort=rating');
      const res = await GET(req);
      expect(res.status).toBe(200);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { avgRating: { sort: 'desc', nulls: 'last' } },
        })
      );
    });
  });

  describe('visibility rules', () => {
    it('returns only public recipes for unauthenticated users', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null);
      mockFindMany.mockResolvedValueOnce([] as never);
      mockCount.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost/api/search');
      await GET(req);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: 'PUBLIC',
          }),
        })
      );
    });

    it('returns own + public for authenticated users', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        image: null,
        username: 'testuser',
      });
      mockFindMany.mockResolvedValueOnce([] as never);
      mockCount.mockResolvedValueOnce(0);

      const req = new NextRequest('http://localhost/api/search');
      await GET(req);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ authorId: 'user-1' }, { visibility: 'PUBLIC' }],
          }),
        })
      );
    });
  });

  describe('validation', () => {
    it('returns 400 for invalid sort value', async () => {
      const req = new NextRequest('http://localhost/api/search?sort=invalid');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });
  });

  describe('response transformation', () => {
    it('transforms response with primaryImage and dietaryTags', async () => {
      const recipe = createMockDbRecipe();
      mockFindMany.mockResolvedValueOnce([recipe] as never);
      mockCount.mockResolvedValueOnce(1);

      const req = new NextRequest('http://localhost/api/search');
      const res = await GET(req);
      const body = await res.json();

      expect(body.data[0].primaryImage).toEqual({
        url: 'https://example.com/img.jpg',
      });
      expect(body.data[0].dietaryTags).toEqual([
        { id: 'dt-1', name: 'Gluten-Free' },
      ]);
      expect(body.data[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });
});
