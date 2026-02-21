# Provider Component Skill

> This skill defines the canonical pattern for creating React context providers. Providers wrap third-party or custom context libraries and are composed in the root layout. Every provider follows the same minimal wrapper pattern.

---

## When to Use This Pattern

Use this pattern when you need to:

- Wrap a third-party library's provider (next-themes, React Query, NextAuth)
- Create a custom React context for app-wide state
- Make client-side state available to the component tree

---

## File Naming & Location

- **Naming:** `<name>-provider.tsx` (e.g., `theme-provider.tsx`, `query-provider.tsx`, `auth-provider.tsx`)
- **Location:** `src/providers/`
- **Always** kebab-case with `-provider` suffix.

---

## Import Ordering (Mandatory)

```typescript
// 1. 'use client' directive (always required)
'use client';

// 2. React built-ins (if needed for custom context)
import { createContext, useContext, useState } from 'react';

// 3. Third-party library provider
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// 4. Types (if needed)
import type { ReactNode } from 'react';
```

---

## Complete Templates

### Library Wrapper Provider (Most Common)

```typescript
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Provider with Client-Side Configuration

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Custom Context Provider

```typescript
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
```

---

## Pattern Details

### `'use client'` Is Always Required

- Providers use React context or client-side libraries, which require `'use client'`.
- No exceptions.

### Children Typing

- Always type as `{ children: React.ReactNode }`.
- No additional props on simple wrapper providers.
- For configurable providers, add props alongside `children`.

### Custom Context Pattern

When creating a custom context:

1. Define the context value interface.
2. Create the context with `createContext<T | null>(null)`.
3. Export a `useXxx()` hook that throws if used outside the provider.
4. Export the `XxxProvider` component.

### Composition in Root Layout

Providers are composed in `src/app/layout.tsx`:

```typescript
<AuthProvider>
  <QueryProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </QueryProvider>
</AuthProvider>
```

**Nesting order (outermost to innermost):**

1. AuthProvider (session context needed by everything)
2. QueryProvider (data fetching layer)
3. ThemeProvider (visual, innermost)
4. Any custom providers

### Exports

- **Named export** for the provider function: `export function XxxProvider`.
- **Named export** for the custom hook (if applicable): `export function useXxx`.
- **No default exports**.

---

## Proof of Pattern

| File                               | Pattern Demonstrated                    |
| ---------------------------------- | --------------------------------------- |
| `src/providers/theme-provider.tsx` | Simple library wrapper                  |
| `src/providers/query-provider.tsx` | Provider with client-side configuration |
| `src/providers/auth-provider.tsx`  | NextAuth SessionProvider wrapper        |

---

## Anti-Patterns

- **Never** skip `'use client'` — providers are always client components.
- **Never** put business logic in a provider — providers just provide context/state.
- **Never** create a provider for a single component — use local state instead.
- **Never** export the raw context object — always export a `useXxx()` hook wrapper.
- **Never** use `export default` — always named exports.
- **Never** put the provider file anywhere except `src/providers/`.

---

## Checklist

Before committing a new provider:

- [ ] File starts with `'use client'`
- [ ] File is named `<name>-provider.tsx` in `src/providers/`
- [ ] Children typed as `{ children: React.ReactNode }`
- [ ] Named export: `export function XxxProvider`
- [ ] Custom context hook exported as `export function useXxx` (if custom context)
- [ ] Custom context hook throws if used outside provider
- [ ] Provider is registered in the root layout with correct nesting order
- [ ] No business logic in the provider
