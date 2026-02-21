import { z } from 'zod';

// Use string literal enums to keep validations framework-agnostic
const DIFFICULTY_VALUES = ['EASY', 'MEDIUM', 'HARD'] as const;

const SEARCH_SORT_VALUES = [
  'relevance',
  'newest',
  'oldest',
  'rating',
  'prepTime',
  'title',
] as const;

// ─── Search Filter Schema ───

export const searchFilterSchema = z.object({
  q: z
    .string()
    .max(200, 'Search query must be at most 200 characters')
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
  sort: z.enum(SEARCH_SORT_VALUES).default('relevance'),
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
});

// ─── Inferred Types ───

export type SearchFilterInput = z.infer<typeof searchFilterSchema>;
