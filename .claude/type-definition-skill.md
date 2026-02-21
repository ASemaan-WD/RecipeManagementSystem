# Type Definition Skill

> This skill defines the canonical pattern for creating TypeScript type and interface definitions. Types are organized by purpose: module augmentation files (`.d.ts`), shared domain types, and component-level props interfaces.

---

## When to Create a Type File

Create a file in `src/types/` when:

- **Module augmentation** is needed (extending third-party library types)
- **Shared domain types** are used by 3+ files across the project
- **API response/request types** that don't come from Zod inference

Do NOT create a type file when:

- A type is only used in 1-2 files — define it inline
- The type can be inferred from a Zod schema — use `z.infer<>` (see `validation-schema-skill.md`)
- The type comes from Prisma — import from `@/generated/prisma/client`

---

## File Naming & Location

- **Location:** `src/types/`
- **Module augmentation:** `<library-name>.d.ts` (e.g., `next-auth.d.ts`)
- **Shared domain types:** `<domain>.ts` (e.g., `recipe.ts`, `api.ts`, `ai.ts`)

---

## Complete Templates

### Module Augmentation (`.d.ts`)

Used to extend types from third-party libraries:

```typescript
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    username: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    username: string | null;
  }
}
```

### Shared Domain Types

```typescript
import type { Difficulty, Visibility } from '@/generated/prisma/client';

// ─── Entity Types ───

export interface RecipeListItem {
  id: string;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: Difficulty;
  cuisineType: string | null;
  avgRating: number | null;
  primaryImage: string | null;
  author: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

export interface RecipeDetail extends RecipeListItem {
  servings: number;
  visibility: Visibility;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  dietaryTags: string[];
  images: RecipeImage[];
  userTags: { status: string }[];
}

// ─── Supporting Types ───

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  order: number;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  duration: number | null;
}

export interface RecipeImage {
  id: string;
  url: string;
  source: string;
  isPrimary: boolean;
  order: number;
}
```

### API Types

```typescript
// ─── Generic API Response Types ───

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

---

## Pattern Details

### When to Use `interface` vs `type`

- **`interface`** — For object shapes (entities, props, API responses). Preferred for extendability.
- **`type`** — For unions, intersections, mapped types, and utility types.

```typescript
// interface for object shapes
interface RecipeListItem {
  id: string;
  name: string;
}

// type for unions and utilities
type RecipeVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';
type Optional<T> = T | null | undefined;
```

### Import Style

Always use `import type` when importing only types:

```typescript
import type { Difficulty, Visibility } from '@/generated/prisma/client';
import type { Session } from 'next-auth';
```

### Inline vs Shared

| Scenario                     | Where to Define                         |
| ---------------------------- | --------------------------------------- |
| Props for one component      | Inline in the component file            |
| Props shared by 2 components | Inline in the parent, pass down         |
| Type used by 3+ files        | `src/types/<domain>.ts`                 |
| Zod-inferable type           | `z.infer<>` in `src/lib/validations/`   |
| Prisma model type            | Import from `@/generated/prisma/client` |
| Library augmentation         | `src/types/<library>.d.ts`              |

### Inline Props Interface Convention

When defining props inline in a component file:

```typescript
// In the component file, immediately above the component
interface RecipeCardProps {
  recipe: RecipeListItem;
  showAuthor?: boolean;
  onTagToggle?: (status: string) => void;
}

export function RecipeCard({
  recipe,
  showAuthor = true,
  onTagToggle,
}: RecipeCardProps) {
  // ...
}
```

### Re-Exporting Prisma Types

Do NOT re-export Prisma types in `src/types/`. Import directly:

```typescript
// GOOD — import directly from generated client
import { Difficulty, Visibility } from '@/generated/prisma/client';

// BAD — don't re-export
export type { Difficulty } from '@/generated/prisma/client'; // unnecessary
```

### Extending Types

```typescript
// Extending an interface
interface RecipeListItem {
  id: string;
  name: string;
}

interface RecipeDetail extends RecipeListItem {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

// Intersection with type
type RecipeWithAuthor = RecipeDetail & {
  author: { id: string; name: string };
};
```

---

## Exports

- Use **named exports** for all types and interfaces.
- Group related types in sections with comment headers.
- No default exports.

---

## Proof of Pattern

| File                       | Pattern Demonstrated                             |
| -------------------------- | ------------------------------------------------ |
| `src/types/next-auth.d.ts` | Module augmentation for NextAuth Session and JWT |

---

## Anti-Patterns

- **Never** define types that can be inferred from Zod schemas — use `z.infer<>`.
- **Never** re-export Prisma types — import them directly.
- **Never** use `any` — use `unknown` if the type is truly unknown, then narrow it.
- **Never** create type files for props used by only 1-2 components — keep them inline.
- **Never** use `export default` for type files.
- **Never** mix runtime code into `.d.ts` files — they are declaration-only.
- **Never** define the same type in multiple places — pick one source of truth.

---

## Checklist

Before committing a new type definition:

- [ ] File is in `src/types/` with appropriate naming (`.d.ts` for augmentation, `.ts` for shared types)
- [ ] Uses `interface` for object shapes, `type` for unions/utilities
- [ ] Uses `import type` for type-only imports
- [ ] Types are exported as named exports
- [ ] No types that should be `z.infer<>` instead
- [ ] No re-exports of Prisma types
- [ ] No `any` usage — `unknown` with narrowing if needed
- [ ] Shared types are genuinely used by 3+ files
- [ ] Sections are organized with comment headers
