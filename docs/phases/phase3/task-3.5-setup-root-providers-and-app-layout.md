---
task_id: 'task-3.5'
title: 'Set Up Root Providers & App Layout'
phase: 3
task_number: 5
status: 'pending'
priority: 'high'
dependencies:
  - 'task-3.1'
  - 'task-3.2'
blocks:
  - 'task-3.6'
  - 'task-4.1'
  - 'task-4.2'
  - 'task-4.3'
created_at: '2026-02-19'
---

# Set Up Root Providers & App Layout

## Current State

> Tasks 3.1-3.4 have configured NextAuth.js v5, middleware, login page, and onboarding flow. However, the root layout does not wrap children in any providers (SessionProvider, QueryClientProvider, ThemeProvider). Client-side hooks like `useSession()` and React Query hooks cannot function without these providers.

- **What exists**:
  - `src/app/layout.tsx` — Minimal root layout with fonts and metadata only, no providers (lines 1-34)
  - `src/providers/` — Empty directory (`.gitkeep` only)
  - `package.json` line 34 — `next-auth@^5.0.0-beta.30` installed (provides `SessionProvider`)
  - `package.json` line 25 — `@tanstack/react-query@^5.90.21` installed (provides `QueryClientProvider`)
  - `package.json` line 26 — `@tanstack/react-query-devtools@^5.91.3` installed
  - `package.json` line 36 — `next-themes@^0.4.6` installed (provides `ThemeProvider`)
  - `package.json` line 42 — `sonner@^2.0.7` installed (provides `Toaster` for toast notifications)
  - `src/components/ui/sonner.tsx` — shadcn/ui Sonner wrapper component
  - `src/app/globals.css` — Tailwind CSS with dark mode CSS variables already configured (oklch color system, `.dark` class support)
  - `src/lib/auth.ts` — NextAuth v5 configuration (created in task 3.1)
- **What is missing**:
  - `src/providers/auth-provider.tsx` — SessionProvider wrapper (client component)
  - `src/providers/query-provider.tsx` — QueryClientProvider wrapper (client component)
  - `src/providers/theme-provider.tsx` — ThemeProvider wrapper (client component)
  - Updated `src/app/layout.tsx` — Wrapping children with all three providers and adding Toaster
- **Relevant code**:
  - `docs/ROADMAP.md` lines 264-277 — Task 3.5 detailed requirements
  - `docs/SENIOR_DEVELOPER.md` lines 55-58 — Root layout with providers specification

---

## Desired Outcome

- **End state**: The root layout wraps all pages with SessionProvider (for `useSession()` access), QueryClientProvider (for React Query hooks), and ThemeProvider (for dark mode toggling). A Toaster component is mounted for toast notifications. React Query DevTools are available in development. All subsequent pages and components can use `useSession()`, React Query hooks, `useTheme()`, and `toast()`.
- **User-facing changes**: None directly visible yet (dark mode toggle and auth UI depend on Phase 4 layout components). However, the infrastructure enables all client-side auth and data features.
- **Developer-facing changes**:
  - `src/providers/auth-provider.tsx` — Client component wrapping `SessionProvider`
  - `src/providers/query-provider.tsx` — Client component wrapping `QueryClientProvider` with configuration
  - `src/providers/theme-provider.tsx` — Client component wrapping `ThemeProvider` from `next-themes`
  - Updated `src/app/layout.tsx` — All providers composed, Toaster added, metadata updated

---

## Scope & Boundaries

### In Scope

- Create `src/providers/auth-provider.tsx` wrapping NextAuth's `SessionProvider`
- Create `src/providers/query-provider.tsx` wrapping React Query's `QueryClientProvider` with default options
- Create `src/providers/theme-provider.tsx` wrapping `next-themes` `ThemeProvider`
- Update `src/app/layout.tsx` to compose all providers and add Toaster
- Add React Query DevTools (conditionally in development mode)
- Configure React Query default options (staleTime, retry, refetchOnWindowFocus)
- Update root metadata (title, description)

### Out of Scope

- Header, navigation, footer components (task 4.1, 4.2 — Phase 4)
- Theme toggle component (Phase 4)
- Landing page / dashboard page (task 4.3 — Phase 4)
- Loading, error, and not-found pages (task 4.4 — Phase 4)
- Any tests (task 3.6)

### Dependencies

- Task 3.1 — NextAuth v5 configuration (provides `SessionProvider`)
- All shadcn/ui components installed (Phase 1)
- Dependencies installed: `next-auth`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `next-themes`, `sonner`

---

## Implementation Details

### Section 1: Create Auth Provider

**What to do**: Create `src/providers/auth-provider.tsx` — a client component that wraps children with NextAuth's `SessionProvider`.

**Where to find context**:

- `docs/ROADMAP.md` lines 265-267 — Auth provider requirements
- NextAuth.js v5 documentation for `SessionProvider`

**Specific requirements**:

- Mark as `"use client"`
- Import `SessionProvider` from `next-auth/react`
- Accept `children: React.ReactNode` as props
- Optionally accept a `session` prop to pass down from the server (for initial session hydration)
- Wrap children with `<SessionProvider>{children}</SessionProvider>`
- Export as named export: `AuthProvider`

