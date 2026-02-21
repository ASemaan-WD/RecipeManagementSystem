import { z } from 'zod';

// Use string literal enums instead of Prisma imports to keep validations
// framework-agnostic and prevent pulling Node.js-only code into the client bundle.
const VISIBILITY_VALUES = ['PRIVATE', 'SHARED', 'PUBLIC'] as const;

// ─── Field-Level Schemas ───

export const visibilityValueSchema = z.enum(VISIBILITY_VALUES, {
  error: 'Invalid visibility setting',
});

export const usernameFieldSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username must contain only letters, numbers, and underscores'
  );

export const userSearchQuerySchema = z
  .string()
  .min(1, 'Search query is required')
  .max(20, 'Search query must be at most 20 characters');

// ─── Request Schemas ───

export const updateVisibilitySchema = z.object({
  visibility: visibilityValueSchema,
});

export const shareByUsernameSchema = z.object({
  username: usernameFieldSchema,
});

export const revokeShareSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const userSearchSchema = z.object({
  q: userSearchQuerySchema,
});

export const revokeShareLinkSchema = z.object({
  linkId: z.string().min(1, 'Link ID is required'),
});

// ─── Inferred Types ───

export type UpdateVisibilityInput = z.infer<typeof updateVisibilitySchema>;
export type ShareByUsernameInput = z.infer<typeof shareByUsernameSchema>;
export type RevokeShareInput = z.infer<typeof revokeShareSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type RevokeShareLinkInput = z.infer<typeof revokeShareLinkSchema>;
