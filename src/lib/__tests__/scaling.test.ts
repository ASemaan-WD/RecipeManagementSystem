import { describe, it, expect } from 'vitest';

import { parseQuantity, formatQuantity, scaleQuantity } from '@/lib/scaling';

describe('parseQuantity', () => {
  it('parses simple integers', () => {
    const result = parseQuantity('2 cups');
    expect(result).toEqual({ value: 2, unit: 'cups', raw: '2 cups' });
  });

  it('parses decimals', () => {
    const result = parseQuantity('2.5 tbsp');
    expect(result).toEqual({ value: 2.5, unit: 'tbsp', raw: '2.5 tbsp' });
  });

  it('parses fractions', () => {
    const result = parseQuantity('1/2 cup');
    expect(result).toEqual({ value: 0.5, unit: 'cup', raw: '1/2 cup' });
  });

  it('parses mixed numbers', () => {
    const result = parseQuantity('1 1/2 cups');
    expect(result).toEqual({ value: 1.5, unit: 'cups', raw: '1 1/2 cups' });
  });

  it('parses ranges using lower bound', () => {
    const result = parseQuantity('2-3 cups');
    expect(result).toEqual({ value: 2, unit: 'cups', raw: '2-3 cups' });
  });

  it('parses unitless quantities', () => {
    const result = parseQuantity('3');
    expect(result).toEqual({ value: 3, unit: '', raw: '3' });
  });

  it('returns null for non-scalable terms', () => {
    expect(parseQuantity('pinch')).toBeNull();
    expect(parseQuantity('to taste')).toBeNull();
    expect(parseQuantity('as needed')).toBeNull();
    expect(parseQuantity('a dash')).toBeNull();
  });

  it('returns null for empty strings', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('  ')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseQuantity('some flour')).toBeNull();
  });

  it('handles whitespace', () => {
    const result = parseQuantity('  2 cups  ');
    expect(result).toEqual({ value: 2, unit: 'cups', raw: '2 cups' });
  });
});

describe('formatQuantity', () => {
  it('formats whole numbers', () => {
    expect(formatQuantity(3)).toBe('3');
  });

  it('formats common fractions', () => {
    expect(formatQuantity(0.5)).toBe('1/2');
    expect(formatQuantity(0.25)).toBe('1/4');
    expect(formatQuantity(0.75)).toBe('3/4');
  });

  it('formats mixed numbers', () => {
    expect(formatQuantity(1.5)).toBe('1 1/2');
    expect(formatQuantity(2.25)).toBe('2 1/4');
  });

  it('formats non-standard decimals as numbers', () => {
    expect(formatQuantity(2.7)).toBe('2.7');
  });

  it('formats zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });

  it('formats 1/3', () => {
    expect(formatQuantity(1 / 3)).toBe('1/3');
  });

  it('formats 2/3', () => {
    expect(formatQuantity(2 / 3)).toBe('2/3');
  });
});

describe('scaleQuantity', () => {
  it('returns null for null input', () => {
    expect(scaleQuantity(null, 2)).toBeNull();
  });

  it('returns original for factor of 1', () => {
    expect(scaleQuantity('2 cups', 1)).toBe('2 cups');
  });

  it('scales simple quantities', () => {
    expect(scaleQuantity('2 cups', 2)).toBe('4 cups');
  });

  it('scales fractions', () => {
    expect(scaleQuantity('1/2 cup', 2)).toBe('1 cup');
  });

  it('scales mixed numbers', () => {
    expect(scaleQuantity('1 1/2 cups', 2)).toBe('3 cups');
  });

  it('scales down', () => {
    expect(scaleQuantity('4 cups', 0.5)).toBe('2 cups');
  });

  it('preserves non-scalable terms', () => {
    expect(scaleQuantity('pinch', 2)).toBe('pinch');
    expect(scaleQuantity('to taste', 3)).toBe('to taste');
  });

  it('scales ranges (both bounds)', () => {
    expect(scaleQuantity('2-3 cups', 2)).toBe('4-6 cups');
  });

  it('handles unitless quantities', () => {
    expect(scaleQuantity('3', 2)).toBe('6');
  });

  it('returns original for unparseable quantities', () => {
    expect(scaleQuantity('some flour', 2)).toBe('some flour');
  });

  it('produces friendly fractions when scaling down', () => {
    expect(scaleQuantity('1 cup', 0.5)).toBe('1/2 cup');
  });

  it('produces mixed numbers', () => {
    expect(scaleQuantity('1 cup', 1.5)).toBe('1 1/2 cup');
  });
});
