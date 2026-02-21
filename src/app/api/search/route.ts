import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { searchFilterSchema } from '@/lib/validations/search';
import {
  buildTsQueryString,
  buildSearchWhereClause,
  buildSearchOrderBy,
} from '@/lib/search';

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = searchFilterSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid filters' },
      { status: 400 }
    );
  }

  const params = parsed.data;
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const hasSearchQuery = !!params.q?.trim();
  const where = buildSearchWhereClause(params, currentUser?.id);
  const orderBy = buildSearchOrderBy(params.sort, hasSearchQuery);

  // When a text query is provided, use PostgreSQL full-text search
  if (hasSearchQuery) {
    const tsQueryString = buildTsQueryString(params.q!);

    if (!tsQueryString) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, pageSize: limit, totalPages: 0 },
      });
    }

    try {
      // Build visibility SQL fragment
      const visibilitySql = currentUser
        ? Prisma.sql`("authorId" = ${currentUser.id} OR "visibility" = 'PUBLIC')`
        : Prisma.sql`("visibility" = 'PUBLIC')`;

      // Pass 1: Raw SQL to get matching IDs with relevance ranks
      const ftsResults = await prisma.$queryRaw<{ id: string; rank: number }[]>`
        SELECT "id", ts_rank("searchVector", to_tsquery('english', ${tsQueryString})) AS "rank"
        FROM "Recipe"
        WHERE "searchVector" @@ to_tsquery('english', ${tsQueryString})
          AND ${visibilitySql}
        ORDER BY "rank" DESC
      `;

      if (ftsResults.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, page, pageSize: limit, totalPages: 0 },
        });
      }

      // Get all matching IDs and apply pagination
      const matchingIds = ftsResults.map((r) => r.id);
      const total = matchingIds.length;
      const paginatedIds = matchingIds.slice(skip, skip + limit);

      if (paginatedIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      // Build rank map for re-sorting
      const rankMap = new Map(ftsResults.map((r) => [r.id, r.rank]));

      // Merge FTS IDs with non-FTS filters
      const combinedWhere: Prisma.RecipeWhereInput = {
        ...where,
        id: { in: paginatedIds },
      };

      // Pass 2: Prisma query for full data with relations
      const recipes = await prisma.recipe.findMany({
        where: combinedWhere,
        select: buildLeanSelect(currentUser?.id),
      });

      // Re-sort by relevance rank (or specified sort)
      let sortedRecipes;
      if (orderBy === null) {
        // Sort by relevance
        sortedRecipes = recipes.sort((a, b) => {
          const rankA = rankMap.get(a.id) ?? 0;
          const rankB = rankMap.get(b.id) ?? 0;
          return rankB - rankA;
        });
      } else {
        sortedRecipes = recipes;
      }

      const data = transformRecipes(sortedRecipes);

      return NextResponse.json({
        data,
        pagination: {
          total,
          page,
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch {
      // tsquery parse errors or other SQL issues — return empty results
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, pageSize: limit, totalPages: 0 },
      });
    }
  }

  // No text query — standard Prisma query with filters
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: orderBy ?? { createdAt: 'desc' },
      skip,
      take: limit,
      select: buildLeanSelect(currentUser?.id),
    }),
    prisma.recipe.count({ where }),
  ]);

  const data = transformRecipes(recipes);

  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── Helpers ───

function buildLeanSelect(userId?: string) {
  return {
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
    ...(userId
      ? {
          userTags: {
            where: { userId },
            select: { status: true },
          },
          savedBy: {
            where: { userId },
            select: { id: true },
          },
        }
      : {}),
  } as const;
}

type LeanRecipe = Awaited<
  ReturnType<
    typeof prisma.recipe.findMany<{
      select: ReturnType<typeof buildLeanSelect>;
    }>
  >
>[number];

function transformRecipes(recipes: LeanRecipe[]) {
  return recipes.map((recipe) => {
    const { images, dietaryTags, savedBy, ...rest } =
      recipe as typeof recipe & {
        savedBy?: { id: string }[];
      };
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      primaryImage: images[0] ? { url: images[0].url } : null,
      dietaryTags: dietaryTags.map((dt) => dt.dietaryTag),
      ...(savedBy !== undefined ? { isSaved: savedBy.length > 0 } : {}),
    };
  });
}
