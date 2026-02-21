import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { userSearchSchema } from '@/lib/validations/sharing';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.user.id;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = userSearchSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { q } = parsed.data;

  const users = await prisma.user.findMany({
    where: {
      username: { startsWith: q },
      id: { not: userId },
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    take: 10,
    orderBy: { username: 'asc' },
  });

  return NextResponse.json({ data: users });
}
