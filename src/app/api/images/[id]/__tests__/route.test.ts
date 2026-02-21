import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { DELETE } from '@/app/api/images/[id]/route';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipeImage: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockImageFindUnique = vi.mocked(prisma.recipeImage.findUnique);
const mockImageDelete = vi.mocked(prisma.recipeImage.delete);

const routeParams = { params: Promise.resolve({ id: 'image-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DELETE /api/images/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/images/image-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when image not found', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    mockImageFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/images/image-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe('Image not found');
  });

  it('returns 403 when user is not the recipe owner', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-2' }));
    mockImageFindUnique.mockResolvedValueOnce({
      id: 'image-1',
      recipe: { authorId: 'user-1' },
    } as never);

    const req = new NextRequest('http://localhost/api/images/image-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('deletes image when user is the recipe owner', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    mockImageFindUnique.mockResolvedValueOnce({
      id: 'image-1',
      recipe: { authorId: 'user-1' },
    } as never);
    mockImageDelete.mockResolvedValueOnce({} as never);

    const req = new NextRequest('http://localhost/api/images/image-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockImageDelete).toHaveBeenCalledWith({ where: { id: 'image-1' } });
  });
});
