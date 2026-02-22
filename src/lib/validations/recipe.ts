import { z } from 'zod';

// Use string literal enums instead of z.nativeEnum() with Prisma to avoid
// pulling Node.js-only Prisma client into the client bundle.
const DIFFICULTY_VALUES = ['EASY', 'MEDIUM', 'HARD'] as const;
const VISIBILITY_VALUES = ['PRIVATE', 'SHARED', 'PUBLIC'] as const;
const IMAGE_SOURCE_VALUES = ['UPLOAD', 'URL', 'AI_GENERATED'] as const;

// ─── Field-Level Schemas ───

export const recipeNameSchema = z
  .string()
  .min(1, 'Recipe name is required')
  .max(200, 'Recipe name must be at most 200 characters')
  .trim();

export const recipeDescriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(2000, 'Description must be at most 2000 characters')
  .trim();

export const prepTimeSchema = z
  .number()
  .int('Prep time must be a whole number')
  .positive('Prep time must be a positive number');

export const cookTimeSchema = z
  .number()
  .int('Cook time must be a whole number')
  .positive('Cook time must be a positive number');

export const servingsSchema = z
  .number()
  .int('Servings must be a whole number')
  .min(1, 'Servings must be at least 1')
  .max(100, 'Servings must be at most 100');

export const difficultySchema = z.enum(DIFFICULTY_VALUES, {
  error: 'Invalid difficulty level',
});

export const visibilitySchema = z.enum(VISIBILITY_VALUES, {
  error: 'Invalid visibility setting',
});

export const imageSourceSchema = z.enum(IMAGE_SOURCE_VALUES, {
  error: 'Invalid image source',
});

export const cuisineTypeSchema = z
  .string()
  .min(1, 'Cuisine type is required')
  .max(50, 'Cuisine type must be at most 50 characters')
  .trim();

export const ingredientInputSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').trim(),
  quantity: z.string().trim(),
  unit: z.string().trim().optional(),
  notes: z.string().max(200, 'Notes must be at most 200 characters').optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
});

export const stepInputSchema = z.object({
  instruction: z
    .string()
    .min(1, 'Instruction is required')
    .max(5000, 'Instruction must be at most 5000 characters')
    .trim(),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be a positive number')
    .optional(),
  stepNumber: z
    .number()
    .int()
    .positive('Step number must be a positive integer'),
});

// ─── Image URL Trusted Domains ───

const TRUSTED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'oaidalleapiprodscus.blob.core.windows.net',
];

function isTrustedImageUrl(url: string): boolean {
  // Allow relative URLs
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return (
      TRUSTED_IMAGE_DOMAINS.some((domain) => parsed.hostname === domain) ||
      parsed.hostname.endsWith('.public.blob.vercel-storage.com') ||
      parsed.hostname.endsWith('.private.blob.vercel-storage.com')
    );
  } catch {
    return false;
  }
}

const trustedImageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .refine(isTrustedImageUrl, {
    message: 'Image URL must be from a trusted source (Vercel Blob, Unsplash)',
  });

export const imageInputSchema = z.object({
  url: trustedImageUrlSchema,
  source: imageSourceSchema,
  isPrimary: z.boolean(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
});

// ─── Form / Request Schemas ───

export const createRecipeSchema = z.object({
  name: recipeNameSchema,
  description: recipeDescriptionSchema,
  prepTime: prepTimeSchema,
  cookTime: cookTimeSchema,
  servings: servingsSchema,
  difficulty: difficultySchema,
  cuisineType: cuisineTypeSchema,
  visibility: visibilitySchema,
  ingredients: z
    .array(ingredientInputSchema)
    .min(1, 'At least one ingredient is required'),
  steps: z.array(stepInputSchema).min(1, 'At least one step is required'),
  dietaryTagIds: z.array(z.string()),
  images: z.array(imageInputSchema),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export const recipeFilterSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive('Page must be a positive integer')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must be at most 50')
    .default(12),
  search: z
    .string()
    .max(200, 'Search must be at most 200 characters')
    .optional(),
  cuisine: z.string().optional(),
  difficulty: z.enum(DIFFICULTY_VALUES).optional(),
  maxPrepTime: z.coerce.number().int().positive().optional(),
  maxCookTime: z.coerce.number().int().positive().optional(),
  dietary: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? [val] : val))
    .optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z
    .enum(['newest', 'oldest', 'rating', 'prepTime', 'title'])
    .default('newest'),
  visibility: z.enum(VISIBILITY_VALUES).optional(),
});

// ─── Inferred Types ───

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type RecipeFilterInput = z.infer<typeof recipeFilterSchema>;
