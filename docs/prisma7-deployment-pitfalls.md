# Prisma 7.x Pitfalls

A checklist of common issues when using Prisma 7 with driver adapters, Next.js, and serverless databases (Neon, PlanetScale, etc.). These are not project-specific — they apply to any stack using Prisma 7's client engine.

---

## 1. PrismaClient Requires an Adapter (No Zero-Arg Constructor)

**Symptom:** `PrismaClient` instantiation fails with a cryptic error about missing `adapter` or `accelerateUrl`, or silently hangs during `next build`.

**Cause:** Prisma 7 replaced the bundled query engine with a modular "client" engine. `new PrismaClient()` with no arguments no longer works — you must provide either an `adapter` or an `accelerateUrl`.

**Fix:** Pass a driver adapter to the constructor:

```typescript
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

Adapter packages vary by database provider: `@prisma/adapter-neon`, `@prisma/adapter-planetscale`, `@prisma/adapter-d1`, etc.

---

## 2. Adapter Packages Must Be Production Dependencies

**Symptom:** Deployment works locally but fails in production with `Cannot find module '@prisma/adapter-neon'` or `Cannot find module '@neondatabase/serverless'`.

**Cause:** The adapter and its underlying driver are runtime dependencies, not build-time-only. If they're in `devDependencies`, production installs skip them.

**Fix:** Move adapter packages to `dependencies`:

```json
{
  "dependencies": {
    "@prisma/adapter-neon": "^7.x",
    "@neondatabase/serverless": "^1.x",
    "@prisma/client": "^7.x"
  },
  "devDependencies": {
    "prisma": "^7.x"
  }
}
```

---

## 3. `prisma generate` Must Run Before Build

**Symptom:** `Module '"@prisma/client"' has no exported member 'PrismaClient'` or `has no exported member 'Prisma'` during `next build` on Vercel/CI.

**Cause:** `@prisma/client` re-exports types from `.prisma/client/`, which is a generated directory. If `prisma generate` hasn't run (or the generated output is stale), the re-export chain breaks — especially under Turbopack's module resolver.

**Fix:** Run `prisma generate` in your build script:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

Also ensure your CI workflow runs it after `npm ci`:

```yaml
- run: npm ci
- run: npx prisma generate
- run: npm run lint
```

---

## 4. Driver Adapters Return PostgreSQL Error Codes, Not Prisma Codes

**Symptom:** Error handling that checks for `P2002` (unique constraint) stops working after migrating to Prisma 7 with a driver adapter.

**Cause:** Driver adapters pass through the database's native error codes instead of Prisma's abstracted codes. PostgreSQL uses `23505` for unique violations, `23503` for foreign key violations, etc.

**Fix:** Update all error code checks:

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({ data: { email: 'duplicate@example.com' } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma 6: error.code === 'P2002'
    // Prisma 7 with adapter: error.code === '23505'
    if (error.code === '23505') {
      return { error: 'Already exists' };
    }
  }
}
```

Common PostgreSQL codes: `23505` (unique), `23503` (foreign key), `23502` (not null).

---

## 5. Raw SQL Utilities Live in `@prisma/client/runtime/client`

**Symptom:** `Module '"@prisma/client"' has no exported member 'sql'` or `'Sql'`.

**Cause:** In Prisma 7, `sql` (tagged template), `join`, `empty`, and the `Sql` type are not exported from the top-level `@prisma/client` package. They live in an internal runtime subpath.

**Fix:**

```typescript
import {
  sqltag as sql,
  join,
  empty,
  type Sql,
} from '@prisma/client/runtime/client';

const clauses: Sql[] = [];
if (genre) clauses.push(sql`AND "genre" = ${genre}`);
const filterSql = clauses.length > 0 ? join(clauses, ' ') : empty;

const rows = await prisma.$queryRaw`
  SELECT * FROM "Book"
  WHERE "isDeleted" = false ${filterSql}
