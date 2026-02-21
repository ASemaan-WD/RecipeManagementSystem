import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { generateUploadSignature } from '@/lib/cloudinary';

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const signatureData = generateUploadSignature();

  return NextResponse.json(signatureData);
}
