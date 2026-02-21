import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/collections/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockFindMany = vi.mocked(prisma.recipe.findMany);
const mockCount = vi.mocked(prisma.recipe.count);

function createMockDbRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'EASY',
    cuisineType: 'Italian',
    visibility: 'PUBLIC',
    avgRating: 4.5,
    ratingCount: 12,
    createdAt: new Date('2025-01-01'),
    author: {
      id: 'author-1',
      name: 'Author',
      username: 'author',
      image: null,
    },
    images: [{ url: 'https://example.com/img.jpg' }],
    dietaryTags: [{ dietaryTag: { id: 'dt-1', name: 'Vegetarian' } }],
    userTags: [{ status: 'FAVORITE' }],
    savedBy: [{ id: 'saved-1' }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/collections', () => {
  it('returns 401 for unauthenticated users', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/collections');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns collection with tab=all (default)', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const recipe = createMockDbRecipe();
    mockFindMany.mockResolvedValueOnce([recipe] as never);
    // total, allCount, favoritesCount, toTryCount, madeBeforeCount, savedCount
    mockCount
      .mockResolvedValueOnce(1) // total
      .mockResolvedValueOnce(3) // all
      .mockResolvedValueOnce(2) // favorites
      .mockResolvedValueOnce(1) // toTry
      .mockResolvedValueOnce(0) // madeBefore
      .mockResolvedValueOnce(1); // saved

    const req = new NextRequest('http://localhost/api/collections');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('recipe-1');
    expect(body.data[0].primaryImage).toEqual({
      url: 'https://example.com/img.jpg',
    });
    expect(body.data[0].isSaved).toBe(true);
    expect(body.data[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(body.pagination).toEqual({
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });
    expect(body.counts).toEqual({
      all: 3,
      favorites: 2,
      toTry: 1,
      madeBefore: 0,
      saved: 1,
    });
  });

  it('filters by tab=favorites', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest(
      'http://localhost/api/collections?tab=favorites'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    // Verify the where clause for favorites
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userTags: { some: { userId: 'user-1', status: 'FAVORITE' } },
        },
      })
    );
  });

  it('filters by tab=to-try', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost/api/collections?tab=to-try');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userTags: { some: { userId: 'user-1', status: 'TO_TRY' } },
        },
      })
    );
  });

  it('filters by tab=made-before', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest(
      'http://localhost/api/collections?tab=made-before'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userTags: { some: { userId: 'user-1', status: 'MADE_BEFORE' } },
        },
      })
    );
  });

  it('filters by tab=saved', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost/api/collections?tab=saved');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          savedBy: { some: { userId: 'user-1' } },
        },
      })
    );
  });

  it('handles pagination correctly', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(25) // total
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7);

    const req = new NextRequest(
      'http://localhost/api/collections?page=2&limit=10'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pagination).toEqual({
      total: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });

    // Verify skip/take
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it('applies sort=rating ordering', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost/api/collections?sort=rating');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { avgRating: { sort: 'desc', nulls: 'last' } },
      })
    );
  });

  it('returns empty data with zero counts when no tags or saves exist', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockFindMany.mockResolvedValueOnce([] as never);
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost/api/collections');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.counts).toEqual({
      all: 0,
      favorites: 0,
      toTry: 0,
      madeBefore: 0,
      saved: 0,
    });
  });

  it('returns 400 for invalid tab value', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest('http://localhost/api/collections?tab=invalid');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
