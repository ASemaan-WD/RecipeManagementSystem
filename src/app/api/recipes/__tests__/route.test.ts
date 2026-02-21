import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/recipes/route';
import { prisma } from '@/lib/db';
import { requireAuth, getCurrentUser } from '@/lib/auth-utils';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    ingredient: { upsert: vi.fn() },
    recipeIngredient: { create: vi.fn() },
    recipeStep: { createMany: vi.fn() },
    recipeImage: { createMany: vi.fn() },
    dietaryTag: { findMany: vi.fn() },
    recipeDietaryTag: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/generated/prisma/client', () => ({
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  ImageSource: { UPLOAD: 'UPLOAD', URL: 'URL', AI_GENERATED: 'AI_GENERATED' },
}));

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockRequireAuth = vi.mocked(requireAuth);
const mockRecipeFindMany = vi.mocked(prisma.recipe.findMany);
const mockRecipeCount = vi.mocked(prisma.recipe.count);
const mockTransaction = vi.mocked(prisma.$transaction);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes', () => {
  it('returns paginated recipes for unauthenticated users', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    mockRecipeCount.mockResolvedValueOnce(1);
    mockRecipeFindMany.mockResolvedValueOnce([
      {
        ...createMockRecipe({ visibility: 'PUBLIC' }),
        author: { id: 'user-1', name: 'Test', username: 'test', image: null },
        images: [],
        dietaryTags: [],
        savedBy: [],
      },
    ] as never);

    const req = new NextRequest('http://localhost/api/recipes');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
  });

  it('returns 400 for invalid filter params', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/recipes?limit=999');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('applies search filter', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    mockRecipeCount.mockResolvedValueOnce(0);
    mockRecipeFindMany.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/recipes?search=pasta');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockRecipeFindMany).toHaveBeenCalled();
  });

  it('applies sort parameter', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    mockRecipeCount.mockResolvedValueOnce(0);
    mockRecipeFindMany.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/recipes?sort=oldest');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/recipes', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const req = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates a recipe with valid data', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const mockCreatedRecipe = {
      ...createMockRecipe(),
      author: { id: 'user-1', name: 'Test', username: 'test', image: null },
      images: [],
      ingredients: [],
      steps: [],
      dietaryTags: [],
      savedBy: [],
    };

    // Mock transaction internals: recipe.create returns id, ingredient.upsert returns id
    vi.mocked(prisma.recipe.create).mockResolvedValue({
      id: 'recipe-1',
    } as never);
    vi.mocked(prisma.ingredient.upsert).mockResolvedValue({
      id: 'ing-1',
      name: 'flour',
    } as never);
    vi.mocked(prisma.recipeIngredient.create).mockResolvedValue({} as never);
    vi.mocked(prisma.recipeStep.createMany).mockResolvedValue({
      count: 1,
    } as never);

    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') {
        return fn(prisma as never);
      }
    });

    // Mock the re-fetch after creation
    vi.mocked(prisma.recipe.findUniqueOrThrow).mockResolvedValueOnce(
      mockCreatedRecipe as never
    );

    const req = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Recipe',
        description: 'A new recipe',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'EASY',
        cuisineType: 'Italian',
        visibility: 'PRIVATE',
        ingredients: [{ name: 'Flour', quantity: '2 cups', order: 0 }],
        steps: [{ instruction: 'Mix.', stepNumber: 1 }],
        dietaryTagIds: [],
        images: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid JSON body', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const req = new NextRequest('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
