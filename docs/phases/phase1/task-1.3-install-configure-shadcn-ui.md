---
task_id: 'task-1.3'
title: 'Install and Configure shadcn/ui'
phase: 1
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-1.1'
  - 'task-1.2'
blocks: []
created_at: '2026-02-17'
---

# Install and Configure shadcn/ui

## Current State

> After task-1.2, the project has all core dependencies installed. shadcn/ui has not been initialized, and no UI primitive components exist in the project.

- **What exists**: A bootable Next.js project with all core dependencies installed. Tailwind CSS is configured by `create-next-app`.
- **What is missing**: shadcn/ui initialization, `components.json` configuration file, and the individual UI component files under `src/components/ui/`.
- **Relevant code**: `tailwind.config.ts` (created by task-1.1), `src/app/globals.css` (Tailwind directives)

---

## Desired Outcome

> shadcn/ui is initialized with the New York style, slate base color, and CSS variables enabled. All UI components needed across the application are installed and available under `src/components/ui/`.

- **End state**: A `components.json` configuration file exists at the project root. The `src/components/ui/` directory contains all required shadcn/ui component files. The project builds without errors.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: All shadcn/ui primitives are importable from `@/components/ui/*`.

---

## Scope & Boundaries

### In Scope

- Run `npx shadcn-ui@latest init` with the specified configuration
- Install all shadcn/ui components listed in the roadmap
- Verify components are importable and the project builds

### Out of Scope

- Customizing component styles beyond what shadcn/ui provides (handled as needed in later phases)
- Building application-level components (layout, recipes, etc.) — these are in Phases 3-10
- Customizing the Tailwind theme beyond what shadcn/ui configures (handled by task-1.6)

### Dependencies

- task-1.1 must be complete (Tailwind CSS configured)
- task-1.2 must be complete (all dependencies available)

---

## Implementation Details

### Section 1: Initialize shadcn/ui

**What to do**: Run the shadcn/ui init command with project-specific configuration.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.3 specifies: "New York style, slate base color, CSS variables enabled"
- `docs/CTO_SPECS.md` — UI Library section confirms shadcn/ui + Tailwind CSS
- `docs/SENIOR_DEVELOPER.md` — File structure shows `src/components/ui/` directory

**Specific requirements**:

- Run `npx shadcn-ui@latest init`
- When prompted, select:
  - Style: **New York**
  - Base color: **Slate**
  - CSS variables: **Yes**
- This will create a `components.json` file and update `tailwind.config.ts` and `globals.css` with shadcn/ui CSS variables
- Verify the `components.json` file is created with correct settings

**Patterns to follow**:

- `docs/SENIOR_DEVELOPER.md` file structure: components live under `src/components/ui/`

---

### Section 2: Install Required UI Components

**What to do**: Install all shadcn/ui components that will be needed across the application.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.3 lists the full component set
- `docs/SENIOR_DEVELOPER.md` — File structure lists specific components: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `slider.tsx`, `textarea.tsx`, `popover.tsx`, `command.tsx`, `skeleton.tsx`, `toast.tsx`

**Specific requirements**:

- Install the following components (per `docs/ROADMAP.md` Task 1.3):
  - `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`, `avatar`, `badge`, `tabs`, `separator`, `skeleton`, `toast`, `sonner`, `sheet`, `select`, `textarea`, `command`, `popover`, `tooltip`, `slider`, `switch`, `checkbox`, `form`, `progress`, `scroll-area`, `alert`, `alert-dialog`
- Command: `npx shadcn-ui@latest add button input label card dialog dropdown-menu avatar badge tabs separator skeleton toast sonner sheet select textarea command popover tooltip slider switch checkbox form progress scroll-area alert alert-dialog`
- Each component will be created as a file under `src/components/ui/`

---

### Section 3: Verify Components

**What to do**: Confirm all components are installed and the project still builds.

**Specific requirements**:

- Verify the `src/components/ui/` directory contains files for all installed components
- Run `npm run build` to ensure no TypeScript errors from the installed components
- Verify that component imports work (e.g., `import { Button } from "@/components/ui/button"` resolves correctly)

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run build` completes without errors
- [ ] No new TypeScript compilation errors from installed components
- [ ] No new console warnings or errors

### Functional Verification

- [ ] `components.json` exists at project root with New York style, slate base color, CSS variables enabled
- [ ] `src/components/ui/` directory contains all 27 listed component files
- [ ] `globals.css` includes shadcn/ui CSS variable definitions
- [ ] `tailwind.config.ts` includes shadcn/ui configuration extensions
- [ ] Components are importable using the `@/components/ui/*` path alias

### Code Quality Checks

- [ ] No hardcoded values that should be configuration
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

- **CLI name change**: Used `npx shadcn@latest` (not `npx shadcn-ui@latest`). The `shadcn-ui` package is deprecated; the modern CLI is `shadcn` (v3.8.5 at time of execution).
- **`toast` component deprecated**: The `toast` component has been removed from the shadcn registry in v3. `sonner` is the official replacement and was installed. The task originally listed 27 components; 26 were installed (all except `toast`, which is covered by `sonner`).
- **No `tailwind.config.ts`**: The project uses Tailwind CSS v4 with CSS-based configuration. There is no `tailwind.config.ts` file and the shadcn CLI correctly detected Tailwind v4, configuring CSS variables directly in `globals.css`. The acceptance criterion "`tailwind.config.ts` includes shadcn/ui configuration extensions" is satisfied by the CSS variable definitions and `@theme inline` block in `globals.css`.
- **`--style` flag removed**: shadcn CLI v3 no longer accepts a `--style` flag. The "New York" style is now the default and only style. The CLI used `--base-color slate --css-variables --yes`.
- **TooltipProvider requirement**: The CLI noted that `TooltipProvider` should wrap the app in `layout.tsx`. This is out of scope for task 1.3 and should be addressed in a future layout/provider setup task.
- **Downstream impact on task 1.6**: Task 1.6 references modifying `tailwind.config.ts` for dark mode and custom colors. With Tailwind v4, dark mode is configured via `@custom-variant dark (&:is(.dark *))` in `globals.css` (already present after shadcn init). Task 1.6 will need to adapt its approach for Tailwind v4 CSS-based configuration.
