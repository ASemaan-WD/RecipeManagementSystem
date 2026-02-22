import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const data = await prisma.dietaryTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    }
  );
}
