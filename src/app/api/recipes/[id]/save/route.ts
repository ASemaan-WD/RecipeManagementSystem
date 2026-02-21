import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const userId = authResult.user.id;

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // Upsert save — idempotent: creates if new, returns existing if duplicate
  const saved = await prisma.savedRecipe.upsert({
    where: {
      userId_recipeId: { userId, recipeId: id },
    },
    create: { userId, recipeId: id },
    update: {},
  });

  return NextResponse.json(saved);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const userId = authResult.user.id;

  // Idempotent delete — succeeds even if not saved
  await prisma.savedRecipe.deleteMany({
    where: { userId, recipeId: id },
  });

  return NextResponse.json({ success: true });
}
