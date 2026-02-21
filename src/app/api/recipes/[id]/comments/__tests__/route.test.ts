import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/recipes/[id]/comments/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession, createMockComment } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn() },
    comment: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockCommentFindMany = vi.mocked(prisma.comment.findMany);
const mockCommentCount = vi.mocked(prisma.comment.count);
const mockCommentCreate = vi.mocked(prisma.comment.create);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/[id]/comments', () => {
  it('returns paginated comments', async () => {
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);

    const comment = createMockComment();
    mockCommentFindMany.mockResolvedValueOnce([comment] as never);
    mockCommentCount.mockResolvedValueOnce(1);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments?page=1&limit=10'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].content).toBe('This is a great recipe!');
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it('returns 404 when recipe not found', async () => {
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('uses default pagination when no params', async () => {
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);
    mockCommentFindMany.mockResolvedValueOnce([] as never);
    mockCommentCount.mockResolvedValueOnce(0);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments'
    );
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.pageSize).toBe(10);
  });

  it('does not include user email in response', async () => {
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);

    const comment = createMockComment();
    mockCommentFindMany.mockResolvedValueOnce([comment] as never);
    mockCommentCount.mockResolvedValueOnce(1);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments'
    );
    const res = await GET(req, routeParams);
    const body = await res.json();
    expect(body.data[0].user.email).toBeUndefined();
  });
});

describe('POST /api/recipes/[id]/comments', () => {
  it('creates a comment and returns 201', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);

    const comment = createMockComment({
      userId: 'user-1',
      content: 'Nice recipe!',
      user: {
        id: 'user-1',
        name: 'Test User',
        username: 'testuser',
        image: null,
      },
    });
    mockCommentCreate.mockResolvedValueOnce(comment as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Nice recipe!' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.content).toBe('Nice recipe!');
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Hello' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when recipe not found', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Hello' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty content', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('sanitizes HTML from content', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({ id: 'recipe-1' } as never);

    const comment = createMockComment({ content: 'clean content' });
    mockCommentCreate.mockResolvedValueOnce(comment as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        body: JSON.stringify({
          content: '<script>alert("xss")</script>clean content',
        }),
      }
    );

    const res = await POST(req, routeParams);
    expect(res.status).toBe(201);

    // Verify sanitized content was passed to Prisma
    expect(mockCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: 'alert("xss")clean content',
        }),
      })
    );
  });
});
