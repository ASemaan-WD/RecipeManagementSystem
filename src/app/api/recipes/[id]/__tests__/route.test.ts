import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/recipes/[id]/route';
import { prisma } from '@/lib/db';
import {
  requireRecipeOwner,
  canViewRecipe,
  getCurrentUser,
} from '@/lib/auth-utils';
import { createMockRecipe, createMockSession } from '@/test/factories';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    recipeIngredient: { deleteMany: vi.fn(), create: vi.fn() },
    recipeStep: { deleteMany: vi.fn(), createMany: vi.fn() },
    recipeImage: { deleteMany: vi.fn(), createMany: vi.fn() },
    recipeDietaryTag: { deleteMany: vi.fn(), createMany: vi.fn() },
    ingredient: { upsert: vi.fn() },
    dietaryTag: { findMany: vi.fn() },
    userRecipeTag: { findMany: vi.fn() },
    savedRecipe: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  requireRecipeOwner: vi.fn(),
  canViewRecipe: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/generated/prisma/client', () => ({
  Difficulty: { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD' },
  Visibility: { PRIVATE: 'PRIVATE', SHARED: 'SHARED', PUBLIC: 'PUBLIC' },
  ImageSource: { UPLOAD: 'UPLOAD', URL: 'URL', AI_GENERATED: 'AI_GENERATED' },
}));

const mockCanViewRecipe = vi.mocked(canViewRecipe);
const mockRequireRecipeOwner = vi.mocked(requireRecipeOwner);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockRecipeFindUniqueOrThrow = vi.mocked(prisma.recipe.findUniqueOrThrow);
const mockRecipeDelete = vi.mocked(prisma.recipe.delete);
const mockTransaction = vi.mocked(prisma.$transaction);

const routeParams = { params: Promise.resolve({ id: 'recipe-1' }) };

function createMockDetailResult() {
  return {
    ...createMockRecipe(),
    author: { id: 'user-1', name: 'Test', username: 'test', image: null },
    images: [
      {
        id: 'img-1',
        url: 'https://example.com/img.jpg',
        source: 'UPLOAD',
        isPrimary: true,
        order: 0,
      },
    ],
    ingredients: [
      {
        id: 'ri-1',
        quantity: '2 cups',
        notes: null,
        order: 0,
        ingredient: { name: 'flour' },
      },
    ],
    steps: [
      { id: 'step-1', stepNumber: 1, instruction: 'Mix.', duration: null },
    ],
    dietaryTags: [{ dietaryTag: { id: 'tag-1', name: 'Vegan' } }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/recipes/[id]', () => {
  it('returns recipe detail when authorized', async () => {
    const mockRecipe = createMockDetailResult();
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: mockRecipe,
      user: null,
    } as never);
    mockRecipeFindUniqueOrThrow.mockResolvedValueOnce(mockRecipe as never);
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe('recipe-1');
    expect(body.name).toBe('Test Recipe');
    expect(body.ingredients).toHaveLength(1);
    expect(body.steps).toHaveLength(1);
  });

  it('returns 404 when recipe not found or not authorized', async () => {
    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('includes user-specific data when authenticated', async () => {
    const mockRecipe = createMockDetailResult();
    const mockUser = {
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      image: null,
      username: 'test',
    };
    mockCanViewRecipe.mockResolvedValueOnce({
      recipe: mockRecipe,
      user: mockUser,
    } as never);
    mockRecipeFindUniqueOrThrow.mockResolvedValueOnce(mockRecipe as never);
    mockGetCurrentUser.mockResolvedValueOnce(mockUser as never);
    vi.mocked(prisma.userRecipeTag.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.savedRecipe.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isSaved).toBe(false);
    expect(body.userTags).toEqual([]);
  });

  it('passes share token from query params', async () => {
    mockCanViewRecipe.mockResolvedValueOnce(
      NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    );

    const req = new NextRequest(
      'http://localhost/api/recipes/recipe-1?token=abc123'
    );
    await GET(req, routeParams);

    expect(mockCanViewRecipe).toHaveBeenCalledWith('recipe-1', 'abc123');
  });
});

describe('PUT /api/recipes/[id]', () => {
  it('returns 401/403/404 when not owner', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    const res = await PUT(req, routeParams);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: createMockRecipe(),
    } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: createMockRecipe(),
    } as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await PUT(req, routeParams);
    expect(res.status).toBe(400);
  });

  it('updates recipe with valid data via transaction', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: createMockRecipe(),
    } as never);

    mockTransaction.mockImplementationOnce(async (fn) => {
      if (typeof fn === 'function') {
        return fn(prisma as never);
      }
    });

    const mockUpdated = createMockDetailResult();
    mockRecipeFindUniqueOrThrow.mockResolvedValueOnce(mockUpdated as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Recipe' }),
    });
    const res = await PUT(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe('recipe-1');
  });
});

describe('DELETE /api/recipes/[id]', () => {
  it('returns 403 when not owner', async () => {
    mockRequireRecipeOwner.mockResolvedValueOnce(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(403);
  });

  it('deletes recipe and returns success', async () => {
    const session = createMockSession();
    mockRequireRecipeOwner.mockResolvedValueOnce({
      session,
      recipe: createMockRecipe(),
    } as never);
    mockRecipeDelete.mockResolvedValueOnce(createMockRecipe() as never);

    const req = new NextRequest('http://localhost/api/recipes/recipe-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
