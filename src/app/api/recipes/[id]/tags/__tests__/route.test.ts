import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '@/app/api/recipes/[id]/tags/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn() },
    userRecipeTag: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockTagUpsert = vi.mocked(prisma.userRecipeTag.upsert);
const mockTagDeleteMany = vi.mocked(prisma.userRecipeTag.deleteMany);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/recipes/[id]/tags', () => {
  it('adds a tag and returns 200', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);
    const mockTag = {
      id: 'tag-1',
      userId: 'user-1',
      recipeId: 'recipe-1',
      status: 'FAVORITE',
    };
    mockTagUpsert.mockResolvedValueOnce(mockTag as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('FAVORITE');
    expect(mockTagUpsert).toHaveBeenCalledWith({
      where: {
        userId_recipeId_status: {
          userId: 'user-1',
          recipeId: 'recipe-1',
          status: 'FAVORITE',
        },
      },
      create: { userId: 'user-1', recipeId: 'recipe-1', status: 'FAVORITE' },
      update: {},
    });
  });

  it('returns 401 for unauthenticated users', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid status', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALID' }),
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 404 when recipe does not exist', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('handles all valid tag statuses', async () => {
    for (const status of ['FAVORITE', 'TO_TRY', 'MADE_BEFORE']) {
      vi.clearAllMocks();
      const session = createMockSession();
      mockRequireAuth.mockResolvedValueOnce(session);
      mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);
      mockTagUpsert.mockResolvedValueOnce({
        id: 'tag-1',
        userId: 'user-1',
        recipeId: 'recipe-1',
        status,
      } as never);

      const req = new NextRequest(
        'http://localhost/api/recipes/recipe-1/tags',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      const res = await POST(req, routeParams);
      expect(res.status).toBe(200);
    }
  });
});

describe('DELETE /api/recipes/[id]/tags', () => {
  it('removes a tag and returns 200', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockTagDeleteMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'DELETE',
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockTagDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', recipeId: 'recipe-1', status: 'FAVORITE' },
    });
  });

  it('returns 200 for idempotent delete (tag does not exist)', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockTagDeleteMany.mockResolvedValueOnce({ count: 0 } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'DELETE',
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 401 for unauthenticated users', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'DELETE',
      body: JSON.stringify({ status: 'FAVORITE' }),
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid status', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/tags', {
      method: 'DELETE',
      body: JSON.stringify({ status: 'INVALID' }),
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(400);
  });
});
