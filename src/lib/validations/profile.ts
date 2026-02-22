import { z } from 'zod';

// ─── Field Schemas ───

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(50, 'Display name must be at most 50 characters')
  .trim();

export const avatarUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .max(2048, 'URL is too long')
  .or(z.literal(''))
  .optional();

// ─── Form / Request Schema ───

export const updateProfileSchema = z.object({
  name: displayNameSchema,
  image: avatarUrlSchema,
});

// ─── Inferred Types ───

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
