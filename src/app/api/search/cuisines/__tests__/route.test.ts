import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/search/cuisines/route';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    recipe: { findMany: vi.fn() },
  },
}));

const mockFindMany = vi.mocked(prisma.recipe.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/search/cuisines', () => {
  it('returns distinct cuisine types from public recipes', async () => {
    mockFindMany.mockResolvedValueOnce([
      { cuisineType: 'Italian' },
      { cuisineType: 'Mexican' },
      { cuisineType: 'Thai' },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(['Italian', 'Mexican', 'Thai']);

    expect(mockFindMany).toHaveBeenCalledWith({
      distinct: ['cuisineType'],
      select: { cuisineType: true },
      where: {
        visibility: 'PUBLIC',
        cuisineType: { not: null },
      },
      orderBy: { cuisineType: 'asc' },
    });
  });

  it('returns empty array when no cuisine types exist', async () => {
    mockFindMany.mockResolvedValueOnce([] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});
