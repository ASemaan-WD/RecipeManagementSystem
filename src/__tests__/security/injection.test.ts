import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findMany: vi.fn(), count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  searchLimiter: { check: vi.fn() },
  apiReadLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/generated/prisma/client', () => ({
  Prisma: { sql: vi.fn(), join: vi.fn() },
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
}));

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';

const mockGetCurrentUser = vi.mocked(getCurrentUser);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SQL Injection Prevention', () => {
  it('search handles SQL injection attempt in query', async () => {
    const { GET } = await import('@/app/api/search/route');

    mockGetCurrentUser.mockResolvedValueOnce(null);
    vi.mocked(prisma.recipe.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.recipe.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest(
      "http://localhost/api/search?q='; DROP TABLE Recipe; --"
    );

    const res = await GET(req);
    // Should not crash -- Prisma parameterizes queries
    expect(res.status).toBe(200);
  });

  it('search handles boolean injection attempt', async () => {
    const { GET } = await import('@/app/api/search/route');

    mockGetCurrentUser.mockResolvedValueOnce(null);
    vi.mocked(prisma.recipe.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.recipe.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost/api/search?q=' OR '1'='1");

    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('recipe list handles SQL injection in filter params', async () => {
    const { GET } = await import('@/app/api/recipes/route');

    mockGetCurrentUser.mockResolvedValueOnce(null);
    vi.mocked(prisma.recipe.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.recipe.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest(
      "http://localhost/api/recipes?search='; DROP TABLE--&cuisine='; DELETE FROM--"
    );

    const res = await GET(req);
    // Should return results normally (Prisma parameterization protects against injection)
    expect(res.status).toBe(200);
  });
});
