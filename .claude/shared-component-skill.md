# Shared Component Skill

> This skill defines the canonical pattern for creating simple, presentational components that do NOT require `'use client'`. These are server-renderable components — static UI pieces, skeletons, wrappers, and layout fragments that have no hooks or interactivity.

---

## When to Use This Pattern

Use this pattern when the component:

- Has **no** `useState`, `useEffect`, or other React hooks
- Has **no** event handlers (`onClick`, `onChange`)
- Has **no** browser API usage
- Is purely **presentational** — takes props, returns JSX, nothing else
- May use `cn()` for conditional classes, but no dynamic behavior

If the component needs interactivity, use the **client-component-skill** instead.

---

## File Naming & Location

- **Naming:** `kebab-case.tsx` (e.g., `page-skeleton.tsx`, `card-skeleton.tsx`, `empty-state.tsx`)
- **Location:**
  - `src/components/shared/` — Cross-cutting presentational components (skeletons, empty states, loading spinners)
  - `src/components/layout/` — Server-renderable layout pieces (footer)

---

## Import Ordering (Mandatory)

```typescript
// 1. Next.js imports (if needed)
import Link from 'next/link';

// 2. Icons (if needed)
import { ChefHat } from 'lucide-react';

// 3. Lib utilities
import { cn } from '@/lib/utils';

// 4. UI component imports
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
```

---

## Complete Templates

### Presentational Component with Optional className

```typescript
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
```

### Static Component with Constants

```typescript
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const FOOTER_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
] as const;

export function Footer() {
  return (
    <>
      <Separator />
      <footer className="text-muted-foreground text-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 md:flex-row md:justify-between lg:px-8">
          <p>&copy; {new Date().getFullYear()} Recipe Management System</p>

          <nav className="flex gap-4" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
```

### Empty State Component

```typescript
import Link from 'next/link';
import { IconName } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="text-muted-foreground mb-4 size-12" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
```

---

## Pattern Details

### No `'use client'` Directive

- Shared components are server-renderable by default.
- If you find yourself needing `'use client'`, the component belongs in `client-component-skill` instead.

### Props Typing

- For simple components with 1-2 props, use inline object typing: `{ className?: string }`.
- For components with 3+ props, define an `interface` above the component.
- Always accept `className?: string` on wrapper components for composition flexibility.

### Constants

- Same rules as client components: module-level, `UPPER_SNAKE_CASE`, `as const`.

### Exports

- **Named exports only** — `export function ComponentName`.
- **No default exports**.
- One primary component per file.

---

## Proof of Pattern

| File                                      | Pattern Demonstrated                               |
| ----------------------------------------- | -------------------------------------------------- |
| `src/components/layout/footer.tsx`        | Static component with constants, no `'use client'` |
| `src/components/shared/page-skeleton.tsx` | Skeleton component with optional `className`       |
| `src/components/shared/card-skeleton.tsx` | Simple skeleton variant                            |

---

## Anti-Patterns

- **Never** add `'use client'` to a presentational component — split interactivity into a separate client component.
- **Never** add event handlers — this component type is static.
- **Never** use React hooks — no `useState`, `useEffect`, etc.
- **Never** use `export default` — always named exports.
- **Never** duplicate skeleton patterns — create a reusable skeleton component and compose.

---

## Checklist

Before committing a new shared component:

- [ ] File does **not** have `'use client'`
- [ ] File is `kebab-case.tsx` in `src/components/shared/` or appropriate domain
- [ ] Import order follows the mandatory sequence
- [ ] Named export (`export function`)
- [ ] Accepts `className?: string` if it's a wrapper component
- [ ] Uses `cn()` for conditional class merging
- [ ] No hooks, no event handlers, no browser APIs
- [ ] Constants are module-level with `UPPER_SNAKE_CASE` and `as const`
