import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { addFromRecipeSchema } from '@/lib/validations/shopping-list';
import { aggregateIngredients } from '@/lib/ingredient-aggregation';

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

  const parsed = addFromRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: parsed.data.recipeId },
    include: {
      ingredients: {
        include: { ingredient: { select: { name: true } } },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const rawIngredients = recipe.ingredients.map((ri) => ({
    name: ri.ingredient.name,
    quantity: ri.quantity,
  }));

  const aggregated = aggregateIngredients(rawIngredients);
  const startOrder = list._count.items;

  const items = await prisma.$transaction(
    aggregated.map((item, index) =>
      prisma.shoppingListItem.create({
        data: {
          shoppingListId: id,
          ingredientName: item.ingredientName,
          quantity: item.quantity,
          category: item.category,
          order: startOrder + index,
        },
      })
    )
  );

  return NextResponse.json({ items }, { status: 201 });
}
