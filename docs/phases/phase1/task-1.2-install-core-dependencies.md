---
task_id: "task-1.2"
title: "Install Core Dependencies"
phase: 1
task_number: 2
status: "pending"
priority: "high"
dependencies:
  - "task-1.1"
blocks:
  - "task-1.3"
created_at: "2026-02-17"
---

# Install Core Dependencies

## Current State

> After task-1.1, the project has a base Next.js application with TypeScript, Tailwind CSS, ESLint, and App Router. Only the dependencies bundled by `create-next-app` are installed (React, Next.js, TypeScript, Tailwind CSS, PostCSS, ESLint).

- **What exists**: A bootable Next.js project with `package.json` containing only the default `create-next-app` dependencies.
- **What is missing**: All additional production and dev dependencies required by the tech stack — Prisma, NextAuth, React Query, React Hook Form, Zod, Vercel AI SDK, Cloudinary, and supporting libraries.
- **Relevant code**: `package.json` (created by task-1.1)

---

## Desired Outcome

> All production and dev dependencies specified in the project documentation are installed and listed in `package.json`. The project still builds and runs without errors after installation.

- **End state**: `package.json` includes all required production and dev dependencies. `node_modules/` is populated. `npm run dev` still works.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: All required packages are available for import across the project.

---

## Scope & Boundaries

### In Scope
- Install all production dependencies listed in the roadmap and senior developer specs
- Install all dev dependencies listed in the roadmap and senior developer specs
- Verify the project still builds after installation

### Out of Scope
- Configuring any of the installed packages (configuration happens in subsequent tasks)
- Installing shadcn/ui components (handled by task-1.3)
- Setting up Prisma schema or running `prisma init` (handled by Phase 2)
- Configuring NextAuth (handled by Phase 3)
- Installing testing libraries (handled by Phase 11 per the roadmap)

### Dependencies
- task-1.1 must be complete (project initialized with `package.json`)

---

## Implementation Details

### Section 1: Install Production Dependencies

**What to do**: Install all required production packages.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.2 lists all production dependencies
- `docs/SENIOR_DEVELOPER.md` — Phase 1, step 2 lists the install commands
- `docs/CTO_SPECS.md` — Technology Stack section confirms each technology choice

**Specific requirements**:
- Install the following production dependencies:
  - `prisma` — ORM CLI tool
  - `@prisma/client` — Prisma client runtime
  - `next-auth@beta` — NextAuth.js v5 (Auth.js)
  - `@auth/prisma-adapter` — Prisma adapter for NextAuth
  - `@tanstack/react-query` — Server state management
  - `@tanstack/react-query-devtools` — React Query DevTools (dev aid, but ships as prod dependency)
  - `react-hook-form` — Form management
  - `@hookform/resolvers` — Form validation resolvers (for Zod integration)
  - `zod` — Schema validation
  - `ai` — Vercel AI SDK
  - `@ai-sdk/openai` — OpenAI provider for Vercel AI SDK
  - `next-cloudinary` — Cloudinary integration for Next.js
  - `nanoid` — Unique token generation for share links
- Command: `npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod ai @ai-sdk/openai next-cloudinary nanoid`

**Patterns to follow**:
- `docs/SENIOR_DEVELOPER.md` Phase 1 step 2 specifies the exact packages

---

### Section 2: Install Dev Dependencies

**What to do**: Install development-only packages.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.2 lists dev dependencies
- `docs/SENIOR_DEVELOPER.md` — Phase 1 step 2

**Specific requirements**:
- Install the following dev dependencies:
  - `prettier` — Code formatter
  - `prettier-plugin-tailwindcss` — Tailwind CSS class sorting for Prettier
- Command: `npm install -D prettier prettier-plugin-tailwindcss`
- Note: `@types/node`, `@types/react`, `@types/react-dom` should already be installed by `create-next-app`. Verify and install only if missing.
- Note: Testing libraries are deferred to Phase 11 per the roadmap.

---

### Section 3: Verify Build Still Works

**What to do**: Confirm the project builds and runs after dependency installation.

**Specific requirements**:
- Run `npm run build` — should complete without errors
- Run `npm run dev` — should start without errors
- No new TypeScript errors introduced by the installed packages

---

## Verification & Acceptance Criteria

### Build Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] No new TypeScript compilation errors

### Functional Verification
- [ ] `package.json` lists all production dependencies: `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `react-hook-form`, `@hookform/resolvers`, `zod`, `ai`, `@ai-sdk/openai`, `next-cloudinary`, `nanoid`
- [ ] `package.json` lists dev dependencies: `prettier`, `prettier-plugin-tailwindcss`
- [ ] `node_modules/` contains all installed packages
- [ ] No peer dependency warnings that indicate missing required packages

### Code Quality Checks
- [ ] No modifications to any source files — only `package.json` and `package-lock.json` changed
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
