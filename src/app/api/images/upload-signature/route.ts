import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { generateUploadSignature } from '@/lib/cloudinary';
import { apiWriteLimiter, checkRateLimit } from '@/lib/rate-limit';

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const rateLimitResponse = checkRateLimit(apiWriteLimiter, authResult.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const signatureData = generateUploadSignature();

  return NextResponse.json(signatureData);
}
