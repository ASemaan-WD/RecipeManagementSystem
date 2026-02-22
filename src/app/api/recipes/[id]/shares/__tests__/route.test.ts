import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/recipes/[id]/shares/route';
import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import {
  createMockSession,
  createMockRecipe,
  createMockUser,
} from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipeShare: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    shareLink: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    recipe: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireRecipeOwner: vi.fn(),
}));

const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockShareFindMany = vi.mocked(prisma.recipeShare.findMany);
const mockShareFindUnique = vi.mocked(prisma.recipeShare.findUnique);
const mockShareLinkFindMany = vi.mocked(prisma.shareLink.findMany);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockTransaction = vi.mocked(prisma.$transaction);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/[id]/shares', () => {
  it('returns shared users and share links', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    mockShareFindMany.mockResolvedValueOnce([
      {
        id: 'share-1',
        sharedAt: new Date('2025-01-15'),
        user: { id: 'user-2', name: 'Other', username: 'other', image: null },
      },
    ] as never);
    mockShareLinkFindMany.mockResolvedValueOnce([
      { id: 'link-1', token: 'abc123', createdAt: new Date('2025-01-15') },
    ] as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/shares');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.shares).toHaveLength(1);
    expect(body.shares[0].user.username).toBe('other');
    // Verify no email in response
    expect(body.shares[0].user.email).toBeUndefined();
    expect(body.shareLinks).toHaveLength(1);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1/shares');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/recipes/[id]/shares', () => {
  it('shares recipe with a valid username and returns 201', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const targetUser = createMockUser({ id: 'user-2', username: 'other' });
    mockUserFindUnique.mockResolvedValueOnce(targetUser as never);
    mockShareFindUnique.mockResolvedValueOnce(null);

    const shareResult = {
      id: 'share-1',
      sharedAt: new Date(),
      user: { id: 'user-2', name: 'Other', username: 'other', image: null },
    };
    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') {
        return fn({
          recipe: {
            findUnique: vi.fn().mockResolvedValue(recipe),
            update: vi.fn().mockResolvedValue(recipe),
          },
          recipeShare: { create: vi.fn().mockResolvedValue(shareResult) },
        } as never);
      }
      return shareResult;
    });

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'other' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(201);
  });

  it('returns 400 when trying to share with self', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const selfUser = createMockUser({ id: 'user-1', username: 'testuser' });
    mockUserFindUnique.mockResolvedValueOnce(selfUser as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('yourself');
  });

  it('returns 404 when user not found', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 409 when already shared', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const targetUser = createMockUser({ id: 'user-2', username: 'other' });
    mockUserFindUnique.mockResolvedValueOnce(targetUser as never);
    mockShareFindUnique.mockResolvedValueOnce({
      id: 'existing',
      recipeId: 'recipe-1',
      userId: 'user-2',
    } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'other' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid body', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ab' }), // too short
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/recipes/[id]/shares', () => {
  it('revokes a share and returns success', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    vi.mocked(prisma.recipeShare.findUnique).mockResolvedValueOnce({
      id: 'share-1',
      recipeId: 'recipe-1',
      userId: 'user-2',
    } as never);
    vi.mocked(prisma.recipeShare.delete).mockResolvedValueOnce({} as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user-2' }),
      }
    );

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 when share not found', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    vi.mocked(prisma.recipeShare.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/shares',
      {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user-99' }),
      }
    );

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(404);
  });
});
