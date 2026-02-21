# AI-Enhanced Recipe Management Platform

## Project Documentation

The following documentation files define this project's specifications, architecture, and implementation plan:

- `docs/ROADMAP.md` — Implementation phases, task breakdown, and sequencing
- `docs/CTO_SPECS.md` — Technical architecture, stack decisions, and infrastructure constraints
- `docs/PRODUCT_MANAGER.md` — Feature requirements, user stories, and acceptance criteria
- `docs/SENIOR_DEVELOPER.md` — Implementation patterns, coding conventions, and development workflow
- `docs/GENERAL_SPECS.md` — Project overview and general requirements

## Skills

The following skills are available and should be used when referenced:

### Task Definition Skill

**Triggers**: "use the task definition skill", "define a task", "define task for", "task definition"
**Action**: Read and follow the full process defined in `.claude/task-definition-skill.md`
**Purpose**: Guides the evidence-based process of scoping and defining a task — consulting the roadmap, auditing existing code, reading project docs, and establishing boundaries before any task file is created.

### Task Template Skill

**Triggers**: "use the task template skill", "create a task file", "write the task file", "task template"
**Action**: Read and follow the template and conventions defined in `.claude/task-template-skill.md`
**Purpose**: Defines the exact file naming, location (`docs/phases/phase<n>/`), format (Markdown with YAML frontmatter), and structure for task files. The task definition skill invokes this skill as its final step.

### Task Execution Skill

**Triggers**: "use the task execution skill", "execute task", "execute this task", "run task", "implement task", "task execution"
**Action**: Read and follow the full process defined in `.claude/task-execution-skill.md`
**Purpose**: Guides the disciplined implementation of a task file — gathering context, creating a plan (presented for user approval before any code is written), executing section by section with strict coding standards (DRY, single class per file, no assumptions), running final verification (build + tests + acceptance criteria), and enforcing boundaries throughout. Any ambiguity or conflict between documents must be escalated to the user.

---

> **Typical workflow**: The _task definition skill_ scopes and defines the task, the _task template skill_ provides the output format for the task file, and the _task execution skill_ implements it. They can be used independently or in sequence.

### Code Generation Skills

The following skills define the canonical patterns for every entity type in the project. **Always consult the relevant skill before creating a new file** to ensure consistency across the codebase.

#### Page Component Skill

**Triggers**: "create a page", "new page", "add a page component", "page component"
**Action**: Read and follow `.claude/page-component-skill.md`
**Purpose**: Canonical patterns for Next.js page components (`page.tsx`), layout components (`layout.tsx`), and special pages (`loading.tsx`, `error.tsx`, `not-found.tsx`) — including import ordering, metadata exports, auth guards, and server component conventions.

#### Client Component Skill

**Triggers**: "create a client component", "new client component", "interactive component", "client component"
**Action**: Read and follow `.claude/client-component-skill.md`
**Purpose**: Canonical pattern for interactive `'use client'` components — file structure with constants, helper functions, props interface, named exports, and event handler conventions.

#### Shared Component Skill

**Triggers**: "create a shared component", "new presentational component", "skeleton component", "shared component"
**Action**: Read and follow `.claude/shared-component-skill.md`
**Purpose**: Canonical pattern for simple presentational/server components that do NOT use `'use client'` — skeletons, static UI pieces, and layout fragments.

#### Provider Component Skill

**Triggers**: "create a provider", "new context provider", "add a provider", "provider component"
**Action**: Read and follow `.claude/provider-component-skill.md`
**Purpose**: Canonical pattern for React context providers — library wrappers and custom context with `useXxx()` hooks, including nesting order in the root layout.

#### Custom Hook Skill

**Triggers**: "create a hook", "new custom hook", "add a hook", "custom hook"
**Action**: Read and follow `.claude/custom-hook-skill.md`
**Purpose**: Canonical pattern for custom React hooks — React Query wrappers, mutations with optimistic updates, utility hooks, query key conventions, and co-located fetcher functions.

#### API Route Skill

**Triggers**: "create an API route", "new route handler", "add an endpoint", "api route"
**Action**: Read and follow `.claude/api-route-skill.md`
**Purpose**: Canonical pattern for Next.js API route handlers — auth guards, Zod `safeParse()` validation, body parsing, Prisma error handling, consistent response format, and HTTP status codes.

#### Validation Schema Skill

**Triggers**: "create a schema", "new validation", "add a Zod schema", "validation schema"
**Action**: Read and follow `.claude/validation-schema-skill.md`
**Purpose**: Canonical pattern for Zod validation schemas — three-layer structure (field schemas, form/request schemas, inferred types), custom error messages, and shared usage between forms and API routes.

#### Type Definition Skill

**Triggers**: "create types", "new type definition", "add an interface", "type definition"
**Action**: Read and follow `.claude/type-definition-skill.md`
**Purpose**: Canonical pattern for TypeScript type files — module augmentation (`.d.ts`), shared domain types, `interface` vs `type` usage, and rules for when to inline vs extract types.

#### Lib Utility Skill

**Triggers**: "create a utility", "new lib module", "add a helper", "lib utility"
**Action**: Read and follow `.claude/lib-utility-skill.md`
**Purpose**: Canonical pattern for server-side utility and library modules — singletons with `globalThis` caching, library configuration exports, domain helpers with JSDoc, and pure utility functions.

#### Test File Skill

**Triggers**: "create a test", "new test file", "add tests", "test file"
**Action**: Read and follow `.claude/test-file-skill.md`
**Purpose**: Canonical pattern for test files (Vitest + Testing Library + MSW) — co-located `__tests__/` directories, mocking strategy with `vi.mock()` and `vi.hoisted()`, test factories, MSW handlers, and assertion patterns.

#### Prisma Model Skill

**Triggers**: "create a model", "new Prisma model", "add a database model", "prisma model"
**Action**: Read and follow `.claude/prisma-model-skill.md`
**Purpose**: Canonical conventions for Prisma schema definitions — naming conventions (PascalCase models, camelCase fields, UPPER_SNAKE_CASE enums), relations, cascade deletes, indexes, and auth model constraints.

#### UI Component Skill

**Triggers**: "create a UI component", "modify shadcn component", "add a UI primitive", "ui component"
**Action**: Read and follow `.claude/ui-component-skill.md`
**Purpose**: Canonical conventions for shadcn/ui primitive components — `React.ComponentProps` typing, `data-slot` attributes, CVA variants, compound component pattern, and `cn()` class merging.
