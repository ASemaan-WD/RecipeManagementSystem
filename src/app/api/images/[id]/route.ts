import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // Find the image and check ownership via recipe
  const image = await prisma.recipeImage.findUnique({
    where: { id },
    include: {
      recipe: {
        select: { authorId: true },
      },
    },
  });

  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  if (image.recipe.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.recipeImage.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
