import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { canViewRecipe, getCurrentUser, requireAuth } from '@/lib/auth-utils';
import { createRatingSchema } from '@/lib/validations/social';
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Verify recipe exists and user can view it
  const viewResult = await canViewRecipe(id);
  if (viewResult instanceof NextResponse) return viewResult;

  const { recipe } = viewResult;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const rateLimitResponse = checkRateLimit(apiReadLimiter, currentUser.id);
    if (rateLimitResponse) return rateLimitResponse;
  }

  let userRating: number | null = null;

  if (currentUser) {
    const rating = await prisma.rating.findUnique({
      where: {
        userId_recipeId: { userId: currentUser.id, recipeId: id },
      },
      select: { value: true },
    });
    userRating = rating?.value ?? null;
  }

  return NextResponse.json(
    {
      avgRating: recipe.avgRating,
      ratingCount: recipe.ratingCount,
      userRating,
    },
    {
      headers: { 'Cache-Control': 'private, no-cache' },
    }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.DEFAULT);
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

  const parsed = createRatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { value } = parsed.data;

  // Verify recipe exists and user can view it
  const viewResult = await canViewRecipe(id);
  if (viewResult instanceof NextResponse) return viewResult;

  const { recipe } = viewResult;

  // Cannot rate own recipe
  if (recipe.authorId === userId) {
    return NextResponse.json(
      { error: 'Cannot rate your own recipe' },
      { status: 403 }
    );
  }

  // Upsert rating and recalculate stats
  await prisma.rating.upsert({
    where: {
      userId_recipeId: { userId, recipeId: id },
    },
    create: { userId, recipeId: id, value },
    update: { value },
  });

  const stats = await prisma.rating.aggregate({
    where: { recipeId: id },
    _avg: { value: true },
    _count: true,
  });

  const avgRating = stats._avg.value
    ? Math.round(stats._avg.value * 10) / 10
    : null;
  const ratingCount = stats._count;

  await prisma.recipe.update({
    where: { id },
    data: { avgRating, ratingCount },
  });

  return NextResponse.json({
    avgRating,
    ratingCount,
    userRating: value,
  });
}
