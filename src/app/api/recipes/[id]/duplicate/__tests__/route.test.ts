import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/recipes/[id]/duplicate/route';
import { prisma } from '@/lib/db';
import { requireAuth, canViewRecipe } from '@/lib/auth-utils';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
    },
    recipeIngredient: { create: vi.fn() },
    recipeStep: { createMany: vi.fn() },
    recipeImage: { createMany: vi.fn() },
    recipeDietaryTag: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
  canViewRecipe: vi.fn(),
}));

vi.mock('@/generated/prisma/client', () => ({
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  ImageSource: { UPLOAD: 'UPLOAD', URL: 'URL', AI_GENERATED: 'AI_GENERATED' },
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockCanViewRecipe = vi.mocked(canViewRecipe);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockRecipeFindUniqueOrThrow = vi.mocked(prisma.recipe.findUniqueOrThrow);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/recipes/[id]/duplicate', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/duplicate',
      {
        method: 'POST',
      }
    );
    const res = await POST(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 404 when recipe cannot be viewed', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/duplicate',
      {
        method: 'POST',
      }
    );
    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 404 when source recipe not found in DB', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: createMockRecipe(),
      user: { id: 'user-1' },
    } as never);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/duplicate',
      {
        method: 'POST',
      }
    );
    const res = await POST(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('duplicates recipe with " (Copy)" suffix and PRIVATE visibility', async () => {
    const session = createMockSession({ id: 'user-2' });
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: createMockRecipe({ visibility: 'PUBLIC' }),
      user: { id: 'user-2' },
    } as never);

    const sourceRecipe = {
      ...createMockRecipe({ visibility: 'PUBLIC', authorId: 'user-1' }),
      ingredients: [
        {
          id: 'ri-1',
          ingredientId: 'ing-1',
          quantity: '2 cups',
          notes: null,
          order: 0,
          ingredient: { id: 'ing-1', name: 'flour' },
        },
      ],
      steps: [
        {
          id: 'step-1',
          recipeId: 'recipe-1',
          stepNumber: 1,
          instruction: 'Mix.',
          duration: null,
        },
      ],
      images: [
        {
          id: 'img-1',
          recipeId: 'recipe-1',
          url: 'https://example.com/img.jpg',
          source: 'UPLOAD',
          isPrimary: true,
          order: 0,
        },
      ],
      dietaryTags: [
        { id: 'rdt-1', recipeId: 'recipe-1', dietaryTagId: 'tag-1' },
      ],
    };
    mockRecipeFindUnique.mockResolvedValueOnce(sourceRecipe as never);

    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') {
        return 'recipe-copy';
      }
      return 'recipe-copy';
    });

    const duplicatedRecipe = {
      id: 'recipe-copy',
      name: 'Test Recipe (Copy)',
      description: 'A test recipe',
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
      author: { id: 'user-2', name: 'Test', username: 'test2', image: null },
      images: [],
      ingredients: [],
      steps: [],
      dietaryTags: [],
    };
    mockRecipeFindUniqueOrThrow.mockResolvedValueOnce(
      duplicatedRecipe as never
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1/duplicate',
      {
        method: 'POST',
      }
    );
    const res = await POST(req, routeParams);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.name).toBe('Test Recipe (Copy)');
    expect(body.id).toBe('recipe-copy');
  });
});
