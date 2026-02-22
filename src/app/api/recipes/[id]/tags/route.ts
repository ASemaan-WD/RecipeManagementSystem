import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { addTagSchema, removeTagSchema } from '@/lib/validations/tags';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.DEFAULT);
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

  const parsed = addTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // Upsert tag — idempotent: creates if new, returns existing if duplicate
  const tag = await prisma.userRecipeTag.upsert({
    where: {
      userId_recipeId_status: { userId, recipeId: id, status },
    },
    create: { userId, recipeId: id, status },
    update: {},
  });

  return NextResponse.json(tag);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const userId = authResult.user.id;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.DEFAULT);
  if (sizeResponse) return sizeResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = removeTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Idempotent delete — succeeds even if tag doesn't exist
  await prisma.userRecipeTag.deleteMany({
    where: { userId, recipeId: id, status },
  });

  return NextResponse.json({ success: true });
}
