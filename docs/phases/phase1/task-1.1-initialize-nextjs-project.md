---
task_id: 'task-1.1'
title: 'Initialize Next.js Project with TypeScript and App Router'
phase: 1
task_number: 1
status: 'pending'
priority: 'high'
dependencies: []
blocks:
  - 'task-1.2'
  - 'task-1.3'
  - 'task-1.4'
  - 'task-1.5'
  - 'task-1.6'
  - 'task-1.7'
  - 'task-1.8'
created_at: '2026-02-17'
---

# Initialize Next.js Project with TypeScript and App Router

## Current State

> No implementation exists. The project repository contains only specification documents (`docs/`), Claude skill definitions (`.claude/`), a `CLAUDE.md` file, and a `.gitignore`. There is no `package.json`, no `src/` directory, no configuration files, and no application code.

- **What exists**: Specification documents (`docs/ROADMAP.md`, `docs/CTO_SPECS.md`, `docs/PRODUCT_MANAGER.md`, `docs/SENIOR_DEVELOPER.md`, `docs/GENERAL_SPECS.md`), Git repository initialized on `master` branch, `.gitignore` with minimal entries.
- **What is missing**: The entire Next.js application — no `package.json`, no `src/` directory, no TypeScript config, no Tailwind config, no Next.js config.
- **Relevant code**: None — this is the first implementation task.

---

## Desired Outcome

> A bootable Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, App Router, and `src/` directory that compiles and renders a clean default page at `http://localhost:3000`.

