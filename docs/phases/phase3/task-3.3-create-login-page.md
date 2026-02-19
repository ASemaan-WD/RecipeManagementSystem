---
task_id: 'task-3.3'
title: 'Create Login Page'
phase: 3
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-3.1'
  - 'task-3.2'
blocks:
  - 'task-3.6'
created_at: '2026-02-19'
---

# Create Login Page

## Current State

> Tasks 3.1 and 3.2 have configured NextAuth.js v5 with OAuth providers and route protection middleware. The auth infrastructure is in place but there is no login page for users to initiate the OAuth sign-in flow.

- **What exists**:
  - `src/lib/auth.ts` — NextAuth v5 configuration with Google and GitHub providers, exporting `signIn` (created in task 3.1)
  - `src/app/api/auth/[...nextauth]/route.ts` — Auth route handlers (created in task 3.1)
  - `middleware.ts` — Redirects unauthenticated users to `/login` (created in task 3.2)
  - `src/app/(auth)/` — Empty route group directory (`.gitkeep` only, created in Phase 1)
  - `src/components/ui/` — All 27 shadcn/ui components installed (button, card, etc.)
- **What is missing**:
  - `src/app/(auth)/login/page.tsx` — Login page with OAuth sign-in buttons
- **Relevant code**:
  - `docs/ROADMAP.md` lines 239-249 — Task 3.3 detailed requirements
  - `docs/SENIOR_DEVELOPER.md` line 66 — `/login` page specification
  - `docs/PRODUCT_MANAGER.md` line 186 — P0 user story: "As a user, I can sign up and log in"

---

## Desired Outcome

- **End state**: A clean, functional login page at `/login` with "Sign in with Google" and "Sign in with GitHub" buttons. Clicking either button initiates the respective OAuth flow via NextAuth.js v5.
- **User-facing changes**: Users can navigate to `/login` and sign in using Google or GitHub OAuth. The page displays the app logo/name, a brief description, and two styled OAuth buttons.
- **Developer-facing changes**:
  - `src/app/(auth)/login/page.tsx` — Login page component

---

## Scope & Boundaries

### In Scope

- Create `src/app/(auth)/login/page.tsx`
- Design a clean login page with:
  - App logo/name at the top
  - Brief tagline or description
  - "Sign in with Google" button with Google icon
  - "Sign in with GitHub" button with GitHub icon
- Use shadcn/ui components (Card, Button) for styling
- Handle OAuth error states (e.g., display error from URL query params like `?error=OAuthAccountNotLinked`)
- Use server action or client-side `signIn()` from NextAuth to trigger OAuth flows

### Out of Scope

- Username onboarding after first login (task 3.4)
- Layout wrapper with header/footer (task 3.5 — the `(auth)` route group will have its own minimal layout or use the root layout)
- Dark mode toggle on login page (task 3.5)
- Terms of service / privacy policy links (optional per ROADMAP, defer)
- Any tests (task 3.6)

### Dependencies

- Task 3.1 — NextAuth v5 configuration with `signIn` export
- Task 3.2 — Middleware that redirects authenticated users away from `/login`

---

## Implementation Details

### Section 1: Create Login Page Component

**What to do**: Create the login page at `src/app/(auth)/login/page.tsx`.

**Where to find context**:

- `docs/ROADMAP.md` lines 239-249 — Login page requirements
- `docs/SENIOR_DEVELOPER.md` line 66 — Login page spec
- `docs/PRODUCT_MANAGER.md` lines 25-28 — Guest access requirements (guests must log in)

**Specific requirements**:

- The page is a Server Component by default but may need client interactivity for the sign-in buttons — use `"use client"` if calling `signIn()` client-side, or use server actions
- Page structure:
  1. Centered card layout (vertical center of viewport)
  2. App name/logo: "Recipe Management System" (or a styled heading)
  3. Tagline: brief description of the app (e.g., "Your AI-powered recipe companion")
  4. Separator/divider
  5. "Sign in with Google" button — styled with a Google icon (use an inline SVG or Lucide icon)
  6. "Sign in with GitHub" button — styled with a GitHub icon (use Lucide's `Github` icon from `lucide-react`)
  7. Both buttons should be full-width within the card
- Use shadcn/ui `Card`, `CardHeader`, `CardContent`, `CardDescription`, `CardTitle`, and `Button` components
- Sign-in behavior:
  - Google button: calls `signIn("google", { callbackUrl: "/dashboard" })`
  - GitHub button: calls `signIn("github", { callbackUrl: "/dashboard" })`
  - The `callbackUrl` ensures users are sent to the dashboard after successful login (middleware will then redirect to `/onboarding` if no username)
- Error handling:
  - Read `searchParams.error` from the URL (NextAuth appends `?error=...` on failures)
  - Display a user-friendly error message for known errors:
    - `OAuthAccountNotLinked`: "This email is already associated with another account. Try signing in with a different provider."
    - Default: "Something went wrong. Please try again."
  - Use shadcn/ui `Alert` component for error display

**Patterns to follow**:

- shadcn/ui component usage patterns from existing `src/components/ui/` directory
- Next.js App Router page conventions (default export, `searchParams` prop for server components)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `/login` page renders with app name, tagline, and two OAuth buttons
- [ ] "Sign in with Google" button triggers Google OAuth flow
- [ ] "Sign in with GitHub" button triggers GitHub OAuth flow
- [ ] Error messages display correctly when `?error=...` is present in the URL
- [ ] Page is responsive (looks good on mobile and desktop)
- [ ] Authenticated users are redirected away from `/login` by middleware (task 3.2)
- [ ] Page uses shadcn/ui Card and Button components

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Icons for Google and GitHub are properly rendered

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

- The 3 Turbopack build warnings about `node:path`, `node:url`, and `node:buffer` in Edge Runtime are pre-existing (from Prisma client used in middleware via auth.ts). Not introduced by this task.
- The `Separator` component from shadcn/ui is `"use client"` internally but renders fine inside the Server Component login page — Next.js handles the client boundary at the component level.
- Next.js 16 types `searchParams` as `Promise<Record<string, string | string[] | undefined>>` — must be awaited in async Server Components. This is the first page in the codebase to use this pattern.
