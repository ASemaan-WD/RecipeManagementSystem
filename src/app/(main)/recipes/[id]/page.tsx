import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { canViewRecipe, getCurrentUser } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { RecipeHero } from '@/components/recipes/recipe-detail/recipe-hero';
import { RecipeMetadata } from '@/components/recipes/recipe-detail/recipe-metadata';
import { RecipeDetailClient } from '@/components/recipes/recipe-detail/recipe-detail-client';
import { AddToListButton } from '@/components/shopping/add-to-list-button';
import { RecipeImages } from '@/components/recipes/recipe-detail/recipe-images';
import { RecipeActions } from '@/components/recipes/recipe-detail/recipe-actions';
import { NutritionDisplay } from '@/components/ai/nutrition-display';
import { StarRating } from '@/components/social/star-rating';
import { CommentSection } from '@/components/social/comment-section';
import { TagToggles } from '@/components/recipes/tag-toggles';
import { SaveButton } from '@/components/recipes/save-button';
import { Badge } from '@/components/ui/badge';
import type { TagStatus } from '@/generated/prisma/client';
import type { RecipeDetail } from '@/types/recipe';

const RECIPE_DETAIL_SELECT = {
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

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!recipe) {
    return { title: 'Recipe Not Found' };
  }

  return {
    title: recipe.name,
    description: recipe.description ?? undefined,
  };
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  const viewResult = await canViewRecipe(id, token);
  if (viewResult instanceof NextResponse) {
    notFound();
  }

  const rawRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: RECIPE_DETAIL_SELECT,
  });

  if (!rawRecipe) {
    notFound();
  }

  const primaryImage =
    rawRecipe.images.find((img) => img.isPrimary) ??
    rawRecipe.images[0] ??
    null;

  const recipe: RecipeDetail = {
    id: rawRecipe.id,
    name: rawRecipe.name,
    description: rawRecipe.description,
    prepTime: rawRecipe.prepTime,
    cookTime: rawRecipe.cookTime,
    servings: rawRecipe.servings,
    difficulty: rawRecipe.difficulty,
    cuisineType: rawRecipe.cuisineType,
    visibility: rawRecipe.visibility,
    avgRating: rawRecipe.avgRating,
    ratingCount: rawRecipe.ratingCount,
    nutritionData: rawRecipe.nutritionData as Record<string, unknown> | null,
    createdAt: rawRecipe.createdAt.toISOString(),
    updatedAt: rawRecipe.updatedAt.toISOString(),
    author: rawRecipe.author,
    primaryImage: primaryImage ? { url: primaryImage.url } : null,
    images: rawRecipe.images,
    dietaryTags: rawRecipe.dietaryTags.map((dt) => dt.dietaryTag),
    ingredients: rawRecipe.ingredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      notes: ri.notes,
      order: ri.order,
    })),
    steps: rawRecipe.steps,
  };

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === rawRecipe.authorId;

  // Fetch user-specific tag/save data for authenticated users
  let userTagStatuses: TagStatus[] = [];
  let isRecipeSaved = false;

  let userRatingValue: number | null = null;

  if (currentUser) {
    const [userTags, savedRecord, userRating] = await Promise.all([
      prisma.userRecipeTag.findMany({
        where: { userId: currentUser.id, recipeId: id },
        select: { status: true },
      }),
      prisma.savedRecipe.findUnique({
        where: {
          userId_recipeId: { userId: currentUser.id, recipeId: id },
        },
        select: { id: true },
      }),
      prisma.rating.findUnique({
        where: {
          userId_recipeId: { userId: currentUser.id, recipeId: id },
        },
        select: { value: true },
      }),
    ]);
    userTagStatuses = userTags.map((t) => t.status);
    isRecipeSaved = !!savedRecord;
    userRatingValue = userRating?.value ?? null;
  }

  return (
    <div className="space-y-8">
      <RecipeHero images={recipe.images} recipeName={recipe.name} />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-muted-foreground max-w-2xl">
                {recipe.description}
              </p>
            )}
            {recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipe.dietaryTags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <RecipeActions
                recipeId={recipe.id}
                isOwner={isOwner}
                recipeName={recipe.name}
                currentVisibility={recipe.visibility}
              />
              {currentUser && (
                <AddToListButton
                  recipeId={recipe.id}
                  recipeName={recipe.name}
                />
              )}
            </div>
            {!isOwner && (
              <div className="flex items-center gap-1">
                <TagToggles
                  recipeId={recipe.id}
                  initialTags={userTagStatuses}
                  variant="full"
                  disabled={!currentUser}
                />
                <SaveButton
                  recipeId={recipe.id}
                  initialSaved={isRecipeSaved}
                  variant="full"
                  disabled={!currentUser}
                />
              </div>
            )}
          </div>
        </div>

        <StarRating
          recipeId={recipe.id}
          initialAvgRating={recipe.avgRating}
          initialRatingCount={recipe.ratingCount}
          initialUserRating={userRatingValue}
          isOwner={isOwner}
          isAuthenticated={!!currentUser}
        />

        <RecipeMetadata recipe={recipe} />

        <RecipeDetailClient recipe={recipe} isAuthenticated={!!currentUser} />

        <RecipeImages images={recipe.images} />

        <NutritionDisplay
          recipeId={recipe.id}
          initialNutritionData={recipe.nutritionData}
          isOwner={isOwner}
        />

        <CommentSection
          recipeId={recipe.id}
          recipeAuthorId={rawRecipe.authorId}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}
