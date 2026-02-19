---
task_id: 'task-4.1'
title: 'Create Header & Navigation (Desktop + Mobile)'
phase: 4
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-3.5'
  - 'task-3.1'
blocks:
  - 'task-4.2'
  - 'task-4.3'
  - 'task-4.5'
created_at: '2026-02-19'
---

# Create Header & Navigation (Desktop + Mobile)

## Current State

> Phase 3 is complete. Root providers (AuthProvider, QueryProvider, ThemeProvider) are configured in `src/app/layout.tsx`. Auth is fully functional with NextAuth v5 (Google + GitHub OAuth, JWT sessions). The `src/components/layout/` directory exists but contains only a `.gitkeep` placeholder — no layout components have been built yet.

- **What exists**:
  - `src/app/layout.tsx` — Root layout with ThemeProvider > AuthProvider > QueryProvider composition, Toaster mounted, Geist fonts configured
  - `src/providers/auth-provider.tsx` — SessionProvider wrapper (enables `useSession()` on client)
  - `src/providers/theme-provider.tsx` — ThemeProvider with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - `src/lib/auth.ts` — NextAuth v5 config exporting `auth`, `signIn`, `signOut`
  - `middleware.ts` — Route protection (protects `/dashboard`, `/recipes/new`, `/my-recipes`, `/my-collection`, `/shopping-lists`, `/settings`, `/shared-with-me`)
  - `src/components/ui/` — 27 shadcn/ui components installed, including: `button`, `dropdown-menu`, `avatar`, `sheet`, `separator`, `badge`, `tooltip`, `skeleton`
  - `src/components/layout/` — Empty directory (`.gitkeep` only)
  - `lucide-react@^0.574.0` — Icon library installed
- **What is missing**:
  - `src/components/layout/header.tsx` — App header with logo, search placeholder, nav links, user dropdown, Add Recipe CTA, mobile trigger
  - `src/components/layout/mobile-nav.tsx` — Mobile sheet/drawer navigation
- **Relevant code**:
  - `docs/ROADMAP.md` lines 296-310 — Task 4.1 full requirements
  - `docs/SENIOR_DEVELOPER.md` lines 59-61 — Header component spec (logo, nav links, auth state, dark mode toggle, search)
  - `docs/SENIOR_DEVELOPER.md` line 62 — Navigation spec (responsive sidebar/navbar: My Recipes, Community, AI Tools, My Collection, Shopping Lists)
  - `docs/PRODUCT_MANAGER.md` lines 96-100 — Mobile-first, touch-friendly, 44px tap targets
  - `docs/CTO_SPECS.md` lines 39-45 — Frontend stack (shadcn/ui + Tailwind CSS)

---

## Desired Outcome

- **End state**: A fully functional, responsive header component and mobile navigation drawer. The header renders app logo, placeholder search bar, navigation links, user avatar dropdown (with sign out, profile, dark mode toggle), and an "Add Recipe" CTA button. On mobile, a hamburger icon opens a Sheet drawer with full navigation. Both adapt to authenticated vs. unauthenticated states.
- **User-facing changes**: Users see a persistent header across the app with navigation, their avatar, and a way to add recipes. On mobile, a hamburger menu provides full navigation.
- **Developer-facing changes**:
  - `src/components/layout/header.tsx` — Desktop/tablet header component
  - `src/components/layout/mobile-nav.tsx` — Mobile navigation drawer (Sheet)

---

## Scope & Boundaries

### In Scope

- Create `src/components/layout/header.tsx` with: app logo (linked to `/` or `/dashboard`), placeholder search bar (non-functional, wired in Phase 7), navigation links (My Recipes, Community, Shopping Lists), user avatar dropdown menu (profile link, settings link, sign out action), "Add Recipe" button (links to `/recipes/new`), mobile hamburger trigger
- Create `src/components/layout/mobile-nav.tsx` with: Sheet/drawer sliding from left, full navigation links, user info section, sign out button
- Handle authenticated vs. unauthenticated states (show login button when not authenticated, avatar dropdown when authenticated)
- Responsive design: full header on desktop/tablet, hamburger + mobile nav on small screens
- Ensure touch targets are at least 44px on mobile
- Use shadcn/ui components: `DropdownMenu`, `Avatar`, `Button`, `Sheet`, `Separator`

### Out of Scope

- Functional search bar (Phase 7 — Task 7.2 wires the search)
- Theme toggle component (task 4.4 creates the toggle — header provides a slot for it)
- Main app layout wrapping pages (task 4.2)
- Footer component (task 4.2)
- Landing page / dashboard page content (task 4.3)
- Any API routes or data fetching
- Tests (task 4.5)

### Dependencies

