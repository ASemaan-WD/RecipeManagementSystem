import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/auth/username/route';
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
      delete: vi.fn(),
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
const mockUserDelete = vi.mocked(prisma.user.delete);
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
      headers: { 'Content-Type': 'application/json' },
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

  it('returns 409 on unique constraint violation (race condition)', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserFindUnique.mockResolvedValueOnce(null);

    const uniqueError = new MockPrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: '23505' }
    );
    mockUserUpdate.mockRejectedValueOnce(uniqueError);

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

  it('re-throws non-unique-constraint errors', async () => {
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

describe('DELETE /api/auth/username', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce(null);

    const res = await DELETE();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('User not found');
  });

  it('returns 400 when user has already set a username', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({
      username: 'existinguser',
    } as never);

    const res = await DELETE();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe(
      'Cannot delete account after onboarding is complete'
    );
  });

  it('deletes user and returns success when username is null', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockUserFindUnique.mockResolvedValueOnce({ username: null } as never);
    mockUserDelete.mockResolvedValueOnce({} as never);

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUserDelete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});
