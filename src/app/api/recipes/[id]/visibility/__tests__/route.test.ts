import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PUT } from '@/app/api/recipes/[id]/visibility/route';
import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { update: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireRecipeOwner: vi.fn(),
}));

const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockRecipeUpdate = vi.mocked(prisma.recipe.update);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/recipes/[id]/visibility', () => {
  it('updates visibility and returns 200', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    mockRecipeUpdate.mockResolvedValueOnce({
      id: 'recipe-1',
      visibility: 'PUBLIC',
    } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/visibility',
      {
        method: 'PUT',
        body: JSON.stringify({ visibility: 'PUBLIC' }),
      }
    );

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.visibility).toBe('PUBLIC');
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/visibility',
      {
        method: 'PUT',
        body: JSON.stringify({ visibility: 'PUBLIC' }),
      }
    );

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-owner', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/visibility',
      {
        method: 'PUT',
        body: JSON.stringify({ visibility: 'PUBLIC' }),
      }
    );

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid visibility value', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/visibility',
      {
        method: 'PUT',
        body: JSON.stringify({ visibility: 'INVALID' }),
      }
    );

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/visibility',
      {
        method: 'PUT',
        body: 'not json',
      }
    );

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('handles all valid visibility values', async () => {
    for (const visibility of ['PRIVATE', 'SHARED', 'PUBLIC']) {
      vi.clearAllMocks();
      const session = createMockSession();
      const recipe = createMockRecipe();
      mockRequireRecipeOwner.mockResolvedValueOnce({
        session,
        recipe,
      } as never);
      mockRecipeUpdate.mockResolvedValueOnce({
        id: 'recipe-1',
        visibility,
      } as never);

      const req = new NextRequest(
        'http://localhost/api/recipes/recipe-1/visibility',
        {
          method: 'PUT',
          body: JSON.stringify({ visibility }),
        }
      );

      const res = await PUT(req, routeParams);
      expect(res.status).toBe(200);
    }
  });
});
