import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { addItemSchema } from '@/lib/validations/shopping-list';
import { categorizeIngredient } from '@/lib/ingredient-categories';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';
import { sanitizeText } from '@/lib/sanitize';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

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

  const sizeResponse = checkContentLength(request, BODY_LIMITS.SHOPPING_LIST);
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

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { ingredientName, quantity, category } = parsed.data;
  const sanitizedIngredientName = sanitizeText(ingredientName);

  const item = await prisma.shoppingListItem.create({
    data: {
      shoppingListId: id,
      ingredientName: sanitizedIngredientName,
      quantity: quantity ?? null,
      category: category ?? categorizeIngredient(sanitizedIngredientName),
      order: list._count.items,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
