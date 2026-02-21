import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { collectionFilterSchema } from '@/lib/validations/tags';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;
  const userId = session.user.id;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = collectionFilterSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid filters' },
      { status: 400 }
    );
  }

  const { tab, page, limit, sort } = parsed.data;

  // Build tab-specific where clause
  let where: Prisma.RecipeWhereInput;

  switch (tab) {
    case 'favorites':
      where = { userTags: { some: { userId, status: 'FAVORITE' } } };
      break;
    case 'to-try':
      where = { userTags: { some: { userId, status: 'TO_TRY' } } };
      break;
    case 'made-before':
      where = { userTags: { some: { userId, status: 'MADE_BEFORE' } } };
      break;
    case 'saved':
      where = { savedBy: { some: { userId } } };
      break;
    case 'all':
    default:
      where = {
        OR: [
          { userTags: { some: { userId } } },
          { savedBy: { some: { userId } } },
        ],
      };
      break;
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
    case 'title':
      orderBy = { name: 'asc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  const skip = (page - 1) * limit;

  // Run data query, total count, and all 5 tab counts in parallel
  const [
    recipes,
    total,
    allCount,
    favoritesCount,
    toTryCount,
    madeBeforeCount,
    savedCount,
  ] = await Promise.all([
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
        userTags: {
          where: { userId },
          select: { status: true },
        },
        savedBy: {
          where: { userId },
          select: { id: true },
        },
      },
    }),
    prisma.recipe.count({ where }),
    prisma.recipe.count({
      where: {
        OR: [
          { userTags: { some: { userId } } },
          { savedBy: { some: { userId } } },
        ],
      },
    }),
    prisma.recipe.count({
      where: { userTags: { some: { userId, status: 'FAVORITE' } } },
    }),
    prisma.recipe.count({
      where: { userTags: { some: { userId, status: 'TO_TRY' } } },
    }),
    prisma.recipe.count({
      where: { userTags: { some: { userId, status: 'MADE_BEFORE' } } },
    }),
    prisma.recipe.count({
      where: { savedBy: { some: { userId } } },
    }),
  ]);

  // Transform the response
  const data = recipes.map((recipe) => {
    const { images, dietaryTags, savedBy, ...rest } = recipe;
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      primaryImage: images[0] ? { url: images[0].url } : null,
      dietaryTags: dietaryTags.map((dt) => dt.dietaryTag),
      isSaved: savedBy.length > 0,
    };
  });

  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
    counts: {
      all: allCount,
      favorites: favoritesCount,
      toTry: toTryCount,
      madeBefore: madeBeforeCount,
      saved: savedCount,
    },
  });
}
