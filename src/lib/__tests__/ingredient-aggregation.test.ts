import { describe, it, expect } from 'vitest';

import { aggregateIngredients } from '@/lib/ingredient-aggregation';

describe('aggregateIngredients', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateIngredients([])).toEqual([]);
  });

  it('preserves single ingredients as-is', () => {
    const result = aggregateIngredients([
      { name: 'Flour', quantity: '2 cups' },
      { name: 'Sugar', quantity: '1 cup' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      ingredientName: 'Flour',
      quantity: '2 cups',
    });
    expect(result[1]).toMatchObject({
      ingredientName: 'Sugar',
      quantity: '1 cup',
    });
  });

  it('aggregates duplicate ingredients with same unit', () => {
    const result = aggregateIngredients([
      { name: 'Flour', quantity: '2 cups' },
      { name: 'flour', quantity: '1 cups' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ingredientName: 'Flour',
      quantity: '3 cups',
    });
  });

  it('handles ingredients with null quantities', () => {
    const result = aggregateIngredients([{ name: 'Salt', quantity: null }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ingredientName: 'Salt',
      quantity: null,
    });
  });

  it('assigns categories based on ingredient name', () => {
    const result = aggregateIngredients([
      { name: 'Flour', quantity: '2 cups' },
      { name: 'Chicken breast', quantity: '1 lb' },
      { name: 'Milk', quantity: '1 cup' },
    ]);

    expect(result.find((i) => i.ingredientName === 'Flour')?.category).toBe(
      'Baking'
    );
    expect(
      result.find((i) => i.ingredientName === 'Chicken breast')?.category
    ).toBe('Proteins');
    expect(result.find((i) => i.ingredientName === 'Milk')?.category).toBe(
      'Dairy & Eggs'
    );
  });

  it('joins quantities with different units', () => {
    const result = aggregateIngredients([
      { name: 'Butter', quantity: '2 tbsp' },
      { name: 'butter', quantity: '1 cup' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe('2 tbsp + 1 cup');
  });

  it('defaults unknown ingredients to Other category', () => {
    const result = aggregateIngredients([
      { name: 'Xanthan gum', quantity: '1 tsp' },
    ]);

    expect(result[0]?.category).toBe('Other');
  });
});
