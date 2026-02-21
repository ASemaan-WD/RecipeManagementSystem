import { describe, it, expect } from 'vitest';
import { searchFilterSchema } from '@/lib/validations/search';

describe('searchFilterSchema', () => {
  it('applies defaults for empty input', () => {
    const result = searchFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('relevance');
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(12);
      expect(result.data.q).toBeUndefined();
    }
  });

  it('accepts valid search params', () => {
    const result = searchFilterSchema.safeParse({
      q: 'chicken',
      cuisine: 'Italian',
      difficulty: 'EASY',
      maxPrepTime: '30',
      maxCookTime: '60',
      minRating: '4',
      sort: 'rating',
      page: '2',
      limit: '24',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('chicken');
      expect(result.data.cuisine).toBe('Italian');
      expect(result.data.difficulty).toBe('EASY');
      expect(result.data.maxPrepTime).toBe(30);
      expect(result.data.maxCookTime).toBe(60);
      expect(result.data.minRating).toBe(4);
      expect(result.data.sort).toBe('rating');
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(24);
    }
  });

  it('rejects q longer than 200 characters', () => {
    const result = searchFilterSchema.safeParse({
      q: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid difficulty', () => {
    const result = searchFilterSchema.safeParse({
      difficulty: 'IMPOSSIBLE',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = searchFilterSchema.safeParse({
      sort: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 50', () => {
    const result = searchFilterSchema.safeParse({
      limit: '100',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative page', () => {
    const result = searchFilterSchema.safeParse({
      page: '-1',
    });
    expect(result.success).toBe(false);
  });

  it('transforms dietary string to array', () => {
    const result = searchFilterSchema.safeParse({
      dietary: 'vegetarian',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dietary).toEqual(['vegetarian']);
    }
  });

  it('accepts dietary as array', () => {
    const result = searchFilterSchema.safeParse({
      dietary: ['vegetarian', 'gluten-free'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dietary).toEqual(['vegetarian', 'gluten-free']);
    }
  });

  it('coerces string numbers to numbers', () => {
    const result = searchFilterSchema.safeParse({
      maxPrepTime: '15',
      minRating: '3.5',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxPrepTime).toBe(15);
      expect(result.data.minRating).toBe(3.5);
    }
  });

  it('accepts all valid sort values', () => {
    const sorts = [
      'relevance',
      'newest',
      'oldest',
      'rating',
      'prepTime',
      'title',
    ];
    for (const sort of sorts) {
      const result = searchFilterSchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });
});