**Patterns to follow**:

- Standard Next.js provider pattern (client component wrapping context)

---

### Section 2: Create Query Provider

**What to do**: Create `src/providers/query-provider.tsx` — a client component that wraps children with React Query's `QueryClientProvider`.

**Where to find context**:

- `docs/ROADMAP.md` lines 268-270 — Query provider requirements
- React Query v5 documentation

**Specific requirements**:

- Mark as `"use client"`
- Import `QueryClient`, `QueryClientProvider` from `@tanstack/react-query`
- Import `ReactQueryDevtools` from `@tanstack/react-query-devtools`
- Create the `QueryClient` instance using `useState` or `useRef` to avoid re-creating on every render:
  ```typescript
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  ```
- Wrap children with `<QueryClientProvider client={queryClient}>`
- Add `<ReactQueryDevtools initialIsOpen={false} />` inside the provider (React Query DevTools auto-hide in production)
- Export as named export: `QueryProvider`

**Patterns to follow**:

- React Query v5 Next.js App Router pattern (QueryClient in useState)
- `docs/ROADMAP.md` line 269 — Configure default query options

---

### Section 3: Create Theme Provider

**What to do**: Create `src/providers/theme-provider.tsx` — a client component that wraps children with `next-themes` `ThemeProvider`.

**Where to find context**:

- `docs/ROADMAP.md` lines 271-272 — ThemeProvider requirements
- `src/app/globals.css` — Dark mode CSS variables already configured with `.dark` class
- `docs/ROADMAP.md` line 348 — `attribute="class"` and `defaultTheme="system"`

**Specific requirements**:

- Mark as `"use client"`
- Import `ThemeProvider as NextThemesProvider` from `next-themes`
- Configure with:
  - `attribute="class"` — uses `.dark` class on `<html>` element (matches the CSS variable setup in `globals.css`)
  - `defaultTheme="system"` — respects the user's OS preference
  - `enableSystem={true}` — allow system theme detection
  - `disableTransitionOnChange` — prevent flicker during theme switch
- Wrap children with the configured provider
- Export as named export: `ThemeProvider`

**Patterns to follow**:

- shadcn/ui dark mode documentation pattern
- Must match the existing dark mode CSS in `src/app/globals.css` which uses the `class` strategy

---

### Section 4: Update Root Layout

**What to do**: Update `src/app/layout.tsx` to compose all providers and add the Toaster notification component.

**Where to find context**:

- `docs/ROADMAP.md` lines 271-277 — Root layout update requirements
- Current `src/app/layout.tsx` (lines 1-34)
- `src/components/ui/sonner.tsx` — shadcn/ui Toaster component

**Specific requirements**:

- Import all three providers: `AuthProvider`, `QueryProvider`, `ThemeProvider`
- Import `Toaster` from `@/components/ui/sonner`
- Compose providers in the following order (outermost to innermost):
  1. `ThemeProvider` (outermost — provides theme context to all components)
  2. `AuthProvider` (session context)
  3. `QueryProvider` (data fetching context)
- Add `suppressHydrationWarning` to the `<html>` element (required by `next-themes` to avoid hydration mismatch)
- Add `<Toaster />` inside the body after the provider tree (for toast notifications from `sonner`)
- Keep existing font configuration (`geistSans`, `geistMono`)
- Update metadata:
  - `title`: keep "Recipe Management System" or use a template: `{ default: "Recipe Management System", template: "%s | Recipe Management System" }`
  - `description`: "AI-Enhanced Recipe Management Platform"

**Patterns to follow**:

- Next.js App Router root layout conventions
- Provider composition pattern (nesting order matters for context dependency)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] No hydration mismatch warnings in the browser console

### Functional Verification

- [ ] `src/providers/auth-provider.tsx` exports `AuthProvider` component
- [ ] `src/providers/query-provider.tsx` exports `QueryProvider` component
- [ ] `src/providers/theme-provider.tsx` exports `ThemeProvider` component
- [ ] Root layout wraps all children with all three providers
- [ ] `<Toaster />` is mounted and functional (can trigger a toast notification)
- [ ] `useSession()` hook returns session data on client components when authenticated
- [ ] React Query DevTools icon appears in development mode (bottom-right corner)
- [ ] `useTheme()` hook returns theme information on client components
- [ ] No provider-related errors in the browser console
- [ ] `suppressHydrationWarning` is present on `<html>` element

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Providers are cleanly separated into individual files
- [ ] QueryClient is created in a stable reference (useState or useRef)

---

## Boundary Enforcement Checklist

> Before marking this task as complete, confirm:

- [ ] No changes were made outside the stated scope
- [ ] No features from future tasks were partially implemented
- [ ] No unrelated refactoring or cleanup was performed
- [ ] All new code is traceable to a requirement in this task file
- [ ] If anything out-of-scope was discovered, it was documented as a note below — not implemented

---

## Notes & Discoveries

> Use this section during execution to log anything discovered that is relevant but out of scope. These notes feed into future task definitions.

- _(Empty until task execution begins)_
