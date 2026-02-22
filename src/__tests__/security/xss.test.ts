import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
    ingredient: { findMany: vi.fn(), createMany: vi.fn() },
    recipeIngredient: { createMany: vi.fn() },
    recipeStep: { createMany: vi.fn() },
    recipeImage: { createMany: vi.fn() },
    dietaryTag: { findMany: vi.fn() },
    recipeDietaryTag: { createMany: vi.fn() },
    comment: { create: vi.fn() },
    shoppingList: { create: vi.fn(), findUnique: vi.fn() },
    shoppingListItem: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
  requireRecipeOwner: vi.fn(),
  canViewRecipe: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiWriteLimiter: { check: vi.fn() },
  apiReadLimiter: { check: vi.fn() },
  searchLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/generated/prisma/client', () => ({
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  ImageSource: { UPLOAD: 'UPLOAD', URL: 'URL', AI_GENERATED: 'AI_GENERATED' },
}));

import { prisma } from '@/lib/db';
import { requireAuth, canViewRecipe } from '@/lib/auth-utils';
import { createMockSession } from '@/test/factories';

const mockRequireAuth = vi.mocked(requireAuth);
const mockCanViewRecipe = vi.mocked(canViewRecipe);
const mockTransaction = vi.mocked(prisma.$transaction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('XSS Prevention', () => {
  it('strips HTML from recipe name on creation', async () => {
    const { POST } = await import('@/app/api/recipes/route');

    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    vi.mocked(prisma.recipe.create).mockResolvedValue({
      id: 'recipe-1',
    } as never);
    vi.mocked(prisma.ingredient.findMany).mockResolvedValue([
      {
        id: 'ing-1',
        name: 'flour',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.mocked(prisma.ingredient.createMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.recipeIngredient.createMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.recipeStep.createMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.recipe.findUniqueOrThrow).mockResolvedValue({
      id: 'recipe-1',
      name: 'Test Recipe',
      description: 'desc',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'EASY',
      cuisineType: 'Italian',
      visibility: 'PRIVATE',
      avgRating: null,
      ratingCount: 0,
      nutritionData: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      author: { id: 'user-1', name: 'Test', username: 'test', image: null },
      images: [],
      ingredients: [],
      steps: [],
      dietaryTags: [],
      savedBy: [],
    } as never);

    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') return fn(prisma as never);
    });

    const req = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '<script>alert("xss")</script>My Recipe',
        description: 'A <b>bold</b> description',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'EASY',
        cuisineType: '<img onerror=alert(1)>Italian',
        visibility: 'PRIVATE',
        ingredients: [
          { name: '<script>bad</script>Flour', quantity: '2 cups', order: 0 },
        ],
        steps: [
          {
            instruction: '<script>bad</script>Mix ingredients.',
            stepNumber: 1,
          },
        ],
        dietaryTagIds: [],
        images: [],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify the recipe was created with sanitized name (not containing script tags)
    const createCall = vi.mocked(prisma.recipe.create).mock.calls[0]?.[0];
    expect(createCall?.data?.name).not.toContain('<script>');
    expect(createCall?.data?.name).toContain('My Recipe');
    expect(createCall?.data?.description).not.toContain('<b>');
    expect(createCall?.data?.cuisineType).not.toContain('<img');
  });

  it('strips HTML from comment content', async () => {
    const { POST } = await import('@/app/api/recipes/[id]/comments/route');

    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: { id: 'recipe-1' },
      user: { id: 'user-1' },
    } as never);

    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: 'comment-1',
      content: 'Great recipe',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', name: 'Test', username: 'test', image: null },
    } as never);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/comments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '<script>document.cookie</script>Great recipe!',
        }),
      }
    );

    const res = await POST(req, {
      params: Promise.resolve({ id: 'recipe-1' }),
    });
    expect(res.status).toBe(201);

    const createCall = vi.mocked(prisma.comment.create).mock.calls[0]?.[0];
    expect(createCall?.data?.content).not.toContain('<script>');
    expect(createCall?.data?.content).toContain('Great recipe!');
  });
});
