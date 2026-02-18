---
task_id: "task-1.8"
title: "Configure ESLint and Prettier"
phase: 1
task_number: 8
status: "pending"
priority: "medium"
dependencies:
  - "task-1.1"
  - "task-1.2"
blocks:
  - "task-1.9"
created_at: "2026-02-17"
---

# Configure ESLint and Prettier

## Current State

> After tasks 1.1 and 1.2, ESLint is installed and configured with default Next.js settings (from `create-next-app`). Prettier and `prettier-plugin-tailwindcss` are installed as dev dependencies but not configured (no `.prettierrc` file exists).

- **What exists**: ESLint configured with Next.js defaults (`.eslintrc.json` or `eslint.config.mjs`). Prettier and its Tailwind plugin installed in `devDependencies`.
- **What is missing**: `.prettierrc` configuration file with team-consistent settings. Lint and format scripts in `package.json`. Extended ESLint rules for TypeScript and React hooks.
- **Relevant code**: ESLint config file (from task-1.1), `package.json` (from tasks 1.1/1.2)

---

## Desired Outcome

> ESLint is configured with recommended rules for Next.js, TypeScript, and React hooks. Prettier is configured with consistent formatting settings and Tailwind class sorting. Convenience scripts are added to `package.json`.

- **End state**: `.prettierrc` exists with consistent settings. ESLint config extends recommended rulesets. `package.json` includes `lint`, `format`, and `format:check` scripts.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: Running `npm run lint` checks code quality. Running `npm run format` auto-formats all files. Running `npm run format:check` verifies formatting in CI.

---

## Scope & Boundaries

### In Scope
- Create `.prettierrc` with team-consistent settings
- Extend ESLint configuration with recommended rules for Next.js, TypeScript, and React hooks
- Add `lint`, `format`, and `format:check` scripts to `package.json`
- Create `.prettierignore` to exclude non-formattable directories

### Out of Scope
- Setting up Husky/lint-staged git hooks (handled by task-1.9)
- Running `npm run format` to format the entire codebase (do this at the end of Phase 1, or leave to the developer)

### Dependencies
- task-1.1 must be complete (ESLint configured by `create-next-app`)
- task-1.2 must be complete (Prettier and plugin installed)

---

## Implementation Details

### Section 1: Create Prettier Configuration

**What to do**: Create `.prettierrc` with consistent formatting settings.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.8: "Create `.prettierrc` with team-consistent settings (semicolons, single quotes, trailing commas, print width)"

**Specific requirements**:
- Create `.prettierrc` (JSON format) at the project root with:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false,
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf",
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```
- The `prettier-plugin-tailwindcss` plugin auto-sorts Tailwind CSS classes in the correct order
- `endOfLine: "lf"` ensures consistent line endings across platforms

---

### Section 2: Create Prettier Ignore File

**What to do**: Create `.prettierignore` to exclude directories that should not be formatted.

**Specific requirements**:
- Create `.prettierignore` at the project root:
  ```
  node_modules
  .next
  out
  build
  coverage
  dist
  pnpm-lock.yaml
  package-lock.json
  ```

---

### Section 3: Extend ESLint Configuration

**What to do**: Ensure ESLint configuration includes recommended rules for the project's stack.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.8: "Extend ESLint configuration with recommended rules for Next.js, TypeScript, and React hooks"

**Specific requirements**:
- `create-next-app` sets up ESLint with `next/core-web-vitals` or `next/typescript` — verify these are present
- The default Next.js ESLint config already includes:
  - `eslint-plugin-react` — React rules
  - `eslint-plugin-react-hooks` — React hooks rules
  - `@next/eslint-plugin-next` — Next.js specific rules
  - `eslint-plugin-jsx-a11y` — Accessibility rules (through `next/core-web-vitals`)
- Verify these are present in the ESLint config; do NOT duplicate them
- If using the new flat config format (`eslint.config.mjs`), ensure it extends the correct Next.js presets

**Patterns to follow**:
- Do not fight with Next.js's built-in ESLint configuration — extend it, don't replace it

---

### Section 4: Add Scripts to package.json

**What to do**: Add lint and format scripts to `package.json`.

**Where to find context**:
- `docs/ROADMAP.md` — Task 1.8 specifies the exact scripts

**Specific requirements**:
- Add or verify the following scripts in `package.json`:
  - `"lint": "next lint"` — should already exist from `create-next-app`
  - `"format": "prettier --write ."` — format all files in place
  - `"format:check": "prettier --check ."` — check formatting without modifying (for CI)
- Do NOT override the existing `lint` script if it already exists

---

## Verification & Acceptance Criteria

### Build Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` runs without errors
- [ ] No new TypeScript/linting errors introduced

### Functional Verification
- [ ] `.prettierrc` exists with the specified settings
- [ ] `.prettierignore` exists with appropriate exclusions
- [ ] ESLint config extends Next.js recommended rules
- [ ] `npm run lint` executes successfully (via `next lint`)
- [ ] `npm run format` executes and formats files
- [ ] `npm run format:check` executes and reports formatting status
- [ ] Tailwind CSS class sorting works (Prettier plugin is active)

### Code Quality Checks
- [ ] ESLint and Prettier configurations do not conflict
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

- The `lint` script generated by `create-next-app` for ESLint v9 is `"eslint"` (not `"next lint"`). This is the correct modern default and was kept as-is per the task's instruction to not override the existing lint script.
- `npm run format:check` reports 51 files with formatting differences. Running `npm run format` on the entire codebase is out of scope per the task file — this should be done at the end of Phase 1 or by the developer.