- **End state**: The project has a valid `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `postcss.config.mjs`, and a `src/app/` directory with the App Router structure. Running `npm run dev` starts the dev server without errors.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: A fully initialized Next.js project scaffold with TypeScript, Tailwind CSS, ESLint, and App Router. All default boilerplate content removed from `src/app/page.tsx` and `src/app/layout.tsx`.

---

## Scope & Boundaries

### In Scope

- Run `npx create-next-app@latest` with the correct flags to initialize the project
- Verify the project starts with `npm run dev`
- Remove boilerplate content from `src/app/page.tsx` (replace with a minimal placeholder)
- Clean up `src/app/layout.tsx` (keep essential structure, remove boilerplate metadata/comments)
- Update `.gitignore` to include standard Next.js ignores (`.next/`, `node_modules/`, etc.)

### Out of Scope

- Installing additional dependencies beyond what `create-next-app` provides (handled by task-1.2)
- Configuring shadcn/ui (handled by task-1.3)
- Setting up environment variables (handled by task-1.4)
- Creating the full directory structure under `src/` (handled by task-1.5)
- Customizing Tailwind theme (handled by task-1.6)
- Strict TypeScript configuration (handled by task-1.7)
- ESLint/Prettier configuration (handled by task-1.8)

### Dependencies

- None — this is the first task.

---

## Implementation Details

### Section 1: Initialize Next.js Project

**What to do**: Run `create-next-app` to scaffold the project in the current directory.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.1 specifies the flags
- `docs/CTO_SPECS.md` — Frontend stack section confirms Next.js 14+ with App Router
- `docs/SENIOR_DEVELOPER.md` — Phase 1, step 1 confirms the exact command

**Specific requirements**:

- Use `npx create-next-app@latest .` to scaffold in the current directory (the repo root)
- Flags/options to enable: TypeScript, Tailwind CSS, ESLint, App Router, `src/` directory, import alias `@/*`
- The command as specified: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
- If the interactive CLI prompts for additional options, select defaults that align with the stack (e.g., use `npm` as the package manager since the docs reference `npm run dev`)
- Do NOT use `--use-pnpm` or `--use-yarn` — the project uses `npm` per the docs

**Patterns to follow**:

- `docs/CTO_SPECS.md` architecture overview defines the top-level structure

---

### Section 2: Verify Project Boots

**What to do**: Start the development server and confirm the app renders without errors.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.1 specifies "Verify the project boots with `npm run dev` and renders the default page"

**Specific requirements**:

- Run `npm run dev` and verify the server starts on `http://localhost:3000`
- Confirm no TypeScript errors, no build warnings, no runtime errors in the console
- The default Next.js page should render in the browser

---

### Section 3: Remove Boilerplate Content

**What to do**: Clean up the auto-generated boilerplate in `src/app/page.tsx` and `src/app/layout.tsx`.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.1: "Remove boilerplate content from `src/app/page.tsx` and `src/app/layout.tsx`"

**Specific requirements**:

- `src/app/page.tsx`: Replace the entire default content with a minimal placeholder page (e.g., a centered heading "Recipe Management System" or similar). Keep the file as a valid React component.
- `src/app/layout.tsx`: Keep the essential RootLayout structure (html, body, metadata export), but remove any boilerplate comments, extra imports, or default font configurations that are not needed. Keep the Inter font or whatever default font is used — font customization is out of scope.
- `src/app/globals.css`: Keep the Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) and remove any boilerplate CSS rules that were auto-generated.

---

### Section 4: Update .gitignore

**What to do**: Ensure `.gitignore` covers standard Next.js entries.

**Where to find context**:

- Current `.gitignore` only contains `.claude/settings.local.json`

**Specific requirements**:

- `create-next-app` should generate a proper `.gitignore` — verify it includes at minimum: `.next/`, `node_modules/`, `.env.local`, `.env*.local`, `out/`, `build/`, `*.tsbuildinfo`, `next-env.d.ts`
- Ensure the existing `.claude/settings.local.json` entry is preserved (merge if necessary)
- Add `.env.local` to `.gitignore` if not already present (per `docs/ROADMAP.md` Task 1.4)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run dev` starts the development server without errors
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors or warnings

### Functional Verification

- [ ] The app renders at `http://localhost:3000` showing a clean placeholder page (no default Next.js boilerplate)
- [ ] The `src/app/` directory exists with `page.tsx`, `layout.tsx`, and `globals.css`
- [ ] `package.json` exists with Next.js, React, TypeScript, and Tailwind CSS as dependencies
- [ ] `tsconfig.json` exists with `@/*` path alias configured
- [ ] `tailwind.config.ts` exists
- [ ] `.gitignore` includes standard Next.js entries plus `.claude/settings.local.json`

### Code Quality Checks

- [ ] No leftover boilerplate code in `src/app/page.tsx` or `src/app/layout.tsx`
- [ ] `globals.css` contains only Tailwind directives (no boilerplate CSS)
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

- **Tailwind CSS v4**: `create-next-app@latest` (v16.1.6) now scaffolds with Tailwind CSS v4, which does **not** generate a `tailwind.config.ts` file. Instead, Tailwind is configured via `@import "tailwindcss"` in `globals.css` and the `@tailwindcss/postcss` PostCSS plugin. The acceptance criterion mentioning `tailwind.config.ts` reflects Tailwind v3 conventions. Future tasks referencing `tailwind.config.ts` (e.g., task-1.6 for theme customization) will need to use Tailwind v4's CSS-based configuration approach instead.
- **Next.js 16.1.6**: The scaffolded version is Next.js 16 (not 14+). The App Router and all expected features are present. The task spec referenced "Next.js 14+" which is satisfied.
- **Geist font**: `create-next-app` uses the Geist font family (Geist Sans + Geist Mono) instead of Inter. Kept as-is per task scope ("Keep the Inter font or whatever default font is used").
- **ESLint config**: The generated ESLint config is `eslint.config.mjs` (flat config format, ESLint v9+) rather than `.eslintrc.json`. Task 1.8 will need to account for this format.
- **Folder naming**: The directory `RecipeManagementSystem` contains capital letters which npm rejects as a package name. The `package.json` name was set to `recipe-management-system` (lowercase, hyphenated).
- **React Compiler**: `create-next-app` now asks about React Compiler support — declined per task scope (no extras beyond what's specified).
