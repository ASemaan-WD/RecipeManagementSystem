import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/share/[token]/route';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';

vi.mock('@/lib/db', () => ({
  prisma: {
    shareLink: { findUnique: vi.fn() },
    recipe: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockShareLinkFindUnique = vi.mocked(prisma.shareLink.findUnique);
const mockRecipeFindUnique = vi.mocked(prisma.recipe.findUnique);

const routeParams = { params: Promise.resolve({ token: 'abc123' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/share/[token]', () => {
  it('returns recipe with isAuthenticated true for logged-in user', async () => {
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      isActive: true,
      recipeId: 'recipe-1',
    } as never);
    mockGetCurrentUser.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      image: null,
    });
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Test Recipe',
      description: 'A test recipe',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'EASY',
      cuisineType: 'Italian',
      visibility: 'SHARED',
      avgRating: null,
      ratingCount: 0,
      nutritionData: null,
      authorId: 'user-2',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      author: {
        id: 'user-2',
        name: 'Author',
        username: 'author',
        image: null,
      },
      images: [],
      ingredients: [],
      steps: [],
      dietaryTags: [],
    } as never);

    const req = new NextRequest('http://localhost/api/share/abc123');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.name).toBe('Test Recipe');
    expect(body.isAuthenticated).toBe(true);
  });

  it('returns recipe with isAuthenticated false for guest', async () => {
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      isActive: true,
      recipeId: 'recipe-1',
    } as never);
    mockGetCurrentUser.mockResolvedValueOnce(null);
    mockRecipeFindUnique.mockResolvedValueOnce({
      id: 'recipe-1',
      name: 'Test Recipe',
      description: null,
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'EASY',
      cuisineType: null,
      visibility: 'SHARED',
      avgRating: null,
      ratingCount: 0,
      nutritionData: null,
      authorId: 'user-2',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      author: {
        id: 'user-2',
        name: 'Author',
        username: 'author',
        image: null,
      },
      images: [],
      ingredients: [],
      steps: [],
      dietaryTags: [],
    } as never);

    const req = new NextRequest('http://localhost/api/share/abc123');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isAuthenticated).toBe(false);
  });

  it('returns 404 for inactive share link', async () => {
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      isActive: false,
      recipeId: 'recipe-1',
    } as never);

    const req = new NextRequest('http://localhost/api/share/abc123');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent token', async () => {
    mockShareLinkFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/share/nonexistent');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 404 when recipe not found', async () => {
    mockShareLinkFindUnique.mockResolvedValueOnce({
      id: 'link-1',
      isActive: true,
      recipeId: 'recipe-1',
    } as never);
    mockGetCurrentUser.mockResolvedValueOnce(null);
    mockRecipeFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/share/abc123');
    const res = await GET(req, routeParams);
    expect(res.status).toBe(404);
  });
});
