import { describe, it, expect } from 'vitest';
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeFilterSchema,
} from '@/lib/validations/recipe';

const VALID_RECIPE = {
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'EASY' as const,
  cuisineType: 'Italian',
  visibility: 'PRIVATE' as const,
  ingredients: [{ name: 'Flour', quantity: '2 cups', order: 0 }],
  steps: [{ instruction: 'Preheat oven.', stepNumber: 1 }],
  dietaryTagIds: [],
  images: [],
};

describe('createRecipeSchema', () => {
  it('accepts valid recipe data', () => {
    const result = createRecipeSchema.safeParse(VALID_RECIPE);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 characters', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      name: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects description exceeding 2000 characters', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative prepTime', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      prepTime: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero servings', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      servings: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects servings over 100', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      servings: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid difficulty value', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      difficulty: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty ingredients array', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      ingredients: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty steps array', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      steps: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects ingredient with empty name', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      ingredients: [{ name: '', quantity: '1 cup', order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects step with empty instruction', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      steps: [{ instruction: '', stepNumber: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts recipe with multiple ingredients and steps', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      ingredients: [
        { name: 'Flour', quantity: '2 cups', order: 0 },
        { name: 'Sugar', quantity: '1 cup', order: 1 },
      ],
      steps: [
        { instruction: 'Mix dry ingredients.', stepNumber: 1 },
        { instruction: 'Add wet ingredients.', stepNumber: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name and description', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      name: '  Trimmed  ',
      description: '  Trimmed desc  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Trimmed');
      expect(result.data.description).toBe('Trimmed desc');
    }
  });

  it('accepts valid image inputs', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      images: [
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          source: 'URL',
          isPrimary: true,
          order: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects image with invalid URL', () => {
    const result = createRecipeSchema.safeParse({
      ...VALID_RECIPE,
      images: [
        {
          url: 'not-a-url',
          source: 'URL',
          isPrimary: true,
          order: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateRecipeSchema', () => {
  it('accepts partial data', () => {
    const result = updateRecipeSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateRecipeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates fields that are present', () => {
    const result = updateRecipeSchema.safeParse({ servings: -1 });
    expect(result.success).toBe(false);
  });
});

describe('recipeFilterSchema', () => {
  it('applies default values', () => {
    const result = recipeFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(12);
      expect(result.data.sort).toBe('newest');
    }
  });

  it('coerces string numbers to numbers', () => {
    const result = recipeFilterSchema.safeParse({ page: '3', limit: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects limit over 50', () => {
    const result = recipeFilterSchema.safeParse({ limit: '100' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = recipeFilterSchema.safeParse({ sort: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts valid difficulty filter', () => {
    const result = recipeFilterSchema.safeParse({ difficulty: 'EASY' });
    expect(result.success).toBe(true);
  });

  it('accepts valid visibility filter', () => {
    const result = recipeFilterSchema.safeParse({ visibility: 'PUBLIC' });
    expect(result.success).toBe(true);
  });
});
