import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    shareLink: { findUnique: vi.fn() },
    recipeShare: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
  requireRecipeOwner: vi.fn(),
  canViewRecipe: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiWriteLimiter: { check: vi.fn() },
  apiReadLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/generated/prisma/client', () => ({
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
}));

import { requireRecipeOwner, canViewRecipe } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockCanViewRecipe = vi.mocked(canViewRecipe);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Authorization', () => {
  it('returns 403 when non-owner tries to delete a recipe', async () => {
    const { DELETE } = await import('@/app/api/recipes/[id]/route');

    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'recipe-1' }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-owner tries to update a recipe', async () => {
    const { PUT } = await import('@/app/api/recipes/[id]/route');

    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'recipe-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 when accessing private recipe without permission', async () => {
    const { GET } = await import('@/app/api/recipes/[id]/route');

    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest('http://localhost/api/recipes/private-recipe');

    const res = await GET(req, {
      params: Promise.resolve({ id: 'private-recipe' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for invalid share token', async () => {
    const { GET } = await import('@/app/api/share/[token]/route');

    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/share/random-invalid-token'
    );

    const res = await GET(req, {
      params: Promise.resolve({ token: 'random-invalid-token' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 for revoked share link', async () => {
    const { GET } = await import('@/app/api/share/[token]/route');

    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.shareLink.findUnique).mockResolvedValueOnce({
      id: 'link-1',
      token: 'revoked-token',
      recipeId: 'recipe-1',
      isActive: false,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: null,
    } as never);

    const req = new NextRequest('http://localhost/api/share/revoked-token');

    const res = await GET(req, {
      params: Promise.resolve({ token: 'revoked-token' }),
    });
    expect(res.status).toBe(404);
  });
});
