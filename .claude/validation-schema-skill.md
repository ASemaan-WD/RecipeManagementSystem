# Validation Schema Skill

> This skill defines the canonical pattern for creating Zod validation schemas. Schemas are shared between frontend forms and API route handlers, providing a single source of truth for data validation rules and TypeScript type inference.

---

## File Naming & Location

- **Naming:** `<domain>.ts` (e.g., `auth.ts`, `recipe.ts`, `comment.ts`)
- **Location:** `src/lib/validations/`
- **One file per domain** — group related schemas by feature area.

---

## Import Ordering (Mandatory)

```typescript
// 1. Zod
import { z } from 'zod';

// 2. Prisma enums (if referencing DB enums in schemas)
import { Difficulty, Visibility } from '@/generated/prisma/client';
```

---

## Complete Template

```typescript
import { z } from 'zod';

// ─── Field-Level Schemas ───
// Reusable atomic schemas for individual fields.
// Named as: <fieldName>Schema

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');

export const emailSchema = z.string().email('Invalid email address');

// ─── Form / Request Schemas ───
// Composed from field schemas. Used by both forms and API routes.
// Named as: <entityAction>Schema (e.g., createRecipeSchema, usernameFormSchema)

export const usernameFormSchema = z.object({
  username: usernameSchema,
});

// ─── Inferred Types ───
// Derived from schemas — never define these manually.
// Named as: <SchemaName> with "Schema" replaced by "Data" or "Input"

export type UsernameFormData = z.infer<typeof usernameFormSchema>;
```

---

## Pattern Details

### Three-Layer Schema Structure

Every validation file follows this structure top to bottom:

1. **Field-level schemas** — Atomic validators for individual fields
2. **Form/request schemas** — Composed `z.object()` schemas using field schemas
3. **Inferred types** — `z.infer<>` types derived from schemas

### Field-Level Schema Naming

```typescript
// Pattern: <fieldName>Schema
export const usernameSchema = z.string().min(3).max(20);
export const recipeNameSchema = z.string().min(1).max(100);
export const difficultySchema = z.nativeEnum(Difficulty);
export const ratingSchema = z.number().int().min(1).max(5);
```

### Form / Request Schema Naming

```typescript
// Pattern: <entity><Action>Schema or <entity>FormSchema
export const usernameFormSchema = z.object({ username: usernameSchema });
export const createRecipeSchema = z.object({ name: recipeNameSchema, ... });
export const updateRecipeSchema = createRecipeSchema.partial();
```

### Inferred Type Naming

```typescript
// Pattern: <SchemaName> with "Schema" → "Data" or "Input"
export type UsernameFormData = z.infer<typeof usernameFormSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
```

### Error Messages

- Always provide custom error messages for user-facing validations.
- Messages should be clear and actionable.
- First message from Zod issues is used in API responses: `result.error.issues[0]?.message`.

```typescript
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');
```

### Prisma Enum Validation

```typescript
import { Difficulty, Visibility } from '@/generated/prisma/client';

export const difficultySchema = z.nativeEnum(Difficulty);
export const visibilitySchema = z.nativeEnum(Visibility);
```

### Optional Fields and Defaults

```typescript
export const createRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100),
  description: z.string().max(500).optional(),
  prepTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().default(4),
  difficulty: difficultySchema.default('MEDIUM'),
  visibility: visibilitySchema.default('PRIVATE'),
});
```

### Partial Schemas for Updates

```typescript
// Full schema for creation
export const createRecipeSchema = z.object({ ... });

// Partial schema for updates (all fields optional)
export const updateRecipeSchema = createRecipeSchema.partial();

// Partial with some required fields
export const updateRecipeSchema = createRecipeSchema.partial().required({ name: true });
```

### Array Schemas

```typescript
export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.string().optional(),
  notes: z.string().optional(),
});

export const createRecipeSchema = z.object({
  name: recipeNameSchema,
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'At least one ingredient required'),
  steps: z.array(stepSchema).min(1, 'At least one step required'),
});
```

---

## Usage in API Routes

```typescript
import { recipeSchema } from '@/lib/validations/recipe';

// Always use safeParse — never parse
const parsed = recipeSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
    { status: 400 }
  );
}
// parsed.data is fully typed
```

## Usage in Forms (React Hook Form)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  usernameFormSchema,
  type UsernameFormData,
} from '@/lib/validations/auth';

const form = useForm<UsernameFormData>({
  resolver: zodResolver(usernameFormSchema),
  defaultValues: { username: '' },
});
```

---

## Proof of Pattern

| File                          | Pattern Demonstrated                       |
| ----------------------------- | ------------------------------------------ |
| `src/lib/validations/auth.ts` | Field schema + form schema + inferred type |

---

## Anti-Patterns

- **Never** define types manually when they can be inferred from schemas — use `z.infer<>`.
- **Never** use `parse()` in API routes — always `safeParse()`.
- **Never** skip custom error messages on user-facing validations.
- **Never** duplicate validation logic between frontend and backend — share the schema.
- **Never** put schemas inline in route files — always in `src/lib/validations/`.
- **Never** create a separate file for each individual schema — group by domain.
- **Never** use `z.any()` or `z.unknown()` in production schemas.

---

## Checklist

Before committing a new validation schema:

- [ ] File is named `<domain>.ts` in `src/lib/validations/`
- [ ] Imports only `z` from `zod` and optionally Prisma enums
- [ ] Three-layer structure: field schemas → form/request schemas → inferred types
- [ ] Field schemas are exported individually for reuse
- [ ] Error messages are custom and user-friendly
- [ ] Types are inferred via `z.infer<>` (not manually defined)
- [ ] Schemas are used in both API routes and forms (shared)
- [ ] No `z.any()` or `z.unknown()` usage
