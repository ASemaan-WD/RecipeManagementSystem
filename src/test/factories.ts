import type { Session } from 'next-auth';
import type {
  RecipeListItem,
  RecipeDetail,
  PaginatedResponse,
} from '@/types/recipe';

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

export function createMockRecipeListItem(
  overrides: Partial<RecipeListItem> = {}
): RecipeListItem {
  return {
    id: 'recipe-1',
    name: 'Test Recipe',
    description: 'A test recipe description',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'EASY',
    cuisineType: 'Italian',
    visibility: 'PRIVATE',
    avgRating: 4.5,
    ratingCount: 12,
    createdAt: '2025-01-01T00:00:00.000Z',
    author: {
      id: 'user-1',
      name: 'Test User',
      username: 'testuser',
      image: 'https://example.com/avatar.jpg',
    },
    primaryImage: { url: 'https://example.com/recipe.jpg' },
    dietaryTags: [{ id: 'tag-1', name: 'Vegetarian' }],
    ...overrides,
  };
}

export function createMockRecipeIngredient(
  overrides: Partial<RecipeDetail['ingredients'][number]> = {}
): RecipeDetail['ingredients'][number] {
  return {
    id: 'ingredient-1',
    name: 'Flour',
    quantity: '2 cups',
    notes: null,
    order: 0,
    ...overrides,
  };
}

export function createMockRecipeStep(
  overrides: Partial<RecipeDetail['steps'][number]> = {}
): RecipeDetail['steps'][number] {
  return {
    id: 'step-1',
    stepNumber: 1,
    instruction: 'Preheat the oven to 350°F.',
    duration: null,
    ...overrides,
  };
}

export function createMockRecipeDetail(
  overrides: Partial<RecipeDetail> = {}
): RecipeDetail {
  return {
    ...createMockRecipeListItem(),
    nutritionData: null,
    updatedAt: '2025-01-01T00:00:00.000Z',
    images: [
      {
        id: 'image-1',
        url: 'https://example.com/recipe.jpg',
        source: 'UPLOAD',
        isPrimary: true,
        order: 0,
      },
    ],
    ingredients: [
      createMockRecipeIngredient(),
      createMockRecipeIngredient({
        id: 'ingredient-2',
        name: 'Sugar',
        quantity: '1 cup',
        order: 1,
      }),
    ],
    steps: [
      createMockRecipeStep(),
      createMockRecipeStep({
        id: 'step-2',
        stepNumber: 2,
        instruction: 'Mix the dry ingredients together.',
        duration: 5,
      }),
    ],
    ...overrides,
  };
}

export interface MockUserRecipeTag {
  id: string;
  userId: string;
  recipeId: string;
  status: 'FAVORITE' | 'TO_TRY' | 'MADE_BEFORE';
}

export function createMockUserRecipeTag(
  overrides: Partial<MockUserRecipeTag> = {}
): MockUserRecipeTag {
  return {
    id: 'tag-1',
    userId: 'user-1',
    recipeId: 'recipe-1',
    status: 'FAVORITE',
    ...overrides,
  };
}

export interface MockSavedRecipe {
  id: string;
  userId: string;
  recipeId: string;
  savedAt: Date;
}

export function createMockSavedRecipe(
  overrides: Partial<MockSavedRecipe> = {}
): MockSavedRecipe {
  return {
    id: 'saved-1',
    userId: 'user-1',
    recipeId: 'recipe-1',
    savedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export interface MockRecipeShare {
  id: string;
  recipeId: string;
  userId: string;
  sharedAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export function createMockRecipeShare(
  overrides: Partial<MockRecipeShare> = {}
): MockRecipeShare {
  return {
    id: 'share-1',
    recipeId: 'recipe-1',
    userId: 'user-2',
    sharedAt: new Date('2025-01-15'),
    user: {
      id: 'user-2',
      name: 'Shared User',
      username: 'shareduser',
      image: null,
    },
    ...overrides,
  };
}

export interface MockShareLink {
  id: string;
  recipeId: string;
  token: string;
  isActive: boolean;
  createdAt: Date;
}

export function createMockShareLink(
  overrides: Partial<MockShareLink> = {}
): MockShareLink {
  return {
    id: 'link-1',
    recipeId: 'recipe-1',
    token: 'abc123def456ghi789jkl',
    isActive: true,
    createdAt: new Date('2025-01-15'),
    ...overrides,
  };
}

export function createMockPaginatedResponse<T>(
  data: T[],
  overrides: Partial<PaginatedResponse<T>['pagination']> = {}
): PaginatedResponse<T> {
  const total = overrides.total ?? data.length;
  const page = overrides.page ?? 1;
  const pageSize = overrides.pageSize ?? 12;
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      ...overrides,
    },
  };
}
