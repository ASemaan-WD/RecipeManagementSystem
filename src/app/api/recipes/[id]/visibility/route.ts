import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { updateVisibilitySchema } from '@/lib/validations/sharing';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import { checkContentLength, BODY_LIMITS } from '@/lib/api-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const rateLimitResponse = checkRateLimit(
    apiWriteLimiter,
    ownerResult.session.user.id
  );
  if (rateLimitResponse) return rateLimitResponse;

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

  const parsed = updateVisibilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { visibility } = parsed.data;

  const updated = await prisma.recipe.update({
    where: { id },
    data: { visibility },
    select: { id: true, visibility: true },
  });

  return NextResponse.json(updated);
}
