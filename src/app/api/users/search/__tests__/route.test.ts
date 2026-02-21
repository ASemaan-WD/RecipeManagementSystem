import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/users/search/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockUserFindMany = vi.mocked(prisma.user.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/users/search', () => {
  it('returns matching users by username prefix', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockUserFindMany.mockResolvedValueOnce([
      { id: 'user-2', name: 'Other', username: 'other', image: null },
    ] as never);

    const req = new NextRequest('http://localhost/api/users/search?q=oth');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].username).toBe('other');
    // Verify no email leakage
    expect(body.data[0].email).toBeUndefined();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/users/search?q=test');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when q is missing', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest('http://localhost/api/users/search');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('excludes the current user from results', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockUserFindMany.mockResolvedValueOnce([] as never);

    const req = new NextRequest('http://localhost/api/users/search?q=test');
    await GET(req);

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'user-1' },
        }),
      })
    );
  });

  it('limits results to 10', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockUserFindMany.mockResolvedValueOnce([] as never);

    const req = new NextRequest('http://localhost/api/users/search?q=a');
    await GET(req);

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });
});
