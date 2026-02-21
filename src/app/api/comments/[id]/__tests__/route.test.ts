import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PUT, DELETE } from '@/app/api/comments/[id]/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    comment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockCommentFindUnique = vi.mocked(prisma.comment.findUnique);
const mockCommentUpdate = vi.mocked(prisma.comment.update);
const mockCommentDelete = vi.mocked(prisma.comment.delete);

const routeParams = { params: Promise.resolve({ id: 'comment-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/comments/[id]', () => {
  it('updates a comment when user is the author', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'user-1',
    } as never);

    const updatedComment = {
      id: 'comment-1',
      content: 'Updated content',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-1',
        name: 'Test User',
        username: 'testuser',
        image: null,
      },
    };
    mockCommentUpdate.mockResolvedValueOnce(updatedComment as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated content' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.content).toBe('Updated content');
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when comment not found', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the comment author', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'other-user',
    } as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('own comments');
  });

  it('returns 400 for empty content', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'user-1',
    } as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: '' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('sanitizes HTML from updated content', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'user-1',
    } as never);

    const updatedComment = {
      id: 'comment-1',
      content: 'safe text',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', name: 'Test', username: 'test', image: null },
    };
    mockCommentUpdate.mockResolvedValueOnce(updatedComment as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'PUT',
      body: JSON.stringify({ content: '<b>safe</b> text' }),
    });

    const res = await PUT(req, routeParams);
    expect(res.status).toBe(200);

    expect(mockCommentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: 'safe text' }),
      })
    );
  });
});

describe('DELETE /api/comments/[id]', () => {
  it('deletes a comment when user is the comment author', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'user-1',
      recipe: { authorId: 'other-user' },
    } as never);
    mockCommentDelete.mockResolvedValueOnce({} as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('deletes a comment when user is the recipe author', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'other-user',
      recipe: { authorId: 'user-1' },
    } as never);
    mockCommentDelete.mockResolvedValueOnce({} as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when comment not found', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is neither comment nor recipe author', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCommentFindUnique.mockResolvedValueOnce({
      id: 'comment-1',
      userId: 'other-user',
      recipe: { authorId: 'another-user' },
    } as never);

    const req = new NextRequest('http://localhost/api/comments/comment-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('Not authorized');
  });
});
