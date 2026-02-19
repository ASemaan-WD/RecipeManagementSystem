import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/auth/username/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

const { MockPrismaClientKnownRequestError } = vi.hoisted(() => {
  class MockPrismaClientKnownRequestError extends Error {
    code: string;
    constructor(
      message: string,
      meta: { code: string; clientVersion?: string }
    ) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = meta.code;
    }
  }
  return { MockPrismaClientKnownRequestError };
});

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/generated/prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
  },
}));

const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockRequireAuth = vi.mocked(requireAuth);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/auth/username', () => {
  it('returns 400 when username param is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/username');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Username query parameter is required');
  });

  it('returns 400 when username is too short', async () => {
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=ab'
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('at least 3 characters');
  });

  it('returns 400 for invalid characters', async () => {
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=user%40name'
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns { available: true } when username is not taken', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=newuser'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it('returns { available: false } when username is taken', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 'existing-user' } as never);
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=takenuser'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it('calls prisma with the validated username', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost/api/auth/username?username=validuser'
    );
    await GET(req);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { username: 'validuser' },
      select: { id: true },
    });
  });
});

describe('POST /api/auth/username', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid request body (not JSON)', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request body');
  });

  it('returns 400 for invalid username format', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when user already has a username (immutability guard)', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({
      username: 'existing',
    } as never);

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newname' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Username already set and cannot be changed');
  });

  it('returns 409 when username is already taken', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    // First findUnique: immutability check (no username yet)
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    // Second findUnique: availability check (taken)
    mockUserFindUnique.mockResolvedValueOnce({ id: 'other-user' } as never);

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'takenname' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Username is already taken');
  });

  it('returns success with username on valid submission', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserUpdate.mockResolvedValueOnce({ username: 'newuser' } as never);

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('newuser');
  });

  it('returns 409 on P2002 unique constraint violation (race condition)', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);

    const p2002Error = new MockPrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002' }
    );
    mockUserUpdate.mockRejectedValueOnce(p2002Error);

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'raceuser' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Username is already taken');
  });

  it('re-throws non-P2002 errors', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserUpdate.mockRejectedValueOnce(new Error('Connection lost'));

    const req = new NextRequest('http://localhost/api/auth/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser' }),
    });
    await expect(POST(req)).rejects.toThrow('Connection lost');
  });
});
