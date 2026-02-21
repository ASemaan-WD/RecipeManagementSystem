# Lib Utility Skill

> This skill defines the canonical pattern for creating server-side utility and library modules. These are the building blocks of the application — singletons, configuration exports, domain-specific helpers, and pure utility functions that live in `src/lib/`.

---

## When to Use This Pattern

Create a module in `src/lib/` when:

- **Singleton client**: A library client that should be instantiated once (Prisma, OpenAI)
- **Configuration export**: A library's configuration that other parts of the app consume (NextAuth)
- **Domain helpers**: Reusable server-side logic shared across API routes or pages (auth checks, search builders)
- **Pure utilities**: Stateless functions used across the project (class merging, string formatting)

Do NOT put in `src/lib/`:

- React hooks — use `src/hooks/` (see `custom-hook-skill.md`)
- Zod schemas — use `src/lib/validations/` (see `validation-schema-skill.md`)
- React components — use `src/components/` (see component skills)
- Client-side only logic — put in a client component or hook

---

## File Naming & Location

- **Location:** `src/lib/`
- **Naming:** `kebab-case.ts` (e.g., `db.ts`, `auth.ts`, `auth-utils.ts`, `utils.ts`, `scaling.ts`)
- **Subdirectories:** Use `src/lib/validations/` for Zod schemas (only exception)

### Naming Conventions

| Module Type           | Naming Pattern               | Example                                   |
| --------------------- | ---------------------------- | ----------------------------------------- |
| Singleton client      | `<library>.ts`               | `db.ts`, `openai.ts`                      |
| Library configuration | `<library>.ts`               | `auth.ts`, `cloudinary.ts`                |
| Domain helpers        | `<domain>-utils.ts`          | `auth-utils.ts`, `recipe-utils.ts`        |
| Pure utilities        | `utils.ts` or `<purpose>.ts` | `utils.ts`, `scaling.ts`, `formatting.ts` |
| Rate limiting         | `<feature>-rate-limit.ts`    | `ai-rate-limit.ts`                        |
| Error handling        | `<feature>-error-handler.ts` | `ai-error-handler.ts`                     |
| Centralized prompts   | `<feature>-prompts.ts`       | `ai-prompts.ts`                           |

---

## Import Ordering (Mandatory)

```typescript
// 1. Third-party libraries
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// 2. Internal lib imports (if depending on other lib modules)
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// 3. Types
import type { Session } from 'next-auth';
import { Visibility } from '@/generated/prisma/client';

// 4. Next.js imports (if needed)
import { NextResponse } from 'next/server';
```

---

## Complete Templates

### Singleton Client

```typescript
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Key rules:**

- Use `globalThis` caching to prevent multiple instances during Next.js hot reload.
- Only cache in non-production (development has hot reload, production doesn't).
- Factory function for client creation.
- Export as `const` — consumers import the singleton.

### Library Configuration Export

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Attach custom fields to JWT
      if (user) {
        token.userId = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose custom fields on session
      session.user.id = token.userId as string;
      return session;
    },
  },
});
```

**Key rules:**

- Configure once, destructure and export the pieces consumers need.
- Environment variables accessed with `!` assertion (required at runtime).

### Domain-Specific Helpers

```typescript
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Visibility } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

/**
 * Get the current authenticated user from the session.
 * Returns the user object or null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication for an API route.
 * Returns the session if authenticated, or a 401 NextResponse if not.
 *
 * Usage in API routes:
 *   const result = await requireAuth();
 *   if (result instanceof NextResponse) return result;
 *   const session = result;
 */
export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

/**
 * Verify that the current user owns a specific recipe.
 * Returns 401 if unauthenticated, 404 if recipe not found, 403 if not the owner.
 * Returns { session, recipe } on success.
 */
export async function requireRecipeOwner(recipeId: string) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const session = authResult;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  if (recipe.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { session, recipe };
}
```

**Key rules:**

- Every public function has a **JSDoc comment** explaining purpose, parameters, return values, and usage pattern.
- Functions return union types (e.g., `Session | NextResponse`) — consumers check with `instanceof`.
- Functions compose — `requireRecipeOwner` calls `requireAuth` internally.

### Pure Utility Function

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Key rules:**

- Pure functions — no side effects, no state, no async.
- Short, focused, single-purpose.
- Fully typed parameters and return values (can be inferred if obvious).

---

## Pattern Details

### JSDoc Comments

Required on all public functions in domain helper files:

```typescript
/**
 * Brief description of what the function does.
 * Additional context about behavior, edge cases, or return values.
 *
 * Usage:
 *   const result = await functionName(arg);
 *   if (result instanceof NextResponse) return result;
 */
export async function functionName(arg: string) { ... }
```

JSDoc is optional for pure utility functions where the name and types are self-documenting.

### Exports

- **Named exports only** — `export function`, `export const`.
- **No default exports**.
- Export only what consumers need — keep internal helpers unexported.

### Environment Variables

- Access with `!` non-null assertion for required variables.
- Never provide fallback values for secrets — they should fail loudly if missing.
- Document required env vars in `.env.example`.

### Error Handling in Helpers

- Return error responses (e.g., `NextResponse`) — don't throw.
- Consumers check return type with `instanceof NextResponse`.
- This pattern avoids try/catch in every API route.

---

## Proof of Pattern

| File                    | Pattern Demonstrated                         |
| ----------------------- | -------------------------------------------- |
| `src/lib/db.ts`         | Singleton with global caching                |
| `src/lib/auth.ts`       | Library configuration export                 |
| `src/lib/auth-utils.ts` | Domain helpers with JSDoc, composable guards |
| `src/lib/utils.ts`      | Pure utility function                        |

---

## Anti-Patterns

- **Never** put React hooks in `src/lib/` — use `src/hooks/`.
- **Never** put React components in `src/lib/` — use `src/components/`.
- **Never** add `'use client'` to lib files — they are server-side by default.
- **Never** throw errors from helper functions — return error responses for consumers to handle.
- **Never** skip JSDoc on domain helper functions — document every public function.
- **Never** create multiple instances of singleton clients — use the `globalThis` pattern.
- **Never** use `export default` — always named exports.
- **Never** duplicate logic — if two helpers share logic, extract a common private function.

---

## Checklist

Before committing a new lib module:

- [ ] File is `kebab-case.ts` in `src/lib/`
- [ ] Import order follows the mandatory sequence
- [ ] All public functions have JSDoc comments (for domain helpers)
- [ ] Named exports only
- [ ] Singletons use `globalThis` caching pattern
- [ ] Error cases return error responses (not thrown exceptions)
- [ ] Environment variables use `!` assertion (no fallback for secrets)
- [ ] No React hooks or components
- [ ] No `'use client'` directive
- [ ] No duplicated logic — extracted to shared private functions if needed