`;
```

Note: `sqltag` is the actual export name; alias it as `sql` for readability.

---

## 6. `Prisma` Namespace and `QueryMode` Are Not Directly Importable on Some Bundlers

**Symptom:** `Module '"@prisma/client"' has no exported member 'Prisma'` during Turbopack builds, even though `tsc` compiles fine locally.

**Cause:** The `@prisma/client` package uses a `default.d.ts` → `.prisma/client/default` → `./index` re-export chain. Some bundlers (notably Turbopack) cannot follow this chain, losing all exported members.

**Workarounds:**

- For `Prisma.QueryMode`: replace with the string literal `'insensitive' as const`
- For `type Prisma` in type-only imports: ensure `prisma generate` has run (pitfall #3)
- For raw SQL types: import from `@prisma/client/runtime/client` (pitfall #5)

```typescript
// Before (breaks on Turbopack)
import { Prisma } from '@prisma/client';
where.genre = { contains: genre, mode: Prisma.QueryMode.insensitive };

// After (works everywhere)
where.genre = { contains: genre, mode: 'insensitive' as const };
```

---

## 7. Adapter Constructor Signatures Differ

**Symptom:** `Expected 2 arguments, but got 1` when creating `PrismaNeonHttp`, or `Argument of type 'string' is not assignable` when creating `PrismaNeon`.

**Cause:** Different adapters from the same package have different constructor signatures:

| Adapter          | Constructor                            | Use Case                                |
| ---------------- | -------------------------------------- | --------------------------------------- |
| `PrismaNeon`     | `new PrismaNeon({ connectionString })` | Connection-pooling (long-lived servers) |
| `PrismaNeonHttp` | `new PrismaNeonHttp(connString, {})`   | HTTP-based (serverless, tests)          |

**Fix:** Match the constructor to the adapter:

```typescript
// PrismaNeon — takes a config object
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

// PrismaNeonHttp — takes (string, options), options object is required
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
```

---

## 8. `prisma.config.ts` Is Required for CLI Operations

**Symptom:** `prisma migrate dev` or `prisma db push` fails with `No datasource URL provided` even though `DATABASE_URL` is set in `.env.local`.

**Cause:** Prisma 7 CLI reads its configuration from `prisma.config.ts` at the project root. It does not automatically load `.env.local` — only `.env`. If your connection string is in `.env.local`, you must explicitly load it.

**Fix:**

```typescript
// prisma.config.ts
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.local' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 9. Vitest Does Not Load `.env.local` Automatically

**Symptom:** Integration tests that connect to the database fail with `DATABASE_URL is not defined` or connection errors.

**Cause:** Vitest only loads `.env` by default. If your connection string is in `.env.local`, it is invisible to the test runner.

**Fix:** Call `dotenv.config()` at the top of your test file, **before** any Prisma imports:

```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Now Prisma adapter can read process.env.DATABASE_URL
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });
```

---

## 10. Seed Scripts Need Their Own Adapter

**Symptom:** `prisma db seed` fails with `PrismaClient requires adapter or accelerateUrl`.

**Cause:** Seed scripts run as standalone Node processes, not inside Next.js. They don't inherit the app's singleton `PrismaClient` and need their own adapter setup.

**Fix:**

```typescript
// prisma/seed.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // seed logic
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 11. Test Cleanup Must Respect Foreign Key Order

**Symptom:** `delete` or `deleteMany` fails with `Foreign key constraint failed` (code `23503`) during test teardown.

**Cause:** Driver adapters enforce PostgreSQL foreign key constraints strictly. Deleting a parent row while child rows reference it fails immediately.

**Fix:** Delete dependents before parents:

