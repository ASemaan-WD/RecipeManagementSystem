# Custom Hook Skill

> This skill defines the canonical pattern for creating custom React hooks. Hooks encapsulate reusable stateful logic — data fetching (React Query), mutations with optimistic updates, debounced values, timers, and other patterns that multiple components share.

---

## When to Use This Pattern

Create a custom hook when:

- **Reusable logic**: The same stateful logic is needed by 2+ components
- **Complex state**: A component's hook usage is getting complex enough to warrant extraction
- **React Query wrapper**: You need a typed wrapper around `useQuery` or `useMutation`
- **Browser API abstraction**: You need to wrap `localStorage`, `IntersectionObserver`, timers, etc.

Do NOT create a hook for:

- Pure functions without React state — put those in `src/lib/` instead
- Logic used by exactly one component — keep it inline in that component

---

## File Naming & Location

- **Naming:** `use-<name>.ts` or `use-<name>.tsx` (kebab-case with `use-` prefix)
  - `.ts` when the hook returns data/state only
  - `.tsx` only if the hook returns JSX (extremely rare — avoid if possible)
- **Location:** `src/hooks/`
- **Examples:** `use-recipes.ts`, `use-search.ts`, `use-timer.ts`, `use-debounce.ts`

---

## Import Ordering (Mandatory)

```typescript
// 1. React built-ins
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 2. Third-party libraries
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 3. Lib utilities and API functions
import { cn } from '@/lib/utils';

// 4. Types
import type { Recipe } from '@/types/recipe';
```

---

## Complete Templates

### React Query Data Fetching Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import type { Recipe } from '@/types/recipe';

interface UseRecipesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

interface UseRecipesResult {
  recipes: Recipe[];
  total: number;
}

async function fetchRecipes(
  options: UseRecipesOptions
): Promise<UseRecipesResult> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('q', options.search);

  const res = await fetch(`/api/recipes?${params}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export function useRecipes(options: UseRecipesOptions = {}) {
  return useQuery({
    queryKey: ['recipes', options],
    queryFn: () => fetchRecipes(options),
  });
}
```

### Mutation Hook with Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TagStatus } from '@/generated/prisma/client';

interface AddTagVariables {
  recipeId: string;
  status: TagStatus;
}

async function addTag({ recipeId, status }: AddTagVariables): Promise<void> {
  const res = await fetch(`/api/recipes/${recipeId}/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to add tag');
}

export function useAddTag(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: TagStatus) => addTag({ recipeId, status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] });
      const previous = queryClient.getQueryData(['recipe', recipeId]);

      queryClient.setQueryData(['recipe', recipeId], (old: unknown) => ({
        ...(old as Record<string, unknown>),
        userTags: [
          ...((old as Record<string, unknown[]>)?.userTags ?? []),
          { status },
        ],
      }));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['recipe', recipeId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
    },
  });
}
```

### Simple Utility Hook

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Browser API Hook

```typescript
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
```

---

## Pattern Details

### Naming Convention

- Hook function: `use<PascalCaseName>` (e.g., `useRecipes`, `useDebounce`, `useTimer`)
- File name: `use-<kebab-case-name>.ts` (e.g., `use-recipes.ts`, `use-debounce.ts`)
- The `use` prefix is **mandatory** — React enforces this for hooks.

### API Fetcher Functions

- Define the `fetch` function **in the same file**, above the hook.
- Name it descriptively: `fetchRecipes`, `addTag`, `deleteComment`.
- Return typed data — no `any`.
- Throw errors for non-OK responses — React Query catches them.

### Return Types

- **React Query hooks**: Return the `useQuery` / `useMutation` result directly — don't destructure and re-wrap.
- **Simple hooks**: Return the value directly (e.g., `return debouncedValue`).
- **Complex hooks**: Return an object with named properties.

### Exports

- **Named exports only**: `export function useXxx`.
- **One primary hook per file**.
- Related hooks (e.g., `useAddTag` and `useRemoveTag`) may share a file if they share the same fetcher.

### Query Key Convention

- Use arrays: `['entity', id, options]`
- Be consistent:
  - List: `['recipes', filterOptions]`
  - Detail: `['recipe', recipeId]`
  - Related: `['recipe', recipeId, 'comments']`

---

## Proof of Pattern

| File                                                      | Pattern Demonstrated                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/theme-toggle.tsx` (`useIsMounted`) | Inline utility hook using `useSyncExternalStore`                                                                        |
| `docs/SENIOR_DEVELOPER.md` (Phase 2-7)                    | Planned hooks: `useRecipes`, `useTags`, `useSearch`, `useRating`, `useComments`, `useAI`, `useTimer`, `useShoppingList` |

---

## Anti-Patterns

- **Never** create a hook for pure logic — use a regular function in `src/lib/` instead.
- **Never** return JSX from a hook — hooks return data/state, components return JSX.
- **Never** use `any` for return types or parameters — type everything.
- **Never** call hooks conditionally — React rules of hooks apply.
- **Never** put fetcher functions in a separate file from their hook — co-locate them.
- **Never** create a hook used by only one component — keep it inline until reuse is needed.
- **Never** use `export default` — always named exports.
- **Never** break React Query key conventions — keep them consistent across the app.

---

## Checklist

Before committing a new hook:

- [ ] File is named `use-<name>.ts` in `src/hooks/`
- [ ] Hook function is named `use<PascalCaseName>`
- [ ] Import order follows the mandatory sequence
- [ ] Named export: `export function useXxx`
- [ ] Fetcher function is co-located in the same file (for React Query hooks)
- [ ] Return type is fully typed — no `any`
- [ ] Query keys follow the array convention: `['entity', id, options]`
- [ ] Hook is used by 2+ components (or will be) — not created prematurely
- [ ] No JSX returned from the hook
- [ ] Optimistic updates include `onMutate`, `onError` (rollback), and `onSettled` (invalidate)
