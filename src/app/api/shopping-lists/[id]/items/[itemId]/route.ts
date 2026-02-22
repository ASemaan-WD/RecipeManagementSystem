import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateItemSchema } from '@/lib/validations/shopping-list';

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id, itemId } = await params;

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

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { shoppingListId: true },
  });

  if (!item || item.shoppingListId !== id) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
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

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id, itemId } = await params;

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

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { shoppingListId: true },
  });

  if (!item || item.shoppingListId !== id) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  await prisma.shoppingListItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
