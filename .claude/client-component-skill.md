# Client Component Skill

> This skill defines the canonical pattern for creating interactive client components — components that use `'use client'` because they need browser APIs, event handlers, React hooks (useState, useEffect, etc.), or third-party client libraries. These are feature-level components, not UI primitives (see `ui-component-skill.md` for those).

---

## When to Use This Pattern

Use this pattern when the component needs ANY of:

- `useState`, `useEffect`, `useRef`, or other React hooks
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`localStorage`, `window`, `document`)
- Client-side libraries (`useSession`, `useTheme`, `useQuery`)
- Controlled form inputs

If the component is purely presentational (no hooks, no interactivity), use the **shared-component-skill** instead.

---

## File Naming & Location

- **Naming:** `kebab-case.tsx` (e.g., `header.tsx`, `mobile-nav.tsx`, `recipe-card.tsx`)
- **Location by domain:**
  - `src/components/layout/` — Header, footer, navigation, theme toggle
  - `src/components/recipes/` — Recipe-specific components (card, form, detail, grid)
  - `src/components/social/` — Ratings, comments, sharing
  - `src/components/search/` — Search bar, filters
  - `src/components/ai/` — AI feature components

---

## Internal Structure (Mandatory Order)

Every client component file follows this exact section order:

```typescript
// ─── 1. 'use client' directive ───
'use client';

// ─── 2. Imports (see import ordering below) ───

// ─── 3. Constants (module-level, UPPER_SNAKE_CASE, `as const`) ───

// ─── 4. Helper functions (module-level, before the component) ───

// ─── 5. Props interface (if component accepts props) ───

// ─── 6. Component function (named export) ───

// ─── 7. Additional exports (if file exports multiple related components) ───
```

---

## Import Ordering (Mandatory)

```typescript
// 1. React built-ins
import { useState, useEffect, useCallback } from 'react';

// 2. Next.js imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 3. Third-party libraries
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';

// 4. Icons
import { Search, Menu, Plus, BookOpen } from 'lucide-react';

// 5. UI component imports (@/components/ui/)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// 6. Feature / layout / shared component imports
import { MobileNav } from '@/components/layout/mobile-nav';
import { RecipeCard } from '@/components/recipes/recipe-card';

// 7. Hooks, lib, types, constants
import { useRecipes } from '@/hooks/use-recipes';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types/recipe';
```

---

## Complete Template

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconName } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Item One', href: '/one', icon: IconName },
  { label: 'Item Two', href: '/two', icon: IconName },
] as const;

function helperFunction(input: string): string {
  // Pure helper logic — no React hooks allowed here
  return input.toUpperCase();
}

interface ComponentNameProps {
  propOne: string;
  propTwo?: boolean;
  onAction: (value: string) => void;
}

export function ComponentName({ propOne, propTwo = false, onAction }: ComponentNameProps) {
  const [state, setState] = useState(false);

  function handleClick() {
    setState(true);
    onAction(propOne);
  }

  return (
    <div className={cn('base-classes', propTwo && 'conditional-class')}>
      {NAV_ITEMS.map((item) => (
        <Button key={item.href} variant="ghost" size="sm" asChild>
          <Link href={item.href}>
            <item.icon className="size-4" />
            {item.label}
          </Link>
        </Button>
      ))}
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

---

## Pattern Details

### Constants

- Define at **module level**, above the component function.
- Use `UPPER_SNAKE_CASE` naming.
- Always add `as const` for literal arrays/objects.
- Type is inferred — do not add explicit type annotations on `as const` arrays.

```typescript
const DESKTOP_NAV_ITEMS = [
  { label: 'My Recipes', href: '/my-recipes', icon: BookOpen },
  { label: 'Community', href: '/community', icon: Users },
] as const;
```

### Helper Functions

- Define at **module level**, above the component function.
- Must be **pure functions** — no React hooks, no side effects.
- Use regular `function` declarations (not arrow functions) for hoisting clarity.

```typescript
function getUserInitials(name: string | null | undefined): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return 'U';
}
```

### Props Interface

- Define **immediately above** the component function.
- Name as `<ComponentName>Props`.
- Use `interface`, not `type`.
- Define inline in the same file — do NOT put in `src/types/` unless the interface is shared across 3+ files.

```typescript
interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name?: string | null } | null;
  isAuthenticated: boolean;
}
```

### Exports

- **Named exports only** — `export function ComponentName`.
- **No default exports** for components.
- A file may export **multiple related components** if they are tightly coupled (e.g., `ThemeToggle` and `ThemeToggleMenuItem`).

### Event Handlers

- Define as **regular functions** inside the component (not arrow functions).
- Name with `handle` prefix: `handleClick`, `handleSubmit`, `handleLinkClick`.

```typescript
export function MyComponent() {
  const [open, setOpen] = useState(false);

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  return <Button onClick={handleToggle}>Toggle</Button>;
}
```

---

## Proof of Pattern

| File                                     | Pattern Demonstrated                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/layout/header.tsx`       | Constants, helper function, state, conditional rendering, dropdown menu |
| `src/components/layout/mobile-nav.tsx`   | Props interface, event handlers, Sheet component usage                  |
| `src/components/layout/theme-toggle.tsx` | Inline hook, multiple exports from one file                             |

---

## Anti-Patterns

- **Never** use `'use client'` if the component has no hooks or interactivity — use a shared component instead.
- **Never** define constants inside the component function — they get recreated on every render.
- **Never** use arrow functions for event handlers inside the component — use `function` declarations.
- **Never** use `export default` — always use named exports.
- **Never** put a props interface in `src/types/` unless it's shared by 3+ files.
- **Never** duplicate helper functions across components — extract to `src/lib/` if used in 2+ files.
- **Never** inline complex logic in JSX — extract to a helper function or variable above the return.
- **Never** use `any` for prop types — define proper interfaces.

---

## Checklist

Before committing a new client component:

- [ ] File starts with `'use client'`
- [ ] File is `kebab-case.tsx` in the correct domain directory
- [ ] Import order follows the mandatory sequence
- [ ] Constants are module-level with `UPPER_SNAKE_CASE` and `as const`
- [ ] Helper functions are module-level and pure
- [ ] Props interface is named `<ComponentName>Props` and defined inline
- [ ] Component uses named export (`export function`)
- [ ] Event handlers use `handle` prefix and `function` declaration
- [ ] No duplicated helper functions (checked other components first)
- [ ] `cn()` is used for conditional class merging
