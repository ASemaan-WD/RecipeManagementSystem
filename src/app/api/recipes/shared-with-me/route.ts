import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { apiReadLimiter, checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiReadLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = authResult.user.id;
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get('limit')) || 12)
  );
  const skip = (page - 1) * limit;

  const [shares, total] = await Promise.all([
    prisma.recipeShare.findMany({
      where: { userId },
      orderBy: { sharedAt: 'desc' },
      skip,
      take: limit,
      select: {
        sharedAt: true,
        recipe: {
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
              select: { id: true, name: true, username: true, image: true },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
            dietaryTags: {
              select: {
                dietaryTag: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.recipeShare.count({ where: { userId } }),
  ]);

  type ShareRow = (typeof shares)[number];
  const data = shares.map((share: ShareRow) => {
    const { images, dietaryTags, ...rest } = share.recipe;
    type DietaryTagRow = (typeof dietaryTags)[number];
    return {
      ...rest,
      createdAt: rest.createdAt.toISOString(),
      primaryImage: images[0] ? { url: images[0].url } : null,
      dietaryTags: dietaryTags.map((dt: DietaryTagRow) => dt.dietaryTag),
      sharedAt: share.sharedAt.toISOString(),
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
