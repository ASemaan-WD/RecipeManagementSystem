import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/recipes/shared-with-me/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipeShare: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockShareFindMany = vi.mocked(prisma.recipeShare.findMany);
const mockShareCount = vi.mocked(prisma.recipeShare.count);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/shared-with-me', () => {
  it('returns shared recipes for authenticated user', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockShareFindMany.mockResolvedValueOnce([
      {
        sharedAt: new Date('2025-01-15'),
        recipe: {
          id: 'recipe-2',
          name: 'Shared Recipe',
          description: 'A shared recipe',
          prepTime: 15,
          cookTime: 30,
          servings: 4,
          difficulty: 'MEDIUM',
          cuisineType: 'Mexican',
          visibility: 'SHARED',
          avgRating: 4.0,
          ratingCount: 5,
          createdAt: new Date('2025-01-10'),
          author: {
            id: 'user-2',
            name: 'Other User',
            username: 'other',
            image: null,
          },
          images: [],
          dietaryTags: [],
        },
      },
    ] as never);
    mockShareCount.mockResolvedValueOnce(1);

    const req = new NextRequest(
      'http://localhost/api/recipes/shared-with-me?page=1&limit=12'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Shared Recipe');
    expect(body.data[0].sharedAt).toBeDefined();
    expect(body.pagination.total).toBe(1);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes/shared-with-me');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns empty list when no shares exist', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockShareFindMany.mockResolvedValueOnce([]);
    mockShareCount.mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost/api/recipes/shared-with-me');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('does not include user email in response', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    mockShareFindMany.mockResolvedValueOnce([
      {
        sharedAt: new Date('2025-01-15'),
        recipe: {
          id: 'recipe-2',
          name: 'Recipe',
          description: null,
          prepTime: 10,
          cookTime: 20,
          servings: 2,
          difficulty: 'EASY',
          cuisineType: null,
          visibility: 'SHARED',
          avgRating: null,
          ratingCount: 0,
          createdAt: new Date(),
          author: {
            id: 'user-2',
            name: 'Other',
            username: 'other',
            image: null,
          },
          images: [],
          dietaryTags: [],
        },
      },
    ] as never);
    mockShareCount.mockResolvedValueOnce(1);

    const req = new NextRequest('http://localhost/api/recipes/shared-with-me');
    const res = await GET(req);
    const body = await res.json();
    expect(body.data[0].author.email).toBeUndefined();
  });
});
