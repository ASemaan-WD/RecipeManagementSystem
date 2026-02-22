import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import {
  shareByUsernameSchema,
  revokeShareSchema,
} from '@/lib/validations/sharing';
import { Visibility } from '@/generated/prisma/client';
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

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const rateLimitResponse = checkRateLimit(
    apiReadLimiter,
    ownerResult.session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

  const shares = await prisma.recipeShare.findMany({
    where: { recipeId: id },
    select: {
      id: true,
      sharedAt: true,
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { sharedAt: 'desc' },
  });

  const shareLinks = await prisma.shareLink.findMany({
    where: { recipeId: id, isActive: true },
    select: {
      id: true,
      token: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    { shares, shareLinks },
    {
      headers: { 'Cache-Control': 'private, no-cache' },
    }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const rateLimitResponse = checkRateLimit(
    apiWriteLimiter,
    ownerResult.session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

  const { session } = ownerResult;

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

  const parsed = shareByUsernameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { username } = parsed.data;

  // Look up target user by username
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Cannot share with self
  if (targetUser.id === session.user.id) {
    return NextResponse.json(
      { error: 'Cannot share a recipe with yourself' },
      { status: 400 }
    );
  }

  // Check for existing share
  const existingShare = await prisma.recipeShare.findUnique({
    where: {
      recipeId_userId: { recipeId: id, userId: targetUser.id },
    },
  });

  if (existingShare) {
    return NextResponse.json(
      { error: 'Recipe is already shared with this user' },
      { status: 409 }
    );
  }

  // Create share and auto-upgrade visibility if PRIVATE
  const share = await prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.findUnique({
      where: { id },
      select: { visibility: true },
    });

    if (recipe?.visibility === Visibility.PRIVATE) {
      await tx.recipe.update({
        where: { id },
        data: { visibility: Visibility.SHARED },
      });
    }

    return tx.recipeShare.create({
      data: { recipeId: id, userId: targetUser.id },
      select: {
        id: true,
        sharedAt: true,
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });
  });

  return NextResponse.json(share, { status: 201 });
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

  const sizeResponse = checkContentLength(request, BODY_LIMITS.DEFAULT);
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

  const parsed = revokeShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { userId } = parsed.data;

  const existing = await prisma.recipeShare.findUnique({
    where: {
      recipeId_userId: { recipeId: id, userId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  await prisma.recipeShare.delete({
    where: {
      recipeId_userId: { recipeId: id, userId },
    },
  });

  return NextResponse.json({ success: true });
}
