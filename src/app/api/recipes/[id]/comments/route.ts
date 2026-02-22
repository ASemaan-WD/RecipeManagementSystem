import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { canViewRecipe, requireAuth } from '@/lib/auth-utils';
import {
  createCommentSchema,
  commentListSchema,
} from '@/lib/validations/social';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';
import { sanitizeText } from '@/lib/sanitize';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = commentListSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  // Verify recipe exists and user can view it
  const viewResult = await canViewRecipe(id);
  if (viewResult instanceof NextResponse) return viewResult;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { recipeId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    }),
    prisma.comment.count({ where: { recipeId: id } }),
  ]);

  return NextResponse.json(
    {
      data: comments,
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.COMMENT);
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

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  // Verify recipe exists and user can view it
  const viewResult = await canViewRecipe(id);
  if (viewResult instanceof NextResponse) return viewResult;

  const sanitized = sanitizeText(parsed.data.content);

  const comment = await prisma.comment.create({
    data: { recipeId: id, userId, content: sanitized },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
