import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { revokeShareLinkSchema } from '@/lib/validations/sharing';
import { Visibility } from '@/generated/prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const token = nanoid(21);

  const shareLink = await prisma.$transaction(async (tx) => {
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

    return tx.shareLink.create({
      data: { recipeId: id, token, isActive: true },
      select: { id: true, token: true, createdAt: true },
    });
  });

  return NextResponse.json(shareLink, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = revokeShareLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { linkId } = parsed.data;

  const existing = await prisma.shareLink.findFirst({
    where: { id: linkId, recipeId: id, isActive: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Share link not found or already revoked' },
      { status: 404 }
    );
  }

  await prisma.shareLink.update({
    where: { id: linkId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
