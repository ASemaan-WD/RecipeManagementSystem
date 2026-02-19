import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { requireAuth } from '@/lib/auth-utils';
import { usernameSchema } from '@/lib/validations/auth';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username query parameter is required' },
      { status: 400 }
    );
  }

  const result = usernameSchema.safeParse(username);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'Invalid username' },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { username: result.data },
    select: { id: true },
  });

  return NextResponse.json({ available: !existingUser });
}

export async function POST(request: NextRequest) {
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

  const parsed = usernameSchema.safeParse(
    (body as Record<string, unknown>)?.username
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid username' },
      { status: 400 }
    );
  }

  const username = parsed.data;

  // Immutability guard: check that user hasn't already set a username
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (currentUser?.username) {
    return NextResponse.json(
      { error: 'Username already set and cannot be changed' },
      { status: 400 }
    );
  }

  // Availability check
  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: 'Username is already taken' },
      { status: 409 }
    );
  }

  // Set username with unique constraint as safety net for race conditions
  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { username: true },
    });

    return NextResponse.json({ username: updatedUser.username });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }
    throw error;
  }
}
