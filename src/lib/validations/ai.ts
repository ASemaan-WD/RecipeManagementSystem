import { z } from 'zod';

// ─── Field Schemas ───

const ingredientItemSchema = z
  .string()
  .min(1, 'Ingredient cannot be empty')
  .max(100, 'Ingredient name too long')
  .trim();

const ingredientsArraySchema = z
  .array(ingredientItemSchema)
  .min(1, 'At least one ingredient is required')
  .max(20, 'Maximum 20 ingredients allowed');

// ─── Request Schemas ───

export const generateRecipeSchema = z.object({
  ingredients: ingredientsArraySchema,
  cuisine: z.string().max(50).optional(),
  dietary: z.string().max(100).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  servings: z.number().int().min(1).max(50).optional(),
});

export const substituteIngredientSchema = z.object({
  ingredient: z
    .string()
    .min(1, 'Ingredient is required')
    .max(100, 'Ingredient name too long')
    .trim(),
  recipeContext: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(200).optional(),
});

export const generateImageSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID is required'),
});

// ─── Inferred Types ───

export type GenerateRecipeInput = z.infer<typeof generateRecipeSchema>;
export type SubstituteIngredientInput = z.infer<
  typeof substituteIngredientSchema
>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
