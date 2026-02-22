import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/recipes/[id]/ratings/route';
import { prisma } from '@/lib/db';
import { canViewRecipe, getCurrentUser, requireAuth } from '@/lib/auth-utils';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn(), update: vi.fn() },
    rating: { findUnique: vi.fn(), upsert: vi.fn(), aggregate: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  canViewRecipe: vi.fn(),
  getCurrentUser: vi.fn(),
  requireAuth: vi.fn(),
}));

const mockCanViewRecipe = vi.mocked(canViewRecipe);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockRequireAuth = vi.mocked(requireAuth);
const mockRatingFindUnique = vi.mocked(prisma.rating.findUnique);
const mockRatingUpsert = vi.mocked(prisma.rating.upsert);
const mockRatingAggregate = vi.mocked(prisma.rating.aggregate);
const mockRecipeUpdate = vi.mocked(prisma.recipe.update);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/[id]/ratings', () => {
  it('returns rating data without auth', async () => {
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: { avgRating: 4.2, ratingCount: 10 },
      user: null,
    } as never);
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.avgRating).toBe(4.2);
    expect(body.ratingCount).toBe(10);
    expect(body.userRating).toBeNull();
  });

  it('returns user rating when authenticated', async () => {
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: { avgRating: 4.2, ratingCount: 10 },
      user: {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        image: null,
      },
    } as never);
    mockGetCurrentUser.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      image: null,
    });
    mockRatingFindUnique.mockResolvedValueOnce({ value: 5 } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.userRating).toBe(5);
  });

  it('returns 404 when recipe not found', async () => {
    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipes/[id]/ratings', () => {
  it('creates a rating and returns updated stats', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const recipe = createMockRecipe({ authorId: 'other-user' });
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe,
      user: { id: 'user-1' },
    } as never);
    mockRatingUpsert.mockResolvedValueOnce({} as never);
    mockRatingAggregate.mockResolvedValueOnce({
      _avg: { value: 4.5 },
      _count: 2,
    } as never);
    mockRecipeUpdate.mockResolvedValueOnce({} as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 5 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.avgRating).toBe(4.5);
    expect(body.ratingCount).toBe(2);
    expect(body.userRating).toBe(5);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 5 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 403 when rating own recipe', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const recipe = createMockRecipe({ authorId: 'user-1' });
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe,
      user: { id: 'user-1' },
    } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 5 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('own recipe');
  });

  it('returns 404 when recipe not found', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 5 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid rating value', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 6 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer rating', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/ratings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 3.5 }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });
});
