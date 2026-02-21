import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from '@/app/api/recipes/[id]/share-link/route';
import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    shareLink: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireRecipeOwner: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-token-21chars'),
}));

const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockShareLinkFindFirst = vi.mocked(prisma.shareLink.findFirst);
const mockShareLinkUpdate = vi.mocked(prisma.shareLink.update);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/recipes/[id]/share-link', () => {
  it('generates a share link and returns 201', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const linkResult = {
      id: 'link-1',
      token: 'mock-nanoid-token-21chars',
      createdAt: new Date(),
    };
    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') {
        return fn({
          recipe: {
            findUnique: vi.fn().mockResolvedValue(recipe),
            update: vi.fn().mockResolvedValue(recipe),
          },
          shareLink: { create: vi.fn().mockResolvedValue(linkResult) },
        } as never);
      }
      return linkResult;
    });

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      { method: 'POST' }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.id).toBeDefined();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      { method: 'POST' }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-owner', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      { method: 'POST' }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/recipes/[id]/share-link', () => {
  it('revokes a share link and returns success', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    mockShareLinkFindFirst.mockResolvedValueOnce({
      id: 'link-1',
      isActive: true,
    } as never);
    mockShareLinkUpdate.mockResolvedValueOnce({} as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      {
        method: 'DELETE',
        body: JSON.stringify({ linkId: 'link-1' }),
      }
    );

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 when link not found', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);
    mockShareLinkFindFirst.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      {
        method: 'DELETE',
        body: JSON.stringify({ linkId: 'nonexistent' }),
      }
    );

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid body', async () => {
    const session = createMockSession();
    const recipe = createMockRecipe();
    mockRequireRecipeOwner.mockResolvedValueOnce({ session, recipe } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/share-link',
      {
        method: 'DELETE',
        body: 'not json',
      }
    );

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(400);
  });
});
