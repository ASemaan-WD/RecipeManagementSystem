---
task_id: 'task-13.1'
title: 'Production Build & Environment Setup'
phase: 13
task_number: 1
status: 'pending'
priority: 'high'
dependencies:
  - 'task-12.1'
  - 'task-12.2'
  - 'task-12.3'
blocks:
  - 'task-13.2'
created_at: '2026-02-22'
---

# Production Build & Environment Setup

## Current State

> All application features (Phases 1-11) and optimizations (Phase 12) are complete. The application needs to be verified as production-ready before deployment.

- **What exists**:
  - Complete Next.js application with 31 API routes, authentication, recipe CRUD, search, social features, AI integration, shopping lists, and cooking mode
  - `package.json` with `build`, `start`, `lint`, `test`, and database scripts
  - Prisma schema with 18+ models, migrations, and seed script (`prisma/seed.ts`)
  - `.env.example` with all required variable templates
  - `.env.local` with development values (git-ignored)
  - `next.config.ts` with images, security headers (after task 12.2)
  - Vitest and Playwright test configurations
  - Husky + lint-staged for pre-commit hooks
- **What is missing**:
  - `prisma generate` step in the build command (needed for Vercel — Prisma client must be generated before `next build`)
  - `db:generate` convenience script in `package.json`
  - Production build verification (confirm `npm run build` succeeds cleanly)
  - Production mode verification (confirm `npm run start` renders pages correctly)
  - Vercel-specific configuration (`vercel.json` for function timeouts on AI routes)
  - Production database setup documentation/verification
  - OAuth redirect URI documentation for production domain
  - Verification that all environment variables are documented and accounted for
- **Relevant code**:
  - `package.json` — scripts, dependencies
  - `next.config.ts` — Next.js configuration
  - `prisma/schema.prisma` — database schema
  - `prisma/seed.ts` — seed script
  - `.env.example` — environment variable template

---

## Desired Outcome

- **End state**: The application builds cleanly for production, runs in production mode without errors, has all deployment configuration files, and has documented steps for production environment setup.
- **User-facing changes**: None — this is infrastructure preparation.
- **Developer-facing changes**:
  - Updated `package.json` with `db:generate` script and verified `build` script
  - `vercel.json` with function configuration for AI routes
  - Verified production build output (no errors, reasonable bundle sizes)
  - Updated `.env.example` with any missing variables
  - Production setup checklist documented in this task's Notes section

---

## Scope & Boundaries

### In Scope

- Add `db:generate` script to `package.json` (`prisma generate`)
- Verify and fix `npm run build` to completion (resolve any build errors or warnings)
- Verify `npm run start` renders pages correctly in production mode
- Create `vercel.json` with function timeout configuration for AI routes
- Verify all environment variables in `.env.example` match what the application actually uses
- Verify Prisma migrations are clean and the seed script runs successfully
- Document production database setup steps (Neon production DB creation, migration deployment)
- Document OAuth redirect URI updates needed for production domain
- Run `npm run lint` and `npm run format:check` — fix any issues
- Run `npm run test` — all tests must pass
- Check and document bundle sizes from `next build` output

### Out of Scope

- Actually deploying to Vercel (task 13.2)
- Actually creating the production Neon database (documented, not executed)
- Actually updating OAuth redirect URIs in Google/GitHub consoles (documented, not executed)
- Setting Vercel environment variables (task 13.2)
- README updates (task 13.4)
- Code cleanup beyond what's needed to pass build/lint/test (task 13.3)

### Dependencies

- All Phase 12 tasks completed (optimizations and security hardening in place)

---

## Implementation Details

### Section 1: Build Script & Prisma Generate

**What to do**: Ensure Prisma client generation is part of the build pipeline.

**Where to find context**:

- `package.json` — current scripts (no `db:generate`)
- `docs/ROADMAP.md` Phase 13.1: "Run npm run build, resolve errors/warnings"
- `docs/CTO_SPECS.md` Deployment: "Vercel auto-deploy from GitHub"

**Specific requirements**:

- Add to `package.json` scripts:
  - `"db:generate": "prisma generate"`
  - `"vercel-build": "prisma generate && next build"` (Vercel will use this as the build command)
- Verify that `prisma generate` runs successfully and generates the client at `src/generated/prisma/` (or wherever the output is configured)
- Run `npm run build` and resolve any errors:
  - TypeScript errors
  - Missing imports
  - Invalid configurations
  - ESLint errors in build output
- Document the final build output (page sizes, bundle sizes) in the Notes section

**Patterns to follow**:

- Per `docs/CTO_SPECS.md` Deployment section: Vercel build command should include `prisma generate`

---

### Section 2: Production Mode Verification

**What to do**: Start the application in production mode and verify key pages render.

**Where to find context**:

- `package.json` — `start` script

**Specific requirements**:

- Run `npm run build && npm run start`
- Verify these pages render without errors (check browser console and terminal):
  - `/` (landing page — unauthenticated)
  - `/login` (login page)
  - `/community` (public community page — unauthenticated)