```typescript
afterAll(async () => {
  // Children first
  await prisma.transaction.deleteMany({ where: { userId: testUserId } });
  await prisma.borrowRequest.deleteMany({ where: { userId: testUserId } });
  await prisma.review.deleteMany({ where: { userId: testUserId } });
  await prisma.session.deleteMany({ where: { userId: testUserId } });
  await prisma.account.deleteMany({ where: { userId: testUserId } });

  // Parent last
  await prisma.user.delete({ where: { id: testUserId } });

  await prisma.$disconnect();
});
```

---

## 12. Database Roundtrips Can Exceed Default Test Timeouts in CI

**Symptom:** Integration tests pass locally but time out in CI with `Error: Test timed out in 5000ms`.

**Cause:** Serverless databases (Neon, PlanetScale) have higher latency from CI runners than from local machines. The default 5-second Vitest timeout is often insufficient for tests that make multiple database roundtrips.

**Fix:** Increase timeouts on database-heavy test suites:

```typescript
describe('Database constraints', { timeout: 30_000 }, () => {
  it('rejects duplicate email', async () => {
    // This test makes 2+ network roundtrips to a remote database
  });
});
```

---

## 13. `.map()` / `.reduce()` Callbacks on Prisma Results Lose Types on Turbopack

**Symptom:** `Parameter 'item' implicitly has an 'any' type` in `.map()`, `.filter()`, or `.reduce()` callbacks applied to `findMany` / `groupBy` / `$queryRaw` results — but only on Vercel/Turbopack, not local `tsc`.

**Cause:** Turbopack's type checker sometimes fails to carry inferred generic types through callback parameters, especially for complex Prisma return types involving `include`, `select`, `groupBy`, or raw queries.

**Fix:** Add explicit type annotations on every callback parameter:

```typescript
const books = await prisma.book.findMany({
  include: { reviews: { select: { rating: true } } },
});

type BookRow = (typeof books)[number];
const data = books.map((book: BookRow) => ({
  id: book.id,
  avgRating:
    book.reviews.length > 0
      ? book.reviews.reduce(
          (sum: number, r: { rating: number }) => sum + r.rating,
          0
        ) / book.reviews.length
      : null,
}));
```

Use the `type X = (typeof variable)[number]` pattern to extract the array element type without manual duplication.

---

## 14. `Promise.all` Destructuring Loses Prisma Types

**Symptom:** Variables destructured from `Promise.all([query1, query2])` lose their specific types, becoming `any` or a union.

**Cause:** When Prisma queries are inlined inside `Promise.all`, TypeScript infers a tuple type. Some bundlers and TS environments widen or lose the individual element types during destructuring.

**Fix:** Use sequential `await` when the results feed into type-sensitive operations:

```typescript
// Breaks on some bundlers
const [books, total] = await Promise.all([
  prisma.book.findMany({ where, include: { reviews: true } }),
  prisma.book.count({ where }),
]);
books.map((b) => b.title); // 'b' may be 'any'

// Works everywhere
const books = await prisma.book.findMany({ where, include: { reviews: true } });
const total = await prisma.book.count({ where });
books.map((b) => b.title); // 'b' is correctly typed
```

The performance difference is negligible for typical API routes.

---

## Quick Checklist

Before deploying a Prisma 7 project, verify:

- [ ] `PrismaClient` constructor receives an `adapter` (not called with zero args)
- [ ] Adapter packages (`@prisma/adapter-*`, driver packages) are in `dependencies`, not `devDependencies`
- [ ] `prisma generate` runs before `next build` (in build script or CI)
- [ ] Error code checks use PostgreSQL native codes (`23505`), not Prisma codes (`P2002`)
- [ ] Raw SQL imports come from `@prisma/client/runtime/client`
- [ ] `prisma.config.ts` exists and loads the correct `.env` file
- [ ] Seed scripts and test files create their own `PrismaClient` with an adapter
- [ ] Test cleanup deletes child records before parent records
- [ ] CI test timeouts are high enough for remote database roundtrips
- [ ] All `.map()` / `.reduce()` callbacks on Prisma results have explicit type annotations
