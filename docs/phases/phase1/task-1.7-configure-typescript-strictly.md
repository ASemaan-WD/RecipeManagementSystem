---
task_id: 'task-1.7'
title: 'Configure TypeScript Strictly'
phase: 1
task_number: 7
status: 'pending'
priority: 'medium'
dependencies:
  - 'task-1.1'
blocks: []
created_at: '2026-02-17'
---

# Configure TypeScript Strictly

## Current State

> After task-1.1, `tsconfig.json` exists with the default `create-next-app` TypeScript configuration. Next.js already enables `strict: true` by default, but additional strict settings specified in the roadmap may not be enabled.

- **What exists**: `tsconfig.json` with default Next.js TypeScript configuration, including `strict: true` and path alias `@/*` → `src/*`.
- **What is missing**: Additional strict settings: `noUncheckedIndexedAccess` and `forceConsistentCasingInFileNames`. Verification that path aliases work correctly.
- **Relevant code**: `tsconfig.json` (from task-1.1)

---

## Desired Outcome

> TypeScript is configured with maximum strictness as specified in the roadmap. Path aliases resolve correctly. The project compiles without errors under the strict configuration.

- **End state**: `tsconfig.json` includes `strict: true`, `noUncheckedIndexedAccess: true`, and `forceConsistentCasingInFileNames: true`. Path alias `@/*` → `src/*` works correctly.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: Stricter TypeScript checks catch more potential bugs at compile time. Indexed access types require explicit null checks. File imports must use consistent casing.

---

## Scope & Boundaries

### In Scope

- Enable `noUncheckedIndexedAccess: true` in `tsconfig.json`
- Enable `forceConsistentCasingInFileNames: true` in `tsconfig.json`
- Verify `strict: true` is already enabled (should be from `create-next-app`)
- Verify path alias `@/*` → `src/*` works correctly
- Fix any TypeScript errors introduced by the stricter settings

### Out of Scope

- Adding type declaration files for external libraries (done as needed when those libraries are configured)
- Modifying any source code beyond fixing TypeScript errors caused by the new strict settings

### Dependencies

- task-1.1 must be complete (`tsconfig.json` exists)

---

## Implementation Details

### Section 1: Enable Strict TypeScript Settings

**What to do**: Add additional strict compiler options to `tsconfig.json`.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.7 specifies the exact settings
- Next.js default `tsconfig.json` reference

**Specific requirements**:

- In `tsconfig.json`, within `compilerOptions`, add or verify:
  - `"strict": true` — should already be set by `create-next-app`
  - `"noUncheckedIndexedAccess": true` — array/object index access returns `T | undefined` instead of `T`
  - `"forceConsistentCasingInFileNames": true` — enforces consistent casing in imports
- Do NOT modify other settings that Next.js manages (e.g., `jsx`, `module`, `moduleResolution`, `target`)

---

### Section 2: Verify Path Aliases

**What to do**: Confirm the `@/*` path alias resolves correctly.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.7: "Verify path aliases (`@/*` → `src/*`) work correctly"

**Specific requirements**:

- In `tsconfig.json`, verify `paths` includes `"@/*": ["./src/*"]`
- This should already be configured by `create-next-app` — verify, do not duplicate
- Test by confirming that existing imports using `@/` (e.g., in shadcn/ui components) resolve without errors

---

### Section 3: Fix Any New Errors

**What to do**: If the stricter settings introduce TypeScript errors in existing code, fix them.

**Specific requirements**:

- Run `npm run build` to check for new errors
- `noUncheckedIndexedAccess` may cause errors in code that accesses arrays or objects by index without null checks — fix by adding appropriate type guards
- This is unlikely to affect the minimal codebase at this stage but should be verified

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run build` completes without errors
- [ ] No new TypeScript compilation errors
- [ ] No new console warnings

### Functional Verification

- [ ] `tsconfig.json` includes `"strict": true`
- [ ] `tsconfig.json` includes `"noUncheckedIndexedAccess": true`
- [ ] `tsconfig.json` includes `"forceConsistentCasingInFileNames": true`
- [ ] Path alias `@/*` resolves to `src/*` (verified by successful build with existing `@/` imports)

### Code Quality Checks

- [ ] No TypeScript settings were removed or weakened
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

- No new TypeScript errors were introduced by the stricter settings. The existing shadcn/ui components and utility code are already compatible with `noUncheckedIndexedAccess` and `forceConsistentCasingInFileNames`.
- Build completed successfully with Next.js 16.1.6 (Turbopack) — compiled in ~2s, no warnings.
