import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/search/dietary-tags/route';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    dietaryTag: { findMany: vi.fn() },
  },
}));

const mockFindMany = vi.mocked(prisma.dietaryTag.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/search/dietary-tags', () => {
  it('returns all dietary tags sorted by name', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 'dt-1', name: 'Dairy-Free' },
      { id: 'dt-2', name: 'Gluten-Free' },
      { id: 'dt-3', name: 'Vegetarian' },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([
      { id: 'dt-1', name: 'Dairy-Free' },
      { id: 'dt-2', name: 'Gluten-Free' },
      { id: 'dt-3', name: 'Vegetarian' },
    ]);

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });

  it('returns empty array when no dietary tags exist', async () => {
    mockFindMany.mockResolvedValueOnce([] as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});
