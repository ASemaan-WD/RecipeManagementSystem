---
task_id: 'task-13.2'
title: 'Deploy to Vercel'
phase: 13
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-13.1'
blocks:
  - 'task-13.3'
created_at: '2026-02-22'
---

# Deploy to Vercel

## Current State

> The application has been verified to build and run in production mode (task 13.1). Vercel configuration is in place. Production environment setup is documented but not yet executed.

- **What exists**:
  - Clean production build (`npm run build` passing)
  - `vercel.json` with function timeout configuration for AI routes
  - `.env.example` with all required environment variables
  - Production setup documentation from task 13.1 Notes section
  - GitHub repository with all code committed
- **What is missing**:
  - Vercel project connected to GitHub repository
  - Production Neon database with migrations applied
  - Production environment variables set in Vercel dashboard
  - OAuth redirect URIs updated for production domain
  - First successful production deployment
  - Production smoke testing
- **Relevant code**:
  - `vercel.json` — deployment configuration
  - `prisma/schema.prisma` — database schema for migration
  - `prisma/seed.ts` — seed script for demo data
  - `.env.example` — environment variable reference

---

## Desired Outcome

- **End state**: The application is live on a Vercel `*.vercel.app` URL with a working production database, functional OAuth authentication, and all features operational.
- **User-facing changes**: The application is publicly accessible at a Vercel URL.
- **Developer-facing changes**:
  - Vercel project configured with automatic deployments from `main` branch
  - Production Neon database with migrations applied and seed data loaded
  - All environment variables configured in Vercel dashboard

---

## Scope & Boundaries

### In Scope

- Connect GitHub repository to Vercel
- Configure Vercel build settings (framework, build command, output directory)
- Set up production Neon database (create project/branch, get connection string)
- Run `prisma migrate deploy` against production database
- Run seed script against production database for demo data
- Set all environment variables in Vercel dashboard
- Update Google OAuth app with production redirect URI
- Update GitHub OAuth app with production redirect URI
- Trigger first deployment and monitor build logs
- Verify production URL loads and serves pages correctly
- Perform basic smoke testing: landing page, login flow, public community page
- Cross-browser verification (Chrome, Firefox, Edge — at minimum)

### Out of Scope

- Custom domain configuration (using `*.vercel.app` per `docs/CTO_SPECS.md`)
- Vercel Analytics setup (task 13.4)
- Comprehensive QA testing of all user flows (task 13.3)
- README updates with live URL (task 13.4)
- CI/CD pipeline beyond Vercel auto-deploy (no GitHub Actions needed per `docs/CTO_SPECS.md`)
- Performance monitoring or error tracking setup (task 13.4)

### Dependencies

- Task 13.1 completed (production build verified, `vercel.json` created)
- GitHub repository is up to date with all changes pushed

---

## Implementation Details

### Section 1: Vercel Project Setup

**What to do**: Connect the GitHub repository to Vercel and configure build settings.

**Where to find context**:

- `docs/CTO_SPECS.md` Deployment section: "Vercel auto-deploy from GitHub"
- `vercel.json` — build and function configuration

**Specific requirements**:

- Log in to Vercel and create a new project
- Import the GitHub repository
- Verify Vercel auto-detects Next.js framework
- Verify build command is read from `vercel.json`: `prisma generate && next build`
- Set the root directory to the project root
- Do NOT deploy yet (environment variables must be set first)

**Patterns to follow**:

- Per `docs/CTO_SPECS.md`: Vercel platform with auto-deploy from GitHub

---

### Section 2: Production Database Setup

**What to do**: Create and configure the production Neon PostgreSQL database.

**Where to find context**:

- `docs/CTO_SPECS.md`: Neon PostgreSQL hosting
- `prisma/schema.prisma` — database schema
- `prisma/seed.ts` — seed data

**Specific requirements**:

- Create a new Neon project (or a new branch on an existing project) for production
- Get the production `DATABASE_URL` connection string
- Run migrations against the production database: `DATABASE_URL=<prod_url> npx prisma migrate deploy`
- Verify all tables are created (19 tables per schema)
- Optionally run the seed script for demo data: `DATABASE_URL=<prod_url> npx prisma db seed`
- Verify full-text search trigger and GIN index exist (from the raw SQL migration in task 2.7)

**Patterns to follow**:

- Use `prisma migrate deploy` (NOT `migrate dev`) for production — this applies pending migrations without creating new ones

---

### Section 3: Environment Variables Configuration

