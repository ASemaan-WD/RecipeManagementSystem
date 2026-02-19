import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');

export const usernameFormSchema = z.object({
  username: usernameSchema,
});

export type UsernameFormData = z.infer<typeof usernameFormSchema>;
