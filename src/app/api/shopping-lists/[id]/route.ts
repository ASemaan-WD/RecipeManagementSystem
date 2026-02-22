import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateShoppingListSchema } from '@/lib/validations/shopping-list';
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
import { sanitizeText } from '@/lib/sanitize';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const rateLimitResponse = checkRateLimit(apiReadLimiter, session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

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

  return NextResponse.json(
    {
      id: list.id,
      name: list.name,
      items: list.items,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    },
    {
      headers: { 'Cache-Control': 'private, no-cache' },
    }
  );
}

export async function PUT(request: Request, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

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

  const parsed = updateShoppingListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const sanitizedName = parsed.data.name
    ? sanitizeText(parsed.data.name)
    : undefined;

  const updated = await prisma.shoppingList.update({
    where: { id },
    data: { name: sanitizedName },
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

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

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
