import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchQuery,
  buildTsQueryString,
  buildSearchWhereClause,
  buildSearchOrderBy,
} from '@/lib/search';
import type { SearchFilterInput } from '@/lib/validations/search';

describe('sanitizeSearchQuery', () => {
  it('strips tsquery special characters', () => {
    expect(sanitizeSearchQuery("chicken's & pasta | (hot)")).toBe(
      'chickens pasta hot'
    );
  });

  it('trims whitespace', () => {
    expect(sanitizeSearchQuery('  chicken  ')).toBe('chicken');
  });

  it('collapses multiple spaces to single space', () => {
    expect(sanitizeSearchQuery('chicken   pasta   sauce')).toBe(
      'chicken pasta sauce'
    );
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeSearchQuery('   ')).toBe('');
  });

  it('returns empty string for special-chars-only input', () => {
    expect(sanitizeSearchQuery('!&|():*\'"')).toBe('');
  });

  it('truncates to 200 characters', () => {
    const longQuery = 'a'.repeat(250);
    expect(sanitizeSearchQuery(longQuery)).toHaveLength(200);
  });
});

describe('buildTsQueryString', () => {
  it('returns prefix-match for a single word', () => {
    expect(buildTsQueryString('chicken')).toBe('chicken:*');
  });

  it('joins multiple words with & and prefix on last', () => {
    expect(buildTsQueryString('chicken pasta')).toBe('chicken & pasta:*');
  });

  it('handles three words', () => {
    expect(buildTsQueryString('spicy chicken soup')).toBe(
      'spicy & chicken & soup:*'
    );
  });

  it('returns empty string for empty input', () => {
    expect(buildTsQueryString('')).toBe('');
  });

  it('returns empty string for special-chars-only input', () => {
    expect(buildTsQueryString('!&|')).toBe('');
  });

  it('sanitizes special characters before building query', () => {
    expect(buildTsQueryString("chicken's pasta")).toBe('chickens & pasta:*');
  });
});

describe('buildSearchWhereClause', () => {
  const baseParams: SearchFilterInput = {
    sort: 'relevance',
    page: 1,
    limit: 12,
  };

  it('returns public-only for unauthenticated user', () => {
    const where = buildSearchWhereClause(baseParams);
    expect(where).toEqual({ visibility: 'PUBLIC' });
  });

  it('returns own + public for authenticated user', () => {
    const where = buildSearchWhereClause(baseParams, 'user-1');
    expect(where).toEqual({
      OR: [{ authorId: 'user-1' }, { visibility: 'PUBLIC' }],
    });
  });

  it('applies cuisine filter case-insensitively', () => {
    const where = buildSearchWhereClause(
      { ...baseParams, cuisine: 'Italian' },
      'user-1'
    );
    expect(where.cuisineType).toEqual({
      equals: 'Italian',
      mode: 'insensitive',
    });
  });

  it('applies difficulty filter', () => {
    const where = buildSearchWhereClause({
      ...baseParams,
      difficulty: 'EASY',
    });
    expect(where.difficulty).toBe('EASY');
  });

  it('applies maxPrepTime filter', () => {
    const where = buildSearchWhereClause({
      ...baseParams,
      maxPrepTime: 30,
    });
    expect(where.prepTime).toEqual({ lte: 30 });
  });

  it('applies maxCookTime filter', () => {
    const where = buildSearchWhereClause({
      ...baseParams,
      maxCookTime: 60,
    });
    expect(where.cookTime).toEqual({ lte: 60 });
  });

  it('applies minRating filter', () => {
    const where = buildSearchWhereClause({
      ...baseParams,
      minRating: 4,
    });
    expect(where.avgRating).toEqual({ gte: 4 });
  });

  it('applies dietary filter', () => {
    const where = buildSearchWhereClause({
      ...baseParams,
      dietary: ['tag-1', 'tag-2'],
    });
    expect(where.dietaryTags).toEqual({
      some: { dietaryTagId: { in: ['tag-1', 'tag-2'] } },
    });
  });

  it('combines multiple filters', () => {
    const where = buildSearchWhereClause(
      {
        ...baseParams,
        cuisine: 'Italian',
        difficulty: 'MEDIUM',
        maxPrepTime: 30,
      },
      'user-1'
    );
    expect(where.OR).toBeDefined();
    expect(where.cuisineType).toBeDefined();
    expect(where.difficulty).toBe('MEDIUM');
    expect(where.prepTime).toEqual({ lte: 30 });
  });
});

describe('buildSearchOrderBy', () => {
  it('returns null for relevance sort with search query', () => {
    expect(buildSearchOrderBy('relevance', true)).toBeNull();
  });

  it('returns createdAt desc for relevance without search query', () => {
    expect(buildSearchOrderBy('relevance', false)).toEqual({
      createdAt: 'desc',
    });
  });

  it('returns newest sort', () => {
    expect(buildSearchOrderBy('newest', false)).toEqual({
      createdAt: 'desc',
    });
  });

  it('returns oldest sort', () => {
    expect(buildSearchOrderBy('oldest', false)).toEqual({
      createdAt: 'asc',
    });
  });

  it('returns rating sort', () => {
    expect(buildSearchOrderBy('rating', false)).toEqual({
      avgRating: { sort: 'desc', nulls: 'last' },
    });
  });

  it('returns prepTime sort', () => {
    expect(buildSearchOrderBy('prepTime', false)).toEqual({
      prepTime: { sort: 'asc', nulls: 'last' },
    });
  });

  it('returns title sort', () => {
    expect(buildSearchOrderBy('title', false)).toEqual({ name: 'asc' });
  });

  it('returns default (newest) for unknown sort', () => {
    expect(buildSearchOrderBy('unknown', false)).toEqual({
      createdAt: 'desc',
    });
  });
});
