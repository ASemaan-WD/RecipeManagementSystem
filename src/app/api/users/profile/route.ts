import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { updateProfileSchema } from '@/lib/validations/profile';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';
import { sanitizeText } from '@/lib/sanitize';

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

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

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const sanitizedName = sanitizeText(parsed.data.name);

  const data: { name: string; image?: string | null } = {
    name: sanitizedName,
  };

  // Empty string means remove avatar, non-empty means set URL, undefined means skip
  if (parsed.data.image !== undefined) {
    data.image = parsed.data.image === '' ? null : parsed.data.image;
  }

  const updated = await prisma.user.update({
    where: { id: authResult.user.id },
    data,
    select: { id: true, name: true, email: true, username: true, image: true },
  });

  return NextResponse.json(updated);
}
