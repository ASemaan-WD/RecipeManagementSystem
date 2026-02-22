import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/ai/generate-image/[recipeId]/route';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireRecipeOwner: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  imageLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findUnique: vi.fn(),
    },
    recipeImage: {
      create: vi.fn(),
    },
  },
}));

vi.mock('openai', () => {
  const MockOpenAI = function () {
    return {
      images: {
        generate: vi.fn().mockResolvedValue({
          data: [
            {
              url: 'https://oaidalleapiprodscus.blob.core.windows.net/test-image.png',
            },
          ],
        }),
      },
    };
  };
  return { default: MockOpenAI };
});

vi.mock('@/lib/blob-storage', () => ({
  uploadImageFromUrl: vi
    .fn()
    .mockResolvedValue(
      'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg'
    ),
}));

const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockRecipeImageCreate = vi.mocked(prisma.recipeImage.create);

const createParams = (recipeId: string) => Promise.resolve({ recipeId });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/ai/generate-image/[recipeId]', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/ai/generate-image/recipe-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-owners', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest(
      'http://localhost/api/ai/generate-image/recipe-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: { id: 'recipe-1', authorId: session.user.id } as never,
    });
    mockCheckRateLimit.mockReturnValueOnce(
      NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    );

    const req = new NextRequest(
      'http://localhost/api/ai/generate-image/recipe-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(429);
  });

  it('generates image and returns 201', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: { id: 'recipe-1', authorId: session.user.id } as never,
    });
    mockCheckRateLimit.mockReturnValueOnce(null);
    mockRecipeFindUnique.mockResolvedValueOnce({
      name: 'Chicken Pasta',
      description: 'Creamy pasta with chicken',
      images: [],
    } as never);
    mockRecipeImageCreate.mockResolvedValueOnce({
      id: 'img-1',
      url: 'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg',
    } as never);

    const req = new NextRequest(
      'http://localhost/api/ai/generate-image/recipe-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.url).toBe(
      'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg'
    );
    expect(data.imageId).toBe('img-1');
  });

  it('sets isPrimary true when first image', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: { id: 'recipe-1', authorId: session.user.id } as never,
    });
    mockCheckRateLimit.mockReturnValueOnce(null);
    mockRecipeFindUnique.mockResolvedValueOnce({
      name: 'Chicken Pasta',
      description: null,
      images: [],
    } as never);
    mockRecipeImageCreate.mockResolvedValueOnce({
      id: 'img-1',
      url: 'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg',
    } as never);

    const req = new NextRequest(
      'http://localhost/api/ai/generate-image/recipe-1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    await POST(req, { params: createParams('recipe-1') });

    expect(mockRecipeImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrimary: true }),
      })
    );
  });
});
