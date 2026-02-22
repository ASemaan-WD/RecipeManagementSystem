import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateCommentSchema } from '@/lib/validations/social';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import { checkContentLength, BODY_LIMITS } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Strip HTML tags to prevent XSS */
function sanitizeContent(content: string): string {
  return content.replace(/<[^>]*>/g, '');
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Only the comment author can edit
  if (comment.userId !== userId) {
    return NextResponse.json(
      { error: 'You can only edit your own comments' },
      { status: 403 }
    );
  }

  const sizeResponse = checkContentLength(request, BODY_LIMITS.COMMENT);
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

  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const sanitized = sanitizeContent(parsed.data.content);

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: sanitized },
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

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      recipe: { select: { authorId: true } },
    },
  });

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Comment author or recipe author can delete
  const isCommentAuthor = comment.userId === userId;
  const isRecipeAuthor = comment.recipe.authorId === userId;

  if (!isCommentAuthor && !isRecipeAuthor) {
    return NextResponse.json(
      { error: 'Not authorized to delete this comment' },
      { status: 403 }
    );
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
