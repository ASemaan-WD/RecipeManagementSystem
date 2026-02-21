import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import {
  createCommentSchema,
  commentListSchema,
} from '@/lib/validations/social';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Strip HTML tags to prevent XSS */
function sanitizeContent(content: string): string {
  return content.replace(/<[^>]*>/g, '');
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

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

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

  return NextResponse.json({
    data: comments,
    pagination: {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const userId = authResult.user.id;

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

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const sanitized = sanitizeContent(parsed.data.content);

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
