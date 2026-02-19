import type { Session } from 'next-auth';

export interface MockUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    image: 'https://example.com/avatar.jpg',
    emailVerified: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function createMockSession(
  overrides: Partial<Session['user']> = {}
): Session {
  return {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      username: 'testuser',
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function createMockRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'EASY' as const,
    cuisineType: 'Italian',
    visibility: 'PRIVATE' as const,
    nutritionData: null,
    avgRating: null,
    ratingCount: 0,
    authorId: 'user-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}
