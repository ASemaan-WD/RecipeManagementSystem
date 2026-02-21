import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { RecipeHero } from '@/components/recipes/recipe-detail/recipe-hero';
import { RecipeMetadata } from '@/components/recipes/recipe-detail/recipe-metadata';
import { RecipeIngredients } from '@/components/recipes/recipe-detail/recipe-ingredients';
import { RecipeSteps } from '@/components/recipes/recipe-detail/recipe-steps';
import { RecipeImages } from '@/components/recipes/recipe-detail/recipe-images';
import { NutritionSection } from '@/components/recipes/recipe-detail/nutrition-section';
import { LoginPrompt } from '@/components/shared/login-prompt';
import { Badge } from '@/components/ui/badge';
import type { RecipeDetail } from '@/types/recipe';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      isActive: true,
      recipe: { select: { name: true, description: true } },
    },
  });

  if (!shareLink || !shareLink.isActive) {
    return { title: 'Share Link Not Found' };
  }

  return {
    title: `${shareLink.recipe.name} (Shared)`,
    description: shareLink.recipe.description ?? undefined,
  };
}

export default async function ShareTokenPage({ params }: PageProps) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: { id: true, isActive: true, recipeId: true },
  });

  if (!shareLink || !shareLink.isActive) {
    notFound();
  }

  const rawRecipe = await prisma.recipe.findUnique({
    where: { id: shareLink.recipeId },
    select: {
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
        orderBy: { order: 'asc' },
        select: {
          id: true,
          url: true,
          source: true,
          isPrimary: true,
          order: true,
        },
      },
      ingredients: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          quantity: true,
          notes: true,
          order: true,
          ingredient: { select: { name: true } },
        },
      },
      steps: {
        orderBy: { stepNumber: 'asc' },
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
    },
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
  const isAuthenticated = !!currentUser;

  return (
    <div className="space-y-8">
      <RecipeHero images={recipe.images} recipeName={recipe.name} />

      <div className="space-y-6">
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

        <RecipeMetadata recipe={recipe} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RecipeIngredients ingredients={recipe.ingredients} />
          </div>
          <div className="lg:col-span-2">
            <RecipeSteps steps={recipe.steps} />
          </div>
        </div>

        <RecipeImages images={recipe.images} />

        <NutritionSection nutritionData={recipe.nutritionData} />

        {!isAuthenticated && (
          <LoginPrompt
            message="Sign in to rate, comment, and save this recipe to your collection."
            variant="inline"
          />
        )}
      </div>
    </div>
  );
}
