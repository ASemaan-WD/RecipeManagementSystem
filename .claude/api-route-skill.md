# API Route Skill

> This skill defines the canonical pattern for creating Next.js App Router API route handlers. All API routes follow the same structure: auth guards, Zod validation, Prisma queries, consistent error responses, and proper HTTP status codes.

---

## File Naming & Location

- **File name:** Always `route.ts` (Next.js convention — never custom-named)
- **Location:** `src/app/api/<domain>/route.ts`
- **Dynamic segments:** `src/app/api/<domain>/[id]/route.ts`
- **Nested resources:** `src/app/api/<domain>/[id]/<sub-resource>/route.ts`

### Route File Structure Examples

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts    # NextAuth catch-all
│   └── username/route.ts         # GET (check), POST (set)
├── recipes/
│   ├── route.ts                  # GET (list), POST (create)
│   ├── public/route.ts           # GET (public recipes, no auth)
│   └── [id]/
│       ├── route.ts              # GET, PUT, DELETE
│       ├── tag/route.ts          # POST (add tag)
│       └── rating/route.ts       # POST (upsert rating)
```

---

## Import Ordering (Mandatory)

```typescript
// 1. Next.js server imports
import { NextRequest, NextResponse } from 'next/server';

// 2. Database / ORM imports
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';

// 3. Auth utilities
import {
  requireAuth,
  requireRecipeOwner,
  canViewRecipe,
} from '@/lib/auth-utils';

// 4. Validation schemas
import { recipeSchema } from '@/lib/validations/recipe';

// 5. Types (if needed)
import type { Recipe } from '@/types/recipe';
```

---

## Complete Templates

### Public Endpoint (No Auth)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { usernameSchema } from '@/lib/validations/auth';

export async function GET(request: NextRequest) {
  // 1. Extract and validate query params
  const username = request.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username query parameter is required' },
      { status: 400 }
    );
  }

  const result = usernameSchema.safeParse(username);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'Invalid username' },
      { status: 400 }
    );
  }

  // 2. Database query
  const existingUser = await prisma.user.findUnique({
    where: { username: result.data },
    select: { id: true },
  });

  // 3. Return response
  return NextResponse.json({ available: !existingUser });
}
```

### Protected Endpoint (Auth Required)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { requireAuth } from '@/lib/auth-utils';
import { recipeSchema } from '@/lib/validations/recipe';

export async function POST(request: NextRequest) {
  // 1. Auth guard
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  // 3. Business logic + database operation
  try {
    const recipe = await prisma.recipe.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    // 4. Handle known Prisma errors
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      );
    }
    throw error; // Re-throw unknown errors (500)
  }
}
```

### Resource Owner Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // 1. Auth + ownership check
  const ownerResult = await requireRecipeOwner(id);
  if (ownerResult instanceof NextResponse) return ownerResult;
  const { session, recipe } = ownerResult;

  // 2. Delete
  await prisma.recipe.delete({ where: { id: recipe.id } });

  return NextResponse.json({ success: true });
}
```

### Minimal Re-Export (NextAuth)

```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

---

## Pattern Details

### Auth Guard Pattern

Always use the guard utilities from `src/lib/auth-utils.ts`:

```typescript
// Basic auth check
const authResult = await requireAuth();
if (authResult instanceof NextResponse) return authResult;
const session = authResult;

// Auth + ownership check
const ownerResult = await requireRecipeOwner(recipeId);
if (ownerResult instanceof NextResponse) return ownerResult;
const { session, recipe } = ownerResult;

// View permission check (supports share tokens)
const viewResult = await canViewRecipe(recipeId, shareToken);
if (viewResult instanceof NextResponse) return viewResult;
const { recipe, user } = viewResult;
```

### Body Parsing Pattern

Always wrap `request.json()` in try/catch:

```typescript
let body: unknown;
try {
  body = await request.json();
} catch {
  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}
```

### Validation Pattern

Always use Zod `safeParse()` — never `parse()` (which throws):

```typescript
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
    { status: 400 }
  );
}
// Use parsed.data — fully typed
```

### Response Format

```typescript
// Success
return NextResponse.json({ data }); // 200 (default)
return NextResponse.json(created, { status: 201 }); // 201 Created
return NextResponse.json({ success: true }); // 200 for deletes

// Errors
return NextResponse.json({ error: 'Message' }, { status: 400 }); // Bad request
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
return NextResponse.json({ error: 'Not found' }, { status: 404 }); // Also for access denied (prevent info leak)
return NextResponse.json({ error: 'Already exists' }, { status: 409 });
```

### Prisma Error Handling

```typescript
try {
  // Prisma operation
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return NextResponse.json(
      { error: 'Resource already exists' },
      { status: 409 }
    );
  }
  throw error; // Re-throw unknown errors — Next.js returns 500
}
```

### Selective Queries

Always use `select` to fetch only needed fields:

```typescript
const user = await prisma.user.findUnique({
  where: { username: result.data },
  select: { id: true },
});
```

### Dynamic Route Params

```typescript
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  // ...
}
```

### Multiple Handlers in One File

A `route.ts` can export multiple HTTP methods:

```typescript
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
export async function PUT(request: NextRequest, { params }: RouteParams) { ... }
export async function DELETE(request: NextRequest, { params }: RouteParams) { ... }
```

---

## Exports

- **Named exports only**: `export async function GET`, `export async function POST`, etc.
- Export only the HTTP methods the route supports.
- No default exports.
- No helper functions exported from route files — put those in `src/lib/`.

---

## Proof of Pattern

| File                                      | Pattern Demonstrated                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/app/api/auth/username/route.ts`      | GET (public, query param validation) + POST (auth, body parsing, Prisma error handling, immutability guard) |
| `src/app/api/auth/[...nextauth]/route.ts` | Minimal re-export pattern                                                                                   |
| `src/lib/auth-utils.ts`                   | `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()` guard utilities                                  |

---

## Anti-Patterns

- **Never** use `parse()` on Zod schemas — always `safeParse()` to avoid unhandled exceptions.
- **Never** expose internal error details to the client — return generic messages.
- **Never** use `status: 403` for missing resources — use `404` to prevent information leaking.
- **Never** skip the auth guard on protected endpoints.
- **Never** duplicate auth logic — use the guard utilities from `src/lib/auth-utils.ts`.
- **Never** return raw Prisma errors — catch known errors and map to HTTP responses.
- **Never** use `any` for body types — parse through Zod for type safety.
- **Never** fetch all fields — use `select` for what you need.
- **Never** put reusable logic in route files — extract to `src/lib/`.
- **Never** use `export default` — always named exports matching HTTP methods.

---

## Checklist

Before committing a new API route:

- [ ] File is named `route.ts` in the correct `src/app/api/` path
- [ ] Import order follows the mandatory sequence
- [ ] Auth guard is first operation in protected handlers
- [ ] Body parsing wrapped in try/catch
- [ ] Validation uses `safeParse()` (not `parse()`)
- [ ] Error responses use consistent `{ error: 'message' }` format
- [ ] HTTP status codes are appropriate (400, 401, 403/404, 409, 201)
- [ ] Prisma errors are caught and mapped to HTTP responses
- [ ] `select` is used on Prisma queries to fetch only needed fields
- [ ] No business logic duplicated — extracted to `src/lib/`
- [ ] Named exports for HTTP methods only
