import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getCurrentUser } from '@/lib/auth-utils';
import {
  createRecipeSchema,
  recipeFilterSchema,
} from '@/lib/validations/recipe';
import {
  apiReadLimiter,
  apiWriteLimiter,
  checkRateLimit,
} from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';
import { sanitizeText } from '@/lib/sanitize';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const rateLimitResponse = checkRateLimit(apiReadLimiter, currentUser.id);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = recipeFilterSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid filters' },
      { status: 400 }
    );
  }

  const {
    page,
    limit,
    search,
    cuisine,
    difficulty,
    maxPrepTime,
    maxCookTime,
    dietary,
    minRating,
    sort,
    visibility,
  } = parsed.data;

  // Build where clause
  const where: Prisma.RecipeWhereInput = {};

  // Visibility filter
  if (currentUser) {
    if (visibility) {
      // If a specific visibility is requested, only show user's own recipes with that visibility
      where.authorId = currentUser.id;
      where.visibility = visibility;
    } else {
      // Show user's own recipes + public recipes
      where.OR = [{ authorId: currentUser.id }, { visibility: 'PUBLIC' }];
    }
  } else {
    // Unauthenticated: only public recipes
    where.visibility = 'PUBLIC';
  }

  // Search filter
  if (search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  // Additional filters
  if (cuisine) {
    where.cuisineType = { equals: cuisine, mode: 'insensitive' };
  }
  if (difficulty) {
    where.difficulty = difficulty;
  }
  if (maxPrepTime) {
    where.prepTime = { lte: maxPrepTime };
  }
  if (maxCookTime) {
    where.cookTime = { lte: maxCookTime };
  }
  if (minRating) {
    where.avgRating = { gte: minRating };
  }
  if (dietary && dietary.length > 0) {
    where.dietaryTags = {
      some: {
        dietaryTagId: { in: dietary },
      },
    };
  }

  // Build orderBy
  let orderBy: Prisma.RecipeOrderByWithRelationInput;
  switch (sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'rating':
      orderBy = { avgRating: { sort: 'desc', nulls: 'last' } };
      break;
    case 'prepTime':
      orderBy = { prepTime: { sort: 'asc', nulls: 'last' } };
      break;
    case 'title':
      orderBy = { name: 'asc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  const skip = (page - 1) * limit;

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        dietaryTags: {
          select: {
            dietaryTag: {
              select: { id: true, name: true },
            },
          },
        },
        ...(currentUser
          ? {
              userTags: {
                where: { userId: currentUser.id },
                select: { status: true },
              },
              savedBy: {
                where: { userId: currentUser.id },
                select: { id: true },
              },
            }
          : {}),
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  // Transform the response
  type RecipeRow = (typeof recipes)[number];
  const data = recipes.map((recipe: RecipeRow) => {
    const { images, dietaryTags, savedBy, ...rest } = recipe as RecipeRow & {
      savedBy?: { id: string }[];
    };
    type DietaryTagRow = (typeof dietaryTags)[number];
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      primaryImage: images[0] ? { url: images[0].url } : null,
      dietaryTags: dietaryTags.map((dt: DietaryTagRow) => dt.dietaryTag),
      ...(savedBy !== undefined ? { isSaved: savedBy.length > 0 } : {}),
    };
  });

  return NextResponse.json(
    {
      data,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: { 'Cache-Control': 'private, no-cache' },
    }
  );
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.RECIPE);
  if (sizeResponse) return sizeResponse;

  const contentTypeError = validateContentType(request);
  if (contentTypeError) return contentTypeError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = createRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { name, description, cuisineType, ingredients, steps, ...rest } =
    parsed.data;
  const sanitizedData = {
    ...rest,
    name: sanitizeText(name),
    description: sanitizeText(description),
    cuisineType: sanitizeText(cuisineType),
    ingredients: ingredients.map((ing) => ({
      ...ing,
      name: sanitizeText(ing.name),
      notes: ing.notes ? sanitizeText(ing.notes) : undefined,
    })),
    steps: steps.map((s) => ({
      ...s,
      instruction: sanitizeText(s.instruction),
    })),
  };

  const {
    name: sanitizedName,
    description: sanitizedDescription,
    prepTime,
    cookTime,
    servings,
    difficulty,
    cuisineType: sanitizedCuisineType,
    visibility,
    ingredients: sanitizedIngredients,
    steps: sanitizedSteps,
    dietaryTagIds,
    images,
  } = sanitizedData;

  const recipeId = await prisma.$transaction(async (tx) => {
    // 1. Create the recipe record
    const created = await tx.recipe.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        prepTime,
        cookTime,
        servings,
        difficulty,
        cuisineType: sanitizedCuisineType,
        visibility,
        authorId: session.user.id,
      },
      select: { id: true },
    });

    // 2. Batch ingredient handling: pre-fetch existing, create missing, then link
    const ingredientNames = sanitizedIngredients.map((ing) =>
      ing.name.toLowerCase().trim()
    );
    const existingIngredients = await tx.ingredient.findMany({
      where: { name: { in: ingredientNames } },
    });
    const existingMap = new Map(existingIngredients.map((i) => [i.name, i.id]));

    const missingNames = ingredientNames.filter((n) => !existingMap.has(n));
    if (missingNames.length > 0) {
      await tx.ingredient.createMany({
        data: missingNames.map((n) => ({ name: n })),
        skipDuplicates: true,
      });
      const newIngredients = await tx.ingredient.findMany({
        where: { name: { in: missingNames } },
      });
      newIngredients.forEach((i) => existingMap.set(i.name, i.id));
    }

    await tx.recipeIngredient.createMany({
      data: sanitizedIngredients.map((ing) => ({
        recipeId: created.id,
        ingredientId: existingMap.get(ing.name.toLowerCase().trim())!,
        quantity: ing.quantity || null,
        notes: ing.notes || null,
        order: ing.order,
      })),
    });

    // 3. Create steps
    if (sanitizedSteps.length > 0) {
      await tx.recipeStep.createMany({
        data: sanitizedSteps.map((s) => ({
          recipeId: created.id,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          duration: s.duration ?? null,
        })),
      });
    }

    // 4. Create images
    if (images.length > 0) {
      await tx.recipeImage.createMany({
        data: images.map((img) => ({
          recipeId: created.id,
          url: img.url,
          source: img.source,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      });
    }

    // 5. Create dietary tag associations
    if (dietaryTagIds.length > 0) {
      const validTags = await tx.dietaryTag.findMany({
        where: { id: { in: dietaryTagIds } },
        select: { id: true },
      });
      if (validTags.length > 0) {
        await tx.recipeDietaryTag.createMany({
          data: validTags.map((tag) => ({
            recipeId: created.id,
            dietaryTagId: tag.id,
          })),
        });
      }
    }

    return created.id;
  });

  // Re-fetch the complete recipe with all relations
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipeId },
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

  const primaryImage =
    recipe.images.find((img) => img.isPrimary) ?? recipe.images[0] ?? null;

  const response = {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    primaryImage: primaryImage ? { url: primaryImage.url } : null,
    dietaryTags: recipe.dietaryTags.map(
      (dt: (typeof recipe.dietaryTags)[number]) => dt.dietaryTag
    ),
    ingredients: recipe.ingredients.map(
      (ri: (typeof recipe.ingredients)[number]) => ({
        id: ri.id,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        notes: ri.notes,
        order: ri.order,
      })
    ),
  };

  return NextResponse.json(response, { status: 201 });
}
