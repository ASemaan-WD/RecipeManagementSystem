# Page Component Skill

> This skill defines the canonical patterns for creating Next.js App Router page components, layout components, and special pages (loading, error, not-found). Every new page or layout must follow these conventions exactly.

---

## Entity Types Covered

1. **Page components** — `page.tsx` files that define route content
2. **Layout components** — `layout.tsx` files that wrap child routes
3. **Special pages** — `loading.tsx`, `error.tsx`, `not-found.tsx`

---

## File Naming & Location

| Type      | File Name       | Location                                |
| --------- | --------------- | --------------------------------------- |
| Page      | `page.tsx`      | `src/app/<route-segment>/page.tsx`      |
| Layout    | `layout.tsx`    | `src/app/<route-segment>/layout.tsx`    |
| Loading   | `loading.tsx`   | `src/app/<route-segment>/loading.tsx`   |
| Error     | `error.tsx`     | `src/app/<route-segment>/error.tsx`     |
| Not Found | `not-found.tsx` | `src/app/<route-segment>/not-found.tsx` |

- File names are **always** the Next.js convention (`page.tsx`, `layout.tsx`, etc.) — never custom-named.
- Route groups use parentheses: `(auth)`, `(main)`.
- Dynamic segments use brackets: `[id]`, `[...slug]`.

---

## Import Ordering (Mandatory)

All page/layout files must follow this exact import order, separated by blank lines:

```typescript
// 1. Next.js / React built-ins
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// 2. Third-party icons
import { BookOpen, Heart, Plus } from 'lucide-react';

// 3. Auth / lib / database imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TagStatus } from '@/generated/prisma/client';

// 4. UI component imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// 5. Feature / shared component imports
import { RecipeCard } from '@/components/recipes/recipe-card';

// 6. Constants (if not defined in this file)
import { CUISINE_OPTIONS } from '@/lib/constants';
```

---

## Page Component Pattern

### Server Page (Default — Most Common)

Pages are **async server components** by default. No `'use client'` directive.

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IconName } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';

// Static metadata export (when page title is known at build time)
export const metadata: Metadata = {
  title: 'Page Title',
};

export default async function PageNamePage() {
  // 1. Auth check (if protected page)
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Data fetching
  const data = await prisma.model.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  // 3. Render
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
        <p className="text-muted-foreground mt-1">Description text.</p>
      </section>

      {/* Page content */}
    </div>
  );
}
```

### Key Rules for Server Pages

- **Always** use `export default async function`.
- **Always** name the function `<RouteName>Page` (e.g., `DashboardPage`, `RecipeDetailPage`).
- **Always** export `metadata` for SEO when the title is static.
- Use `generateMetadata()` when the title depends on dynamic data.
- Auth check comes **first** in the function body, before any data fetching.
- Use `redirect()` from `next/navigation` for redirects — never return a redirect response.
- Use `Promise.all()` for parallel data fetching when queries are independent.

### Dynamic Page with Params

```typescript
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  return { title: recipe?.name ?? 'Recipe' };
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  // ...
}
```

### Public Page (No Auth)

```typescript
export const metadata: Metadata = {
  title: 'Community Recipes',
};

export default async function CommunityPage() {
  // No auth check — public page
  const recipes = await prisma.recipe.findMany({
    where: { visibility: 'PUBLIC' },
  });

  return (
    <div className="space-y-8">
      {/* Content */}
    </div>
  );
}
```

---

## Layout Component Pattern

```typescript
import type { ReactNode } from 'react';

export default function RouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layout-wrapper-classes">
      {/* Shared UI (header, sidebar, etc.) */}
      <main className="main-content-classes">{children}</main>
      {/* Footer, etc. */}
    </div>
  );
}
```

### Root Layout (Special Case)

```typescript
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontVariable } from '@/lib/fonts';
import { ThemeProvider } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: { default: 'App Name', template: '%s | App Name' },
  description: 'App description',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontVariable}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Key Rules for Layouts

- **Always** use `export default function` (not async unless data fetching is needed).
- **Always** type children as `{ children: ReactNode }`.
- Root layout is the **only** place that renders `<html>` and `<body>`.
- Provider nesting order: AuthProvider (outermost) > QueryProvider > ThemeProvider (innermost).

---

## Special Page Patterns

### loading.tsx

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading skeleton */}
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-72" />

      {/* Content skeleton matching the page's actual layout */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border p-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- **Server component** — no `'use client'`.
- `export default function Loading()` — always this exact signature.
- Skeleton layout should **mirror** the actual page content structure.

### error.tsx

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="text-destructive mb-4 size-12" />
      <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
```

- **Must** have `'use client'` — error boundaries are client components.
- **Must** accept `{ error, reset }` props with exact typing shown above.
- **Must** log the error in a `useEffect`.
- Provide both "Try Again" (calls `reset`) and "Go Home" actions.

### not-found.tsx

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground text-8xl font-bold">404</p>
      <h1 className="mt-4 mb-2 text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
```

- **Server component** — no `'use client'`.
- `export default function NotFound()` — always this exact signature.
- Center the content vertically with `min-h-[60vh]`.

---

## Proof of Pattern

These existing files exemplify the patterns above:

| File                                | Pattern                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `src/app/(main)/dashboard/page.tsx` | Server page with metadata, auth, Prisma queries, `Promise.all` |
| `src/app/page.tsx`                  | Public landing page (no auth)                                  |
| `src/app/(main)/layout.tsx`         | Group layout with Header + Footer                              |
| `src/app/layout.tsx`                | Root layout with providers                                     |
| `src/app/loading.tsx`               | Skeleton loading page                                          |
| `src/app/error.tsx`                 | Client error boundary                                          |
| `src/app/not-found.tsx`             | 404 page                                                       |

---

## Anti-Patterns

- **Never** add `'use client'` to a page unless it truly needs client interactivity (extremely rare — extract client parts into separate components instead).
- **Never** use `getServerSideProps` or `getStaticProps` — this is App Router, use async server components.
- **Never** fetch data in a layout that should be fetched in a page.
- **Never** put business logic in a page — extract to `src/lib/` utilities.
- **Never** define reusable UI in a page — extract to `src/components/`.
- **Never** skip the `metadata` export on pages that have a meaningful title.
- **Never** use `try/catch` around `redirect()` — it throws internally and must not be caught.

---

## Checklist

Before committing a new page/layout:

- [ ] File is named exactly `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, or `not-found.tsx`
- [ ] Import order follows the mandatory sequence
- [ ] Function is named `<RouteName>Page` (for pages) or `<RouteName>Layout` (for layouts)
- [ ] `export default` is used (not named export)
- [ ] `metadata` or `generateMetadata` is exported (for pages with titles)
- [ ] Auth check is first in the function body (for protected pages)
- [ ] No `'use client'` unless absolutely necessary (only `error.tsx`)
- [ ] Skeleton in `loading.tsx` mirrors the actual page layout
- [ ] No business logic in the page — delegated to lib utilities
- [ ] No reusable UI defined inline — extracted to components
