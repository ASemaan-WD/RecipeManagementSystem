import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { addItemSchema } from '@/lib/validations/shopping-list';
import { categorizeIngredient } from '@/lib/ingredient-categories';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;
  const { id } = await params;

  const list = await prisma.shoppingList.findUnique({
    where: { id },
    select: { userId: true, _count: { select: { items: true } } },
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

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { ingredientName, quantity, category } = parsed.data;

  const item = await prisma.shoppingListItem.create({
    data: {
      shoppingListId: id,
      ingredientName,
      quantity: quantity ?? null,
      category: category ?? categorizeIngredient(ingredientName),
      order: list._count.items,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
