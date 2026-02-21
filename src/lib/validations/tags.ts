import { z } from 'zod';

// Use string literal enums instead of Prisma imports to keep validations
// framework-agnostic and prevent pulling Node.js-only code into the client bundle.
const TAG_STATUS_VALUES = ['FAVORITE', 'TO_TRY', 'MADE_BEFORE'] as const;

// ─── Field-Level Schemas ───

export const tagStatusSchema = z.enum(TAG_STATUS_VALUES, {
  error: 'Invalid tag status',
});

// ─── Request Schemas ───

export const addTagSchema = z.object({
  status: tagStatusSchema,
});

export const removeTagSchema = z.object({
  status: tagStatusSchema,
});

// ─── Collection Filter Schema ───

const COLLECTION_TAB_VALUES = [
  'all',
  'favorites',
  'to-try',
  'made-before',
  'saved',
] as const;

const COLLECTION_SORT_VALUES = ['newest', 'oldest', 'rating', 'title'] as const;

export const collectionFilterSchema = z.object({
  tab: z.enum(COLLECTION_TAB_VALUES).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(COLLECTION_SORT_VALUES).default('newest'),
});

// ─── Inferred Types ───

export type AddTagInput = z.infer<typeof addTagSchema>;
export type RemoveTagInput = z.infer<typeof removeTagSchema>;
export type CollectionFilterInput = z.infer<typeof collectionFilterSchema>;