- Note: Authenticated pages cannot be verified without OAuth configuration, but the build succeeding for all routes confirms they compile correctly
- Check for any runtime errors in the terminal output
- Verify that security headers from task 12.2 appear in response headers

**Patterns to follow**:

- Standard Next.js production verification

---

### Section 3: Vercel Configuration

**What to do**: Create `vercel.json` with deployment configuration.

**Where to find context**:

- `docs/CTO_SPECS.md` Deployment: Vercel platform, `*.vercel.app` domain
- `docs/ROADMAP.md` Phase 13.1: production configuration

**Specific requirements**:

- Create `vercel.json` at the project root:
  ```json
  {
    "buildCommand": "prisma generate && next build",
    "framework": "nextjs",
    "functions": {
      "src/app/api/ai/**/*.ts": {
        "maxDuration": 60
      }
    }
  }
  ```
- AI routes need longer timeouts (60s) because:
  - Recipe generation uses streaming (can take 10-30s)
  - DALL-E image generation can take 15-30s
  - Nutrition estimation involves OpenAI API call + Cloudinary upload
- All other routes use Vercel's default timeout (10s for Hobby, 15s for Pro)
- Do NOT add `regions` configuration (use Vercel's default — closest to user)

**Patterns to follow**:

- Per `docs/CTO_SPECS.md`: Vercel deployment with auto-deploy from GitHub

---

### Section 4: Environment Variable Audit

**What to do**: Verify `.env.example` is complete and accurate.

**Where to find context**:

- `.env.example` — current template
- `docs/ROADMAP.md` Appendix B: Environment Variable Reference

**Specific requirements**:

- Search the entire codebase for `process.env.` references
- Verify every referenced environment variable is listed in `.env.example`
- Verify the Appendix B list matches `.env.example`
- Check for any environment variables used but not documented:
  - `NODE_ENV` (set by Next.js automatically — no need to document)
  - `ANALYZE` (dev-only for bundle analyzer — add to `.env.example` with comment)
- Verify no environment variables are hardcoded in source files
- Add any missing variables to `.env.example` with descriptive comments

**Patterns to follow**:

- Per `docs/ROADMAP.md` Task 1.4: `.env.example` with all required variables (no real values)

---

### Section 5: Lint, Format, and Test Verification

**What to do**: Run all quality checks and ensure they pass.

**Where to find context**:

- `package.json` — `lint`, `format:check`, `test` scripts

**Specific requirements**:

- Run `npm run lint` — fix any ESLint errors (warnings are acceptable but should be documented)
- Run `npm run format:check` — run `npm run format` if any files need formatting
- Run `npm run test` — all tests must pass
- Run `npm run test:coverage` — document coverage percentages
  - Verify coverage meets thresholds: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Document any test failures and their resolutions in the Notes section

**Patterns to follow**:

- Per Vitest config: coverage thresholds are enforced in `vitest.config.ts`

---

### Section 6: Production Database & OAuth Documentation

**What to do**: Document the steps needed to set up production database and OAuth.

**Where to find context**:

- `docs/CTO_SPECS.md`: Neon PostgreSQL, Google OAuth, GitHub OAuth
- `docs/ROADMAP.md` Phase 13.1: production setup steps

**Specific requirements**:

- Document in the Notes section (these steps are performed during task 13.2, not now):
  1. **Neon Production Database**:
     - Create a new Neon project/branch for production
     - Run `prisma migrate deploy` (not `migrate dev`) against production DB
     - Run seed script if desired for demo data
  2. **Google OAuth Production**:
     - Add production redirect URI: `https://<app>.vercel.app/api/auth/callback/google`
     - Ensure OAuth consent screen is configured for external users
  3. **GitHub OAuth Production**:
     - Create a new GitHub OAuth app for production (or update callback URL)
     - Add production redirect URI: `https://<app>.vercel.app/api/auth/callback/github`
  4. **Vercel Environment Variables**:
     - List all variables that must be set in Vercel dashboard
     - Note which variables need different values for production vs development
  5. **Cloudinary & OpenAI**:
     - Same API keys can be used for production (no environment-specific config needed)
     - Set up OpenAI billing alerts for cost monitoring

**Patterns to follow**:

- Documentation only — no execution in this task

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] `npm run build` completes without errors
- [ ] `npm run start` starts the server and serves pages
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run format:check` passes (no formatting issues)
- [ ] `npm run test` — all tests pass
- [ ] `npm run test:coverage` — meets threshold requirements

### Functional Verification

- [ ] `prisma generate` runs successfully
- [ ] Production mode serves landing page, login page, and community page without errors
- [ ] Security headers appear in production responses
- [ ] `vercel.json` is valid JSON with correct function configuration
- [ ] `.env.example` contains all environment variables referenced in the codebase
- [ ] Bundle sizes are documented in Notes section

### Code Quality Checks

- [ ] No TypeScript errors in build output
- [ ] No ESLint errors
- [ ] All files properly formatted
- [ ] No TODO/FIXME comments that should have been resolved in earlier phases

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
