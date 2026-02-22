import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    recipeShare: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
  requireRecipeOwner: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  substitutionLimiter: { check: vi.fn() },
  nutritionLimiter: { check: vi.fn() },
  imageLimiter: { check: vi.fn() },
  apiWriteLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/generated/prisma/client', () => ({
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@/lib/openai', () => ({
  openai: vi.fn(() => 'mock-model'),
  TEXT_MODEL: 'gpt-4o-mini',
}));

vi.mock('openai', () => {
  const MockOpenAI = vi.fn(function () {
    return {
      images: {
        generate: vi
          .fn()
          .mockRejectedValue(new Error('Rate limit exceeded for dall-e-3')),
      },
    };
  });
  return { default: MockOpenAI };
});

vi.mock('@/lib/blob-storage', () => ({
  uploadImageFromUrl: vi.fn(),
}));

import { requireAuth, requireRecipeOwner } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { createMockSession } from '@/test/factories';

const mockRequireAuth = vi.mocked(requireAuth);
const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Error Response Security', () => {
  it('AI substitute route does not expose internal error details', async () => {
    const { POST } = await import('@/app/api/ai/substitute/route');
    const { generateText } = await import('ai');

    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    vi.mocked(generateText).mockRejectedValue(
      new Error('OpenAI API key invalid: sk-proj-abc123...')
    );

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredient: 'butter',
        recipeContext: 'Cookies',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).not.toContain('sk-proj');
    expect(body.error).not.toContain('API key');
    expect(body.error).toBe('Failed to find substitutions. Please try again.');
  });

  it('AI nutrition route does not expose internal error details', async () => {
    const { POST } = await import('@/app/api/ai/nutrition/[recipeId]/route');
    const { generateText } = await import('ai');

    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce({
      id: 'r1',
      name: 'Test',
      servings: 4,
      authorId: 'user-1',
      nutritionData: null,
      visibility: 'PUBLIC',
      ingredients: [{ quantity: '2 cups', ingredient: { name: 'flour' } }],
    } as never);
    vi.mocked(generateText).mockRejectedValue(
      new Error('Prisma connection pool exhausted')
    );

    const req = new NextRequest('http://localhost/api/ai/nutrition/r1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, {
      params: Promise.resolve({ recipeId: 'r1' }),
    });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).not.toContain('Prisma');
    expect(body.error).not.toContain('pool');
    expect(body.error).toBe('Failed to estimate nutrition. Please try again.');
  });

  it('AI image generation route does not expose internal error details', async () => {
    const { POST } =
      await import('@/app/api/ai/generate-image/[recipeId]/route');

    mockRequireRecipeOwner.mockResolvedValueOnce({
      session: createMockSession(),
      recipe: { id: 'r1', authorId: 'user-1' },
    } as never);
    vi.mocked(prisma.recipe.findUnique).mockResolvedValueOnce({
      name: 'Test Recipe',
      description: 'A test',
      images: [],
    } as never);

    // The generate-image route creates its own OpenAI client at module level.
    // The vi.mock('openai') factory already makes generate() reject with an error.

    const req = new NextRequest('http://localhost/api/ai/generate-image/r1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, {
      params: Promise.resolve({ recipeId: 'r1' }),
    });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).not.toContain('Rate limit');
    expect(body.error).not.toContain('dall-e');
    expect(body.error).toBe('Failed to generate image. Please try again.');
  });
});
