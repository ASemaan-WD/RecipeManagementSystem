import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  requireAuth,
  requireRecipeOwner,
  canViewRecipe,
} from '@/lib/auth-utils';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createMockSession, createMockRecipe } from '@/test/factories';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findUnique: vi.fn() },
    recipeShare: { findUnique: vi.fn() },
    shareLink: { findUnique: vi.fn() },
  },
}));

const mockAuth = vi.mocked(auth);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);
const mockRecipeShareFindUnique = vi.mocked(prisma.recipeShare.findUnique);
const mockShareLinkFindUnique = vi.mocked(prisma.shareLink.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCurrentUser', () => {
  it('returns user when session exists', async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValueOnce(session);

    const user = await getCurrentUser();
    expect(user).toEqual(session.user);
  });

  it('returns null when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns session when authenticated', async () => {
    const session = createMockSession();
    mockAuth.mockResolvedValueOnce(session);

    const result = await requireAuth();
    expect(result).toEqual(session);
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('returns 401 NextResponse when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });
});

describe('requireRecipeOwner', () => {
  it('returns { session, recipe } when user owns the recipe', async () => {
    const session = createMockSession({ id: 'user-1' });
    mockAuth.mockResolvedValueOnce(session);
    const recipe = createMockRecipe({ authorId: 'user-1' });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await requireRecipeOwner('recipe-1');
    expect(result).toEqual({ session, recipe });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await requireRecipeOwner('recipe-1');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 404 when recipe does not exist', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession());
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const result = await requireRecipeOwner('nonexistent');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
    const body = await (result as NextResponse).json();
    expect(body.error).toBe('Recipe not found');
  });

  it('returns 403 when user is not the recipe author', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    const recipe = createMockRecipe({ authorId: 'user-2' });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await requireRecipeOwner('recipe-1');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
    const body = await (result as NextResponse).json();
    expect(body.error).toBe('Forbidden');
  });
});

describe('canViewRecipe', () => {
  it('allows author to view their own recipe', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession({ id: 'user-1' }));
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PRIVATE',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await canViewRecipe('recipe-1');
    expect(result).toHaveProperty('recipe');
    expect(result).toHaveProperty('user');
  });

  it('allows anyone to view a PUBLIC recipe', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession({ id: 'user-2' }));
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PUBLIC',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await canViewRecipe('recipe-1');
    expect(result).toHaveProperty('recipe');
  });

  it('allows unauthenticated user to view a PUBLIC recipe', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const recipe = createMockRecipe({ visibility: 'PUBLIC' });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await canViewRecipe('recipe-1');
    expect(result).toHaveProperty('recipe');
    expect((result as { recipe: unknown; user: unknown }).user).toBeNull();
  });

  it('allows user with RecipeShare record to view', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession({ id: 'user-2' }));
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PRIVATE',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);
    mockRecipeShareFindUnique.mockResolvedValueOnce({
      id: 'share-1',
      recipeId: 'recipe-1',
      userId: 'user-2',
      sharedAt: new Date(),
    } as never);

    const result = await canViewRecipe('recipe-1');
    expect(result).toHaveProperty('recipe');
  });

  it('allows access via valid active ShareLink token', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PRIVATE',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      token: 'valid-token',
      recipeId: 'recipe-1',
      isActive: true,
      createdAt: new Date(),
    } as never);

    const result = await canViewRecipe('recipe-1', 'valid-token');
    expect(result).toHaveProperty('recipe');
  });

  it('denies access via inactive share token', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const recipe = createMockRecipe({ visibility: 'PRIVATE' });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      token: 'inactive-token',
      recipeId: 'recipe-1',
      isActive: false,
      createdAt: new Date(),
    } as never);

    const result = await canViewRecipe('recipe-1', 'inactive-token');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });

  it('returns 404 when recipe does not exist', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession());
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const result = await canViewRecipe('nonexistent');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });

  it('denies unauthenticated user on a private recipe', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PRIVATE',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);

    const result = await canViewRecipe('recipe-1');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });

  it('denies non-author non-shared private recipe (404 not 403)', async () => {
    mockAuth.mockResolvedValueOnce(createMockSession({ id: 'user-2' }));
    const recipe = createMockRecipe({
      authorId: 'user-1',
      visibility: 'PRIVATE',
    });
    mockRecipeFindUnique.mockResolvedValueOnce(recipe as never);
    mockRecipeShareFindUnique.mockResolvedValueOnce(null);

    const result = await canViewRecipe('recipe-1');
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(404);
  });
});
