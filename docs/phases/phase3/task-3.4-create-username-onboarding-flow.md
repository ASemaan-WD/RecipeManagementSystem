---
task_id: 'task-3.4'
title: 'Create Username Onboarding Flow'
phase: 3
task_number: 4
status: 'pending'
priority: 'high'
dependencies:
  - 'task-3.1'
  - 'task-3.2'
blocks:
  - 'task-3.6'
created_at: '2026-02-19'
---

# Create Username Onboarding Flow

## Current State

> Tasks 3.1 and 3.2 have configured NextAuth.js v5 and middleware. The middleware redirects authenticated users without a username to `/onboarding`. The User model has a nullable `username` field. No onboarding page or username API route exists yet.

- **What exists**:
  - `src/lib/auth.ts` — NextAuth v5 configuration with JWT callbacks that include `username` (nullable) in session (created in task 3.1)
  - `middleware.ts` — Redirects authenticated users without username to `/onboarding` (created in task 3.2)
  - `prisma/schema.prisma` line 42 — `username String? @unique` on User model
  - `src/app/(auth)/` — Empty route group directory (`.gitkeep` only)
  - `src/components/ui/` — shadcn/ui components: `input`, `button`, `card`, `label`, `form` available
  - `package.json` line 41 — `react-hook-form@^7.71.1` installed
  - `package.json` line 44 — `zod@^4.3.6` installed
  - `package.json` line 22 — `@hookform/resolvers@^5.2.2` installed
- **What is missing**:
  - `src/app/(auth)/onboarding/page.tsx` — Onboarding page with username form
  - `src/app/api/auth/username/route.ts` — API route for setting username and checking availability
  - `src/lib/validations/auth.ts` — Zod schema for username validation
- **Relevant code**:
  - `docs/ROADMAP.md` lines 253-262 — Task 3.4 detailed requirements
  - `docs/SENIOR_DEVELOPER.md` lines 1013-1025 — Username rules (locked decisions) with Zod schema
  - `docs/SENIOR_DEVELOPER.md` line 65 — Onboarding page spec

---

## Desired Outcome

- **End state**: After first OAuth login, users without a username are redirected to `/onboarding` where they must set a unique username. The username is validated client-side (regex, length) and server-side (uniqueness check via API). Once set, the username is permanently locked and the user is redirected to `/dashboard`. A Zod validation schema for username is reusable across frontend and API.
- **User-facing changes**: First-time users see an onboarding page prompting them to choose a username. Real-time availability checking provides immediate feedback. After setting a username, they proceed to the dashboard.
- **Developer-facing changes**:
  - `src/app/(auth)/onboarding/page.tsx` — Onboarding page component
  - `src/app/api/auth/username/route.ts` — POST (set username) and GET (check availability) handlers
  - `src/lib/validations/auth.ts` — Zod schema for username validation

---

## Scope & Boundaries

### In Scope

- Create `src/lib/validations/auth.ts` with username Zod schema
- Create `src/app/api/auth/username/route.ts` with:
  - GET handler: check username availability
  - POST handler: set username for authenticated user
- Create `src/app/(auth)/onboarding/page.tsx` with:
  - Username input field with validation
  - Real-time availability check (debounced API call)
  - "Continue" button (disabled until valid + available)
  - Explanation that username cannot be changed
- Update the JWT token with the new username after it's set (so the session reflects the change immediately)

### Out of Scope

- Login page (task 3.3)
- Root providers and layout (task 3.5)
- Profile editing / username change (username is immutable per spec)
- Any tests (task 3.6)

### Dependencies

- Task 3.1 — NextAuth v5 configuration with session including `username`
- Task 3.2 — Middleware redirecting users without username to `/onboarding`

---

## Implementation Details

### Section 1: Create Username Validation Schema

**What to do**: Create `src/lib/validations/auth.ts` with a Zod schema for username validation.

**Where to find context**:

- `docs/SENIOR_DEVELOPER.md` lines 1013-1025 — Username rules with exact Zod schema
- `docs/ROADMAP.md` line 255 — Validation regex: `^[a-zA-Z0-9_]{3,20}$`

**Specific requirements**:

- Create a `usernameSchema` using Zod:
  ```typescript
  const usernameSchema = z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');
  ```
