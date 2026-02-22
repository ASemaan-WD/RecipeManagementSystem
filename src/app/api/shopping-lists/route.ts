import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { createShoppingListSchema } from '@/lib/validations/shopping-list';
import { aggregateIngredients } from '@/lib/ingredient-aggregation';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const lists = await prisma.shoppingList.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: { select: { checked: true } },
    },
  });

  const data = lists.map((list) => ({
    id: list.id,
    name: list.name,
    itemCount: list._count.items,
    checkedCount: list.items.filter((i) => i.checked).length,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  }));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = createShoppingListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { name, recipeIds } = parsed.data;

  // If recipeIds provided, fetch and aggregate ingredients
  let itemsData: {
    ingredientName: string;
    quantity: string | null;
    category: string;
    order: number;
  }[] = [];

  if (recipeIds && recipeIds.length > 0) {
    const recipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: {
        ingredients: {
          include: { ingredient: { select: { name: true } } },
        },
      },
    });

    const rawIngredients = recipes.flatMap((recipe) =>
      recipe.ingredients.map((ri) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
      }))
    );

    const aggregated = aggregateIngredients(rawIngredients);
    itemsData = aggregated.map((item, index) => ({
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      category: item.category,
      order: index,
    }));
  }

  const list = await prisma.shoppingList.create({
    data: {
      name,
      userId: session.user.id,
      items: {
        create: itemsData,
      },
    },
    include: {
      items: { orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json(
    {
      id: list.id,
      name: list.name,
      items: list.items,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
