import { prisma } from '@/lib/db';

/**
 * Shared Prisma select constant for recipe detail queries.
 * Used by both the API route and the server-side page component.
 */
export const RECIPE_DETAIL_SELECT = {
  id: true,
  name: true,
  description: true,
  prepTime: true,
  cookTime: true,
  servings: true,
  difficulty: true,
  cuisineType: true,
  visibility: true,
  avgRating: true,
  ratingCount: true,
  nutritionData: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, username: true, image: true },
  },
  images: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      url: true,
      source: true,
      isPrimary: true,
      order: true,
    },
  },
  ingredients: {
    orderBy: { order: 'asc' as const },
    select: {
      id: true,
      quantity: true,
      notes: true,
      order: true,
      ingredient: { select: { name: true } },
    },
  },
  steps: {
    orderBy: { stepNumber: 'asc' as const },
    select: {
      id: true,
      stepNumber: true,
      instruction: true,
      duration: true,
    },
  },
  dietaryTags: {
    select: {
      dietaryTag: { select: { id: true, name: true } },
    },
  },
} as const;

/** Return type for a recipe fetched with RECIPE_DETAIL_SELECT */
export type RecipeDetailRaw = Awaited<ReturnType<typeof fetchRecipeDetail>>;

/** Fetch a recipe with the full detail select */
export async function fetchRecipeDetail(id: string) {
  return prisma.recipe.findUniqueOrThrow({
    where: { id },
    select: RECIPE_DETAIL_SELECT,
  });
}