- Export the schema for reuse in both the frontend form and the API route
- Note: Zod v4 is installed (`zod@^4.3.6`) — verify import syntax is compatible

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` line 861 — `src/lib/validators.ts` in the file structure (ROADMAP uses `src/lib/validations/` directory — use the directory approach for organization)

---

### Section 2: Create Username API Route

**What to do**: Create `src/app/api/auth/username/route.ts` with GET (availability check) and POST (set username) handlers.

**Where to find context**:

- `docs/ROADMAP.md` lines 259-262 — API route specification
- `docs/SENIOR_DEVELOPER.md` line 54 — Username capture requirement

**Specific requirements**:

1. **GET `/api/auth/username?username=...`** — Check availability:
   - No authentication required for the availability check (the form needs to check before the user is fully onboarded)
   - Read `username` from query params
   - Validate against `usernameSchema`
   - Query database: `prisma.user.findUnique({ where: { username } })`
   - Return `{ available: true }` or `{ available: false }`
   - Return 400 if username fails validation (with error message)

2. **POST `/api/auth/username`** — Set username:
   - Require authentication (use `requireAuth()` from `src/lib/auth-utils.ts`)
   - Read `{ username }` from request body
   - Validate against `usernameSchema`
   - Check that the authenticated user does NOT already have a username set (immutability enforcement)
     - If username already set → return 400 `{ error: "Username already set and cannot be changed" }`
   - Check availability (findUnique)
     - If taken → return 409 `{ error: "Username is already taken" }`
   - Update the user record: `prisma.user.update({ where: { id: session.user.id }, data: { username } })`
   - Return 200 `{ username }` on success
   - The session/JWT will reflect the new username on the next auth check (the `jwt` callback reads from the database)

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` lines 928-935 — `requireAuth()` pattern
- Prisma client import: `import { prisma } from '@/lib/db'`
- Next.js App Router API route pattern (named exports for HTTP methods)

---

### Section 3: Create Onboarding Page

**What to do**: Create `src/app/(auth)/onboarding/page.tsx` with a username setup form.

**Where to find context**:

- `docs/ROADMAP.md` lines 253-262 — Onboarding page requirements
- `docs/SENIOR_DEVELOPER.md` line 65 — Onboarding page spec
- `docs/SENIOR_DEVELOPER.md` lines 1013-1019 — Username display rules

**Specific requirements**:

- This is a client component (`"use client"`) for form interactivity
- Use React Hook Form with Zod resolver (`@hookform/resolvers/zod`)
- Import and use `usernameSchema` from `@/lib/validations/auth`
- Page structure (centered card layout, similar to login page):
  1. Heading: "Choose your username"
  2. Explanation text: "Your username is permanent and cannot be changed later. It will be used for sharing recipes."
  3. Username input field with:
     - Label: "Username"
     - Placeholder: e.g., "chef_john"
     - Inline validation errors (from Zod)
     - Availability status indicator (loading spinner, green checkmark, red X)
  4. "Continue" button — disabled until:
     - Input passes Zod validation
     - Availability check returns `available: true`
     - Form is not currently submitting
- Real-time availability check:
  - Debounce the input by 300-500ms before making the API call
  - Only check availability if the input passes Zod validation first
  - Call `GET /api/auth/username?username=...`
  - Show availability status next to the input
- Form submission:
  - Call `POST /api/auth/username` with `{ username }`
  - On success: redirect to `/dashboard` using `router.push('/dashboard')`
  - On error: display error message (toast or inline)
  - Handle race condition: if username was taken between availability check and submission, show the 409 error gracefully
- Use shadcn/ui components: `Card`, `CardHeader`, `CardContent`, `Button`, `Input`, `Label`, `Form` (from shadcn/ui form component)

**Patterns to follow**:

- React Hook Form + Zod resolver pattern (shadcn/ui `Form` component integrates with react-hook-form)
- Debounce pattern for availability check (use `setTimeout`/`clearTimeout` or a custom hook)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `src/lib/validations/auth.ts` exports `usernameSchema`
- [ ] `usernameSchema` rejects usernames shorter than 3 characters
- [ ] `usernameSchema` rejects usernames longer than 20 characters
- [ ] `usernameSchema` rejects usernames with special characters (hyphens, spaces, etc.)
- [ ] `usernameSchema` accepts valid usernames (alphanumeric + underscores)
- [ ] `GET /api/auth/username?username=available_name` returns `{ available: true }`
- [ ] `GET /api/auth/username?username=taken_name` returns `{ available: false }`
- [ ] `GET /api/auth/username?username=ab` returns 400 (too short)
- [ ] `POST /api/auth/username` sets the username for an authenticated user
- [ ] `POST /api/auth/username` returns 401 for unauthenticated requests
- [ ] `POST /api/auth/username` returns 400 if user already has a username
- [ ] `POST /api/auth/username` returns 409 if username is taken
- [ ] Onboarding page renders with username input and "Continue" button
- [ ] Availability check fires after debounce delay
- [ ] "Continue" button is disabled until username is valid and available
- [ ] Successful submission redirects to `/dashboard`

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Username validation schema is shared between frontend and API

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

- **Zod v4 `noUncheckedIndexedAccess` interaction**: With `noUncheckedIndexedAccess: true` in tsconfig, accessing `error.issues[0].message` after `safeParse` requires optional chaining (`issues[0]?.message`) since the array index access returns `T | undefined`. This applies to all Zod validation error handling in API routes.
- **SessionProvider needed for onboarding**: The onboarding page wraps its form in a local `SessionProvider` to enable `useSession().update()` for JWT refresh after username is set. Task 3.5 (Root Providers & App Layout) should add a global `SessionProvider`, at which point the local wrapper in the onboarding page can be removed.
- **JWT callback `trigger === 'update'`**: Added to `src/lib/auth.ts` to support re-reading username from the database when the client calls `session.update()`. This was required by the task scope (line 66) and is essential for the onboarding flow to work correctly — without it, the middleware would keep redirecting to `/onboarding` after username is set.
