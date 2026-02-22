import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/ai/nutrition/[recipeId]/route';
import { requireAuth } from '@/lib/auth-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/db';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  nutritionLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    recipeShare: {
      findUnique: vi.fn(),
    },
  },
}));

const mockNutritionData = {
  calories: 350,
  protein: 25,
  carbohydrates: 40,
  fat: 12,
  fiber: 5,
  sugar: 8,
  sodium: 600,
  servingSize: '1 plate',
};

vi.mock('ai', () => ({
  generateText: vi.fn(() =>
    Promise.resolve({
      text: JSON.stringify(mockNutritionData),
    })
  ),
}));

vi.mock('@/lib/openai', () => ({
  openai: vi.fn(() => 'mock-model'),
  TEXT_MODEL: 'gpt-4o-mini',
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockRecipeUpdate = vi.mocked(prisma.recipe.update);

const createParams = (recipeId: string) => Promise.resolve({ recipeId });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/ai/nutrition/[recipeId]', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(401);
  });

  it('returns 404 when recipe not found', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/nutrition/missing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('missing') });
    expect(res.status).toBe(404);
  });

  it('returns cached nutrition data without AI call', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Test Recipe',
      servings: 4,
      authorId: session.user.id,
      nutritionData: mockNutritionData,
      visibility: 'PRIVATE',
      ingredients: [],
    } as never);

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cached).toBe(true);
    expect(data.nutritionData.calories).toBe(350);
    // Rate limit should NOT have been checked
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited (cache miss)', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Test Recipe',
      servings: 4,
      authorId: session.user.id,
      nutritionData: null,
      visibility: 'PRIVATE',
      ingredients: [{ quantity: '2 cups', ingredient: { name: 'rice' } }],
    } as never);
    mockCheckRateLimit.mockReturnValueOnce(
      NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(429);
  });

  it('estimates nutrition and caches result', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Chicken Rice',
      servings: 4,
      authorId: session.user.id,
      nutritionData: null,
      visibility: 'PRIVATE',
      ingredients: [
        { quantity: '2 cups', ingredient: { name: 'rice' } },
        { quantity: '500g', ingredient: { name: 'chicken' } },
      ],
    } as never);
    mockCheckRateLimit.mockReturnValueOnce(null);
    mockRecipeUpdate.mockResolvedValueOnce({} as never);

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cached).toBe(false);
    expect(data.nutritionData.calories).toBe(350);
    // Should have cached the result
    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'recipe-1' },
        data: { nutritionData: mockNutritionData },
      })
    );
  });

  it('returns 403 for private recipe of another user', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Secret Recipe',
      servings: 2,
      authorId: 'other-user',
      nutritionData: null,
      visibility: 'PRIVATE',
      ingredients: [],
    } as never);
    vi.mocked(prisma.recipeShare.findUnique).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(403);
  });

  it('returns 400 when recipe has no ingredients', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Empty Recipe',
      servings: 4,
      authorId: session.user.id,
      nutritionData: null,
      visibility: 'PRIVATE',
      ingredients: [],
    } as never);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/nutrition/recipe-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: createParams('recipe-1') });
    expect(res.status).toBe(400);
  });
});
