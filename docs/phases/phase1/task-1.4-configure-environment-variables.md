---
task_id: 'task-1.4'
title: 'Configure Environment Variables'
phase: 1
task_number: 4
status: 'pending'
priority: 'high'
dependencies:
  - 'task-1.1'
blocks: []
created_at: '2026-02-17'
---

# Configure Environment Variables

## Current State

> After task-1.1, the project has a `.gitignore` that should include `.env.local`. There is no `.env.example` file and no `.env.local` file with development values.

- **What exists**: A Next.js project with a `.gitignore` (should include `.env.local` from `create-next-app` defaults).
- **What is missing**: `.env.example` (template with all required variable names, no real values) and `.env.local` (git-ignored, with actual development values).
- **Relevant code**: `.gitignore` (from task-1.1)

---

## Desired Outcome

> A `.env.example` file exists with all required environment variable names (no real values) serving as documentation. A `.env.local` file exists locally (git-ignored) with placeholder values ready for the developer to fill in. The `.gitignore` confirms `.env.local` is excluded.

- **End state**: `.env.example` is committed to the repository with all variable names. `.env.local` exists locally but is not committed. `.gitignore` confirms `.env.local` and `.env*.local` are excluded.
- **User-facing changes**: None — this is an infrastructure task.
- **Developer-facing changes**: Developers can copy `.env.example` to `.env.local` and fill in their own values to get the project running.

---

## Scope & Boundaries

### In Scope

- Create `.env.example` with all required variable names and empty values
- Create `.env.local` with placeholder/example values (for local development)
- Verify `.env.local` is in `.gitignore`

### Out of Scope

- Providing actual API keys or secrets (developers must obtain their own)
- Configuring the services that use these variables (NextAuth, Prisma, Cloudinary, OpenAI) — those are in Phases 2-9
- Setting up Neon database or obtaining OAuth credentials — those are prerequisites the developer handles externally

### Dependencies

- task-1.1 must be complete (`.gitignore` exists)

---

## Implementation Details

### Section 1: Create .env.example

**What to do**: Create `.env.example` at the project root with all required environment variable names.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.4 lists all variables
- `docs/CTO_SPECS.md` — Environment Variables section provides the definitive list
- `docs/SENIOR_DEVELOPER.md` — References `.env.example` in the file structure

**Specific requirements**:

- Create `.env.example` with the following variables (no real values, just empty or descriptive placeholders):

  ```
  # Database (Neon PostgreSQL)
  DATABASE_URL=

  # Authentication (NextAuth.js v5)
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=http://localhost:3000

  # Google OAuth
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=

  # GitHub OAuth
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=

  # OpenAI (GPT-4o-mini + DALL-E 3)
  OPENAI_API_KEY=

  # Cloudinary (Image uploads)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  ```

- This matches the variable list from `docs/CTO_SPECS.md` exactly
- Include section comments for clarity

---

### Section 2: Create .env.local

**What to do**: Create `.env.local` with the same variables and placeholder values for local development.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.4: "Create `.env.local` (git-ignored) with actual development values"

**Specific requirements**:

- Create `.env.local` with the same variable names as `.env.example`
- Use descriptive placeholder values that make it clear what needs to be filled in:

  ```
  # Database (Neon PostgreSQL)
  DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

  # Authentication (NextAuth.js v5)
  NEXTAUTH_SECRET=your-nextauth-secret-here
  NEXTAUTH_URL=http://localhost:3000

  # Google OAuth
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret

  # GitHub OAuth
  GITHUB_CLIENT_ID=your-github-client-id
  GITHUB_CLIENT_SECRET=your-github-client-secret

  # OpenAI (GPT-4o-mini + DALL-E 3)
  OPENAI_API_KEY=sk-your-openai-api-key

  # Cloudinary (Image uploads)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
  CLOUDINARY_API_KEY=your-cloudinary-api-key
  CLOUDINARY_API_SECRET=your-cloudinary-api-secret
  ```

- This file MUST NOT be committed to git

---

### Section 3: Verify .gitignore

**What to do**: Confirm `.env.local` and related env files are git-ignored.

**Where to find context**:

- `docs/ROADMAP.md` — Task 1.4: "Add `.env.local` to `.gitignore` (confirm it's present)"

**Specific requirements**:

- Verify `.gitignore` includes `.env.local` and `.env*.local`
- These entries should already exist from `create-next-app` — confirm, do not duplicate
- Run `git status` to verify `.env.local` does NOT appear as an untracked file

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project still builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced

### Functional Verification

- [ ] `.env.example` exists at project root with all 11 environment variables
- [ ] `.env.example` contains NO real API keys or secrets
- [ ] `.env.local` exists at project root with placeholder values
- [ ] `.env.local` does NOT appear in `git status` (is properly ignored)
- [ ] `.gitignore` includes `.env.local` and/or `.env*.local`

### Code Quality Checks

- [ ] Variables in `.env.example` match the definitive list in `docs/CTO_SPECS.md`
- [ ] Comments in `.env.example` clearly identify each section
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

- **`.gitignore` used `.env*` instead of `.env*.local`**: The `create-next-app` scaffold (task-1.1) generated `.env*` on line 34 of `.gitignore`, which would have blocked `.env.example` from being committed. Changed to `.env` + `.env*.local` + `!.env.example` to allow the template file to be tracked while keeping secrets ignored.
- **Variable count**: The task file says "11 environment variables" which matches the actual count of distinct variable names (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
