import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '@/app/api/recipes/[id]/save/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn() },
    savedRecipe: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockSaveUpsert = vi.mocked(prisma.savedRecipe.upsert);
const mockSaveDeleteMany = vi.mocked(prisma.savedRecipe.deleteMany);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/recipes/[id]/save', () => {
  it('saves a recipe and returns 200', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);
    const mockSaved = {
      id: 'saved-1',
      userId: 'user-1',
      recipeId: 'recipe-1',
      savedAt: new Date(),
    };
    mockSaveUpsert.mockResolvedValueOnce(mockSaved as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'POST',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.recipeId).toBe('recipe-1');
    expect(mockSaveUpsert).toHaveBeenCalledWith({
      where: {
        userId_recipeId: { userId: 'user-1', recipeId: 'recipe-1' },
      },
      create: { userId: 'user-1', recipeId: 'recipe-1' },
      update: {},
    });
  });

  it('returns 401 for unauthenticated users', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'POST',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when recipe does not exist', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'POST',
    });

    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/recipes/[id]/save', () => {
  it('unsaves a recipe and returns 200', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockSaveDeleteMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSaveDeleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', recipeId: 'recipe-1' },
    });
  });

  it('returns 200 for idempotent delete (not saved)', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockSaveDeleteMany.mockResolvedValueOnce({ count: 0 } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'DELETE',
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

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/save', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(401);
  });
});
