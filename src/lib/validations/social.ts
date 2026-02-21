import { z } from 'zod';

// ─── Field-Level Schemas ───

export const ratingValueSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

export const commentContentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment must be at most 1000 characters')
  .trim();

// ─── Request Schemas ───

export const createRatingSchema = z.object({
  value: ratingValueSchema,
});

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});

export const commentListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── Inferred Types ───

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentListInput = z.infer<typeof commentListSchema>;
