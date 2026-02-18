---
task_id: 'task-1.9'
title: 'Set Up Git Hooks with Husky and lint-staged'
phase: 1
task_number: 9
status: 'done'
priority: 'low'
dependencies:
  - 'task-1.8'
blocks: []
created_at: '2026-02-17'
---

# Set Up Git Hooks with Husky and lint-staged

## Current State

> After task-1.8, ESLint and Prettier are configured with scripts in `package.json`. There are no git hooks set up — commits are not automatically linted or formatted before being committed.

- **What exists**: ESLint configuration, `.prettierrc`, and `format`/`lint` scripts in `package.json`.
- **What is missing**: Pre-commit git hooks that automatically run linting and formatting on staged files before each commit.
- **Relevant code**: `package.json` (from tasks 1.1/1.2/1.8), ESLint config, `.prettierrc`

---

## Desired Outcome

> Husky is configured with a pre-commit hook that runs lint-staged. lint-staged runs ESLint and Prettier on staged files before each commit. This prevents poorly formatted or linting-error code from being committed.

- **End state**: `husky` and `lint-staged` are installed. A pre-commit hook exists that runs lint-staged. lint-staged is configured to run ESLint (fix) and Prettier (write) on staged `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, and `.json` files.
- **User-facing changes**: None — this is a developer workflow improvement.
- **Developer-facing changes**: Every `git commit` automatically checks and fixes formatting/linting on staged files. If there are unfixable lint errors, the commit is blocked.

---

## Scope & Boundaries

### In Scope

- Install `husky` and `lint-staged` as dev dependencies
- Initialize Husky and create the pre-commit hook
- Configure lint-staged in `package.json` to run ESLint and Prettier
- Verify the hook works on a test commit

### Out of Scope

- Setting up CI/CD pipelines (handled by Phase 15)
- Adding commit message linting (e.g., commitlint) — not specified in the project docs
- Configuring other git hooks (pre-push, etc.)

### Dependencies

- task-1.8 must be complete (ESLint and Prettier configured)

---

## Implementation Details

### Section 1: Install Husky and lint-staged

**What to do**: Install the required dev dependencies.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.9: "Consider adding `husky` + `lint-staged` for pre-commit linting"

**Specific requirements**:

- Install: `npm install -D husky lint-staged`
- Run Husky init: `npx husky init`
- This creates a `.husky/` directory with a default pre-commit hook

---

### Section 2: Configure Pre-Commit Hook

**What to do**: Set up the pre-commit hook to run lint-staged.

**Specific requirements**:

- The pre-commit hook file (`.husky/pre-commit`) should contain:
  ```sh
  npx lint-staged
  ```
- Replace any default content that `husky init` creates

---

### Section 3: Configure lint-staged

**What to do**: Add lint-staged configuration to `package.json`.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.9: "Configure `lint-staged` to run ESLint and Prettier on staged files"

**Specific requirements**:

- Add `lint-staged` configuration to `package.json`:
  ```json
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,md,json}": [
      "prettier --write"
    ]
  }
  ```
- This ensures TypeScript/JavaScript files are both linted and formatted, while CSS/MD/JSON files are only formatted

---

### Section 4: Add Prepare Script

**What to do**: Add the Husky prepare script to `package.json`.

**Specific requirements**:

- `npx husky init` should automatically add a `"prepare": "husky"` script to `package.json`
- Verify this script exists — it ensures Husky hooks are installed when running `npm install`

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run build` completes without errors
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `husky` and `lint-staged` are listed in `devDependencies`
- [ ] `.husky/pre-commit` file exists and runs `npx lint-staged`
- [ ] `lint-staged` configuration exists in `package.json`
- [ ] `"prepare": "husky"` script exists in `package.json`
- [ ] Making a commit with a staged file triggers lint-staged (ESLint + Prettier run)
- [ ] A commit with a lint error is blocked (lint-staged returns non-zero exit code)
- [ ] The hook does not block CI/CD pipelines (Husky respects `CI=true` environment)

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

- Husky v9.1.7 installed; uses modern init flow that auto-adds `"prepare": "husky"` to scripts.
- lint-staged v16.2.7 installed; supports the `package.json` inline config format used here.
- On Windows, Husky v9 handles hook execution via its internal `.husky/_/` shell scripts — no manual chmod needed.
- The `--help` flag on lint-staged v16 exits with code 1 (known quirk), but the tool works correctly.