**What to do**: Set all required environment variables in the Vercel dashboard.

**Where to find context**:

- `.env.example` — complete list of variables
- `docs/ROADMAP.md` Appendix B: Environment Variable Reference

**Specific requirements**:

- Set the following in Vercel project settings → Environment Variables:
  - `DATABASE_URL` — production Neon connection string
  - `NEXTAUTH_SECRET` — generate a new random secret (`openssl rand -base64 32`)
  - `NEXTAUTH_URL` — the Vercel production URL (e.g., `https://recipe-management.vercel.app`)
  - `GOOGLE_CLIENT_ID` — from Google Cloud Console
  - `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
  - `GITHUB_CLIENT_ID` — from GitHub Developer Settings
  - `GITHUB_CLIENT_SECRET` — from GitHub Developer Settings
  - `OPENAI_API_KEY` — production OpenAI API key
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
  - `CLOUDINARY_API_KEY` — Cloudinary API key
  - `CLOUDINARY_API_SECRET` — Cloudinary API secret
- Set variables for all environments (Production, Preview, Development) as appropriate
- `NEXTAUTH_URL` should be different for Preview deployments (Vercel auto-sets `VERCEL_URL`)

**Patterns to follow**:

- Never commit production secrets to the repository
- Use Vercel's environment variable scoping (Production vs Preview vs Development)

---

### Section 4: OAuth Redirect URI Updates

**What to do**: Update OAuth applications with production callback URLs.

**Where to find context**:

- `docs/ROADMAP.md` Phase 13.1: "Update OAuth redirect URIs for production"
- `docs/CTO_SPECS.md`: Google OAuth + GitHub OAuth

**Specific requirements**:

- **Google Cloud Console**:
  - Navigate to APIs & Services → Credentials → OAuth 2.0 Client
  - Add authorized redirect URI: `https://<app>.vercel.app/api/auth/callback/google`
  - Keep the existing `http://localhost:3000/api/auth/callback/google` for development
- **GitHub Developer Settings**:
  - Navigate to Settings → Developer Settings → OAuth Apps
  - Update or add the callback URL: `https://<app>.vercel.app/api/auth/callback/github`
  - Note: GitHub OAuth apps only support one callback URL — consider creating a separate app for production, or update the existing one
- Verify both callback URLs use HTTPS (Vercel provides this automatically)

**Patterns to follow**:

- Per `docs/ROADMAP.md`: include both development and production redirect URIs

---

### Section 5: First Deployment & Smoke Testing

**What to do**: Trigger the first deployment and verify core functionality.

**Where to find context**:

- `docs/ROADMAP.md` Phase 13.2: "Trigger first deployment, monitor build logs"

**Specific requirements**:

- Trigger deployment (push to `main` or manual deploy from Vercel dashboard)
- Monitor build logs for errors
- Verify the production URL loads successfully
- Smoke test the following:
  - Landing page renders with hero section and featured recipes
  - Login page renders with Google and GitHub buttons
  - OAuth flow works (sign in with Google, sign in with GitHub)
  - Onboarding page appears for new users (username setup)
  - Dashboard renders after authentication
  - Community page loads with public recipes (if seeded)
  - Recipe detail page loads for a public recipe
  - Search page functions (basic search query)
  - AI features respond (if OpenAI key is configured)
- Cross-browser check: Chrome, Firefox, Edge (at minimum)
  - Verify pages render, no layout breaks, no console errors
- Mobile check: resize browser to mobile width
  - Verify responsive layout, hamburger menu, touch targets

**Patterns to follow**:

- Per `docs/ROADMAP.md` Phase 13.2: "Verify production URL, run OAuth flows, test Cloudinary uploads, test AI features"

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Vercel build completes successfully
- [ ] Build logs show no errors
- [ ] Deployment URL is accessible via HTTPS

### Functional Verification

- [ ] Landing page renders correctly on production URL
- [ ] Google OAuth login works end-to-end (sign in → onboarding → dashboard)
- [ ] GitHub OAuth login works end-to-end
- [ ] Community page shows public recipes (if seeded)
- [ ] Recipe detail page loads for a public recipe
- [ ] Search returns results for a valid query
- [ ] Security headers are present in production responses
- [ ] Application works in Chrome, Firefox, and Edge
- [ ] Responsive layout works on mobile viewport

### Code Quality Checks

- [ ] No changes to application source code in this task (deployment only)
- [ ] `vercel.json` configuration is correct and applied
- [ ] All environment variables are set correctly in Vercel

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
