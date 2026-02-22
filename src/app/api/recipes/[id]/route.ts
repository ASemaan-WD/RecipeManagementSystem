import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import {
  requireRecipeOwner,
  canViewRecipe,
  getCurrentUser,
} from '@/lib/auth-utils';
import { updateRecipeSchema } from '@/lib/validations/recipe';
import {
  apiReadLimiter,
  apiWriteLimiter,
  checkRateLimit,
} from '@/lib/rate-limit';
import { checkContentLength, BODY_LIMITS } from '@/lib/api-utils';
import {
  fetchRecipeDetail,
  type RecipeDetailRaw,
} from '@/lib/queries/recipe-select';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function transformRecipeDetail(
  recipe: RecipeDetailRaw,
  extras?: { userTags?: { status: string }[]; isSaved?: boolean }
) {
  const primaryImage =
    recipe.images.find((img) => img.isPrimary) ?? recipe.images[0] ?? null;

  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    cuisineType: recipe.cuisineType,
    visibility: recipe.visibility,
    avgRating: recipe.avgRating,
    ratingCount: recipe.ratingCount,
    nutritionData: recipe.nutritionData as Record<string, unknown> | null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    author: recipe.author,
    primaryImage: primaryImage ? { url: primaryImage.url } : null,
    images: recipe.images,
    dietaryTags: recipe.dietaryTags.map((dt) => dt.dietaryTag),
    ingredients: recipe.ingredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      notes: ri.notes,
      order: ri.order,
    })),
    steps: recipe.steps,
    ...extras,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const shareToken = request.nextUrl.searchParams.get('token') ?? undefined;

  const viewResult = await canViewRecipe(id, shareToken);
  if (viewResult instanceof NextResponse) return viewResult;

  const recipe = await fetchRecipeDetail(id);

  // Fetch user-specific data if authenticated
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const rateLimitResponse = checkRateLimit(apiReadLimiter, currentUser.id);
    if (rateLimitResponse) return rateLimitResponse;
  }

  let extras: { userTags?: { status: string }[]; isSaved?: boolean } = {};

  if (currentUser) {
    const [userTags, savedRecord] = await Promise.all([
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
    ]);
    extras = {
      userTags: userTags.map((t) => ({ status: t.status })),
      isSaved: !!savedRecord,
    };
  }

  return NextResponse.json(transformRecipeDetail(recipe, extras), {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
    },
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const rateLimitResponse = checkRateLimit(
    apiWriteLimiter,
    ownerResult.session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.RECIPE);
  if (sizeResponse) return sizeResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = updateRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { ingredients, steps, images, dietaryTagIds, ...recipeFields } =
    parsed.data;

  await prisma.$transaction(async (tx) => {
    // Update recipe scalar fields
    if (Object.keys(recipeFields).length > 0) {
      await tx.recipe.update({
        where: { id },
        data: recipeFields,
      });
    }

    // Replace ingredients if provided
    if (ingredients !== undefined) {
      // Clear cached nutrition data since ingredients changed
      await tx.recipe.update({
        where: { id },
        data: { nutritionData: Prisma.DbNull },
      });

      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });

      // Batch ingredient handling: pre-fetch existing, create missing, then link
      const ingredientNames = ingredients.map((ing) =>
        ing.name.toLowerCase().trim()
      );
      const existingIngredients = await tx.ingredient.findMany({
        where: { name: { in: ingredientNames } },
      });
      const existingMap = new Map(
        existingIngredients.map((i) => [i.name, i.id])
      );

      const missingNames = ingredientNames.filter(
        (name) => !existingMap.has(name)
      );
      if (missingNames.length > 0) {
        await tx.ingredient.createMany({
          data: missingNames.map((name) => ({ name })),
          skipDuplicates: true,
        });
        const newIngredients = await tx.ingredient.findMany({
          where: { name: { in: missingNames } },
        });
        newIngredients.forEach((i) => existingMap.set(i.name, i.id));
      }

      await tx.recipeIngredient.createMany({
        data: ingredients.map((ing) => ({
          recipeId: id,
          ingredientId: existingMap.get(ing.name.toLowerCase().trim())!,
          quantity: ing.quantity || null,
          notes: ing.notes || null,
          order: ing.order,
        })),
      });
    }

    // Replace steps if provided
    if (steps !== undefined) {
      await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      if (steps.length > 0) {
        await tx.recipeStep.createMany({
          data: steps.map((s) => ({
            recipeId: id,
            stepNumber: s.stepNumber,
            instruction: s.instruction,
            duration: s.duration ?? null,
          })),
        });
      }
    }

    // Replace images if provided
    if (images !== undefined) {
      await tx.recipeImage.deleteMany({ where: { recipeId: id } });
      if (images.length > 0) {
        await tx.recipeImage.createMany({
          data: images.map((img) => ({
            recipeId: id,
            url: img.url,
            source: img.source,
            isPrimary: img.isPrimary,
            order: img.order,
          })),
        });
      }
    }

    // Replace dietary tags if provided
    if (dietaryTagIds !== undefined) {
      await tx.recipeDietaryTag.deleteMany({ where: { recipeId: id } });
      if (dietaryTagIds.length > 0) {
        const validTags = await tx.dietaryTag.findMany({
          where: { id: { in: dietaryTagIds } },
          select: { id: true },
        });
        if (validTags.length > 0) {
          await tx.recipeDietaryTag.createMany({
            data: validTags.map((tag) => ({
              recipeId: id,
              dietaryTagId: tag.id,
            })),
          });
        }
      }
    }
  });

  // Re-fetch the updated recipe
  const recipe = await fetchRecipeDetail(id);
  return NextResponse.json(transformRecipeDetail(recipe));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const rateLimitResponse = checkRateLimit(
    apiWriteLimiter,
    ownerResult.session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

  await prisma.recipe.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
