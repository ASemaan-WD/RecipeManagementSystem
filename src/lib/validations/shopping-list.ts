import { z } from 'zod';

// ─── Field-Level Schemas ───

export const shoppingListNameSchema = z
  .string()
  .min(1, 'List name is required')
  .max(200, 'List name must be at most 200 characters');

export const ingredientNameSchema = z
  .string()
  .min(1, 'Ingredient name is required')
  .max(200, 'Ingredient name must be at most 200 characters');

// ─── Request Schemas ───

export const createShoppingListSchema = z.object({
  name: shoppingListNameSchema,
  recipeIds: z.array(z.string().min(1)).optional(),
});

export const updateShoppingListSchema = z.object({
  name: shoppingListNameSchema,
});

export const addItemSchema = z.object({
  ingredientName: ingredientNameSchema,
  quantity: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
});

export const updateItemSchema = z.object({
  checked: z.boolean().optional(),
  quantity: z.string().max(100).optional(),
  ingredientName: ingredientNameSchema.optional(),
  category: z.string().max(100).optional(),
});

export const addFromRecipeSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID is required'),
});

// ─── Inferred Types ───

export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type UpdateShoppingListInput = z.infer<typeof updateShoppingListSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type AddFromRecipeInput = z.infer<typeof addFromRecipeSchema>;
