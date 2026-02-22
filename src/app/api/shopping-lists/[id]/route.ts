import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateShoppingListSchema } from '@/lib/validations/shopping-list';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id } = await params;

  const list = await prisma.shoppingList.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: 'asc' } },
    },
  });

  if (!list) {
    return NextResponse.json(
      { error: 'Shopping list not found' },
      { status: 404 }
    );
  }

  if (list.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    id: list.id,
    name: list.name,
    items: list.items,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id } = await params;

  const list = await prisma.shoppingList.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!list) {
    return NextResponse.json(
      { error: 'Shopping list not found' },
      { status: 404 }
    );
  }

  if (list.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = updateShoppingListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const updated = await prisma.shoppingList.update({
    where: { id },
    data: { name: parsed.data.name },
    include: {
      items: { orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    items: updated.items,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id } = await params;

  const list = await prisma.shoppingList.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!list) {
    return NextResponse.json(
      { error: 'Shopping list not found' },
      { status: 404 }
    );
  }

  if (list.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.shoppingList.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
