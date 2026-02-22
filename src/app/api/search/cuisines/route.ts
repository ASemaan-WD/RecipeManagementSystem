import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const results = await prisma.recipe.findMany({
    distinct: ['cuisineType'],
    select: { cuisineType: true },
    where: {
      visibility: 'PUBLIC',
      cuisineType: { not: null },
    },
    orderBy: { cuisineType: 'asc' },
  });

  const data = results
    .map((r) => r.cuisineType)
    .filter((v): v is string => v !== null);

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    }
  );
}