- Task 3.5 — Root providers configured (SessionProvider for `useSession()`, ThemeProvider)
- Task 3.1 — NextAuth v5 config (`signOut` export)
- shadcn/ui components installed (Phase 1): `button`, `dropdown-menu`, `avatar`, `sheet`, `separator`
- `lucide-react` installed for icons

---

## Implementation Details

### Section 1: Header Component

**What to do**: Create `src/components/layout/header.tsx` — the main application header.

**Where to find context**:

- `docs/ROADMAP.md` lines 296-304 — Full header requirements
- `docs/SENIOR_DEVELOPER.md` lines 59-61 — Header spec
- `docs/PRODUCT_MANAGER.md` line 91 — Pinterest/card design with clean hierarchy

**Specific requirements**:

- Mark as `"use client"` (needs `useSession()` hook)
- App logo/name on the left (linked to `/dashboard` for authenticated users, `/` for guests)
- Search bar placeholder in the center area (an `Input` with search icon, disabled or non-functional — wired in Phase 7)
- Navigation links visible on desktop/tablet (`md:` breakpoint and up):
  - "My Recipes" → `/my-recipes`
  - "Community" → `/community`
  - "Shopping Lists" → `/shopping-lists`
- "Add Recipe" button (prominent CTA, links to `/recipes/new`) — visible on desktop
- User avatar dropdown (authenticated state):
  - User's avatar image (fallback to initials or default icon)
  - User's name/username display
  - Separator
  - "My Collection" → `/my-collection`
  - "Settings" → `/settings`
  - Separator
  - Placeholder slot for dark mode toggle (will be added in task 4.4)
  - Separator
  - "Sign Out" action (calls `signOut()` from NextAuth)
- Login button (unauthenticated state):
  - "Sign In" button linking to `/login`
- Mobile hamburger icon (`Menu` from lucide-react) visible on small screens only (`md:hidden`)
- Sticky/fixed header with `z-50` for overlay behavior
- Appropriate padding, max-width container, and responsive spacing
- Use `next/link` for all navigation links

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` — Component naming and structure conventions
- shadcn/ui DropdownMenu pattern for the user avatar menu
- Next.js `useSession()` for auth state detection
- `signOut` from `next-auth/react` for logout action

---

### Section 2: Mobile Navigation Drawer

**What to do**: Create `src/components/layout/mobile-nav.tsx` — a mobile navigation drawer using shadcn/ui Sheet.

**Where to find context**:

- `docs/ROADMAP.md` lines 305-310 — Mobile navigation requirements
- `docs/PRODUCT_MANAGER.md` lines 96-100 — Mobile-first, touch-friendly, 44px tap targets

**Specific requirements**:

- Uses shadcn/ui `Sheet` component with `side="left"`
- Triggered by the hamburger icon in the header
- Uses controlled state (open/close) shared with header via props or state
- Contains:
  - App logo/name at the top
  - User info section (avatar, name, username) when authenticated
  - Full navigation links (same as desktop plus additional entries):
    - "Dashboard" → `/dashboard`
    - "My Recipes" → `/my-recipes`
    - "Community" → `/community`
    - "My Collection" → `/my-collection`
    - "Shopping Lists" → `/shopping-lists`
    - "Add Recipe" → `/recipes/new`
    - Separator
    - "Settings" → `/settings`
  - Placeholder area for dark mode toggle (task 4.4)
  - "Sign Out" button at the bottom (authenticated)
  - "Sign In" button (unauthenticated)
- Auto-closes when a navigation link is clicked (using `onOpenChange` or `setOpen(false)` in link click handlers)
- All touch targets minimum 44px height
- Smooth transition animation (Sheet handles this by default)

**Patterns to follow**:

- shadcn/ui Sheet component usage pattern
- `next/link` with `onClick` to close the sheet on navigation
- Mobile-first responsive design principles from `docs/PRODUCT_MANAGER.md`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] Existing tests pass (`npm run test:run`)

### Functional Verification

- [ ] Header renders on the page with app logo/name
- [ ] Desktop navigation links (My Recipes, Community, Shopping Lists) are visible on `md:` screens and above
- [ ] "Add Recipe" button is visible on desktop and links to `/recipes/new`
- [ ] User avatar dropdown appears when authenticated, showing menu items
- [ ] "Sign Out" action in dropdown calls NextAuth signOut
- [ ] "Sign In" button appears when not authenticated
- [ ] Mobile hamburger icon is visible on small screens (`md:hidden`)
- [ ] Clicking hamburger opens the Sheet mobile drawer
- [ ] Mobile drawer contains all navigation links with correct hrefs
- [ ] Mobile drawer closes when a link is clicked
- [ ] All mobile touch targets are at least 44px
- [ ] Header is sticky/fixed and appears above page content
- [ ] Search bar placeholder renders (non-functional is acceptable)

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Components use shadcn/ui primitives consistently
- [ ] Proper use of `next/link` for internal navigation (no `<a>` tags for internal routes)

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
