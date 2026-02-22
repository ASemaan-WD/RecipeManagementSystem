import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { apiReadLimiter, checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: { id: true, isActive: true, recipeId: true },
  });

  if (!shareLink || !shareLink.isActive) {
    return NextResponse.json(
      { error: 'Share link not found or inactive' },
      { status: 404 }
    );
  }

  const currentUser = await getCurrentUser();

  if (currentUser) {
    const rateLimitResponse = checkRateLimit(apiReadLimiter, currentUser.id);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // Summary-only select for all users (guest and authenticated)
  const recipe = await prisma.recipe.findUnique({
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

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const primaryImage =
    recipe.images.find((img) => img.isPrimary) ?? recipe.images[0] ?? null;

  const response = {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    primaryImage: primaryImage ? { url: primaryImage.url } : null,
    dietaryTags: recipe.dietaryTags.map((dt) => dt.dietaryTag),
    ingredients: recipe.ingredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      notes: ri.notes,
      order: ri.order,
    })),
    isAuthenticated: !!currentUser,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
    },
  });
}
