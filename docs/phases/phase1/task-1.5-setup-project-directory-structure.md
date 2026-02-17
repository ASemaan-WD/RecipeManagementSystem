---
task_id: "task-1.5"
title: "Set Up Project Directory Structure"
phase: 1
task_number: 5
status: "pending"
priority: "medium"
dependencies:
  - "task-1.1"
  - "task-1.3"
blocks: []
created_at: "2026-02-17"
---

# Set Up Project Directory Structure

## Current State

> After tasks 1.1 and 1.3, the project has a `src/app/` directory (from Next.js initialization) and a `src/components/ui/` directory (from shadcn/ui). The broader organizational directory structure defined in the project specs does not yet exist.

- **What exists**: `src/app/` with `page.tsx`, `layout.tsx`, `globals.css`. `src/components/ui/` with shadcn/ui primitives. `src/lib/utils.ts` (created by shadcn/ui init).
- **What is missing**: The full directory hierarchy under `src/` — route groups, component subdirectories, hooks, types, providers, and lib modules. Also missing are placeholder files that establish the module boundaries.
- **Relevant code**: `src/app/` (from task-1.1), `src/components/ui/` (from task-1.3)

---

## Desired Outcome

> The complete directory hierarchy under `src/` is established, matching the structure defined in the project specifications. Placeholder `index.ts` barrel files exist where appropriate to establish module boundaries.

- **End state**: All directories listed in the roadmap and senior developer specs exist. The directory structure clearly communicates the project's organizational pattern.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: All directories are in place for subsequent tasks to create files in the correct locations without needing to create parent directories.

---

## Scope & Boundaries

### In Scope
- Create all directories under `src/` as specified in the roadmap and senior developer specs
- Create the `public/` directory if it doesn't exist (for static assets)
- Create placeholder `.gitkeep` files in empty directories so they are tracked by git

### Out of Scope
- Creating actual component files, page files, or utility files — those are created in their respective tasks (Phases 2-10)
- Creating barrel `index.ts` files with actual exports — those are added when the modules they export are created
- Creating the `prisma/` directory (handled by Phase 2)

### Dependencies
- task-1.1 must be complete (`src/app/` exists)
- task-1.3 must be complete (`src/components/ui/` exists)

---

## Implementation Details

### Section 1: Create App Router Directory Structure

**What to do**: Create the route group directories under `src/app/`.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.5 defines the full directory hierarchy
- `docs/SENIOR_DEVELOPER.md` — File structure section shows the complete `src/app/` layout
- `docs/CTO_SPECS.md` — Architecture overview confirms the top-level structure

**Specific requirements**:
- Create the following directories under `src/app/`:
  ```
  src/app/
  ├── (auth)/                  # Auth-related pages (login, onboarding)
  ├── (main)/                  # Authenticated app pages (if using route groups per roadmap)
  ├── api/                     # API route handlers
  ```
- Note: The senior developer specs show pages directly under `src/app/` (e.g., `src/app/recipes/`, `src/app/community/`) rather than under a `(main)/` route group. The roadmap (Task 1.5) specifies `(auth)` and `(main)` route groups. Follow the roadmap structure since it is the implementation plan.
- Add `.gitkeep` files to empty directories

---

### Section 2: Create Component Directory Structure

**What to do**: Create component subdirectories under `src/components/`.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.5 lists: `layout/`, `recipes/`, `search/`, `social/`, `ai/`, `shared/`
- `docs/SENIOR_DEVELOPER.md` — File structure confirms these directories with specific component names

**Specific requirements**:
- Create the following directories under `src/components/`:
  ```
  src/components/
  ├── ui/          # Already exists from shadcn/ui (task-1.3)
  ├── layout/      # Header, Navigation, Footer, Sidebar
  ├── recipes/     # Recipe-specific components
  ├── search/      # Search bar, filters, results
  ├── social/      # Ratings, comments, sharing
  ├── ai/          # AI feature components
  └── shared/      # Reusable cross-cutting components
  ```
- Add `.gitkeep` files to empty directories

---

### Section 3: Create Supporting Directory Structure

**What to do**: Create the hooks, lib, types, and providers directories.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.5 lists: `hooks/`, `lib/`, `types/`, `providers/`
- `docs/SENIOR_DEVELOPER.md` — File structure shows all four directories with specific file names

**Specific requirements**:
- Create the following directories under `src/`:
  ```
  src/
  ├── hooks/        # Custom React hooks
  ├── lib/          # Utility modules (auth, db, openai, etc.) — may already have utils.ts from shadcn
  ├── types/        # TypeScript type definitions
  └── providers/    # React context providers
  ```
- `src/lib/` may already exist with `utils.ts` from shadcn/ui init — do not overwrite, only create if missing
- Add `.gitkeep` files to empty directories (not to directories that already contain files)

---

### Section 4: Create Public Assets Directory

**What to do**: Ensure the `public/` directory exists for static assets.

**Where to find context**:
- `docs/SENIOR_DEVELOPER.md` — File structure shows `public/` with `placeholder-recipe.jpg`, `logo.svg`, `favicon.ico`

**Specific requirements**:
- `public/` should already exist from `create-next-app` — verify
- Do NOT create placeholder asset files (logo, favicon, etc.) — those are created when needed

---

## Verification & Acceptance Criteria

### Build Verification
- [ ] Project still builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification
- [ ] `src/app/(auth)/` directory exists
- [ ] `src/app/(main)/` directory exists
- [ ] `src/app/api/` directory exists
- [ ] `src/components/layout/` directory exists
- [ ] `src/components/recipes/` directory exists
- [ ] `src/components/search/` directory exists
- [ ] `src/components/social/` directory exists
- [ ] `src/components/ai/` directory exists
- [ ] `src/components/shared/` directory exists
- [ ] `src/hooks/` directory exists
- [ ] `src/lib/` directory exists
- [ ] `src/types/` directory exists
- [ ] `src/providers/` directory exists
- [ ] `public/` directory exists
- [ ] Empty directories contain `.gitkeep` files so git tracks them

### Code Quality Checks
- [ ] No files were created that contain actual implementation code
- [ ] No TODO/FIXME comments left unresolved

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

- *(Empty until task execution begins)*
