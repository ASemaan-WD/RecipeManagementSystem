---
task_id: 'task-12.3'
title: 'Security Hardening'
phase: 12
task_number: 3
status: 'pending'
priority: 'high'
dependencies:
  - 'task-12.1'
  - 'task-12.2'
blocks:
  - 'task-13.1'
created_at: '2026-02-22'
---

# Security Hardening

## Current State

> The application has Zod validation on all API routes and auth guards on protected routes, but several security gaps exist that must be addressed before production deployment.

- **What exists**:
  - Zod `safeParse()` validation on all API routes accepting body/query input (`src/lib/validations/`)
  - Auth guards: `requireAuth()`, `requireRecipeOwner()`, `canViewRecipe()` in `src/lib/auth-utils.ts`
  - Comment sanitization via regex `content.replace(/<[^>]*>/g, '')` in comment API routes
  - Search query sanitization via `sanitizeSearchQuery()` in `src/lib/search.ts`
  - Cloudinary signed upload requiring authentication: `src/app/api/images/upload-signature/route.ts`
  - Image URL validation using `z.string().url()` in recipe validation schema
  - `.env.local` git-ignored, no secrets committed to repo
  - No `dangerouslySetInnerHTML` usage in production code
  - NextAuth.js v5 with JWT session strategy
- **What is missing**:
  - Comprehensive XSS sanitizer (current regex `/<[^>]*>/g` is insufficient — misses nested/malformed tags)
  - HTML stripping for recipe titles, descriptions, cuisine types, and step instructions
  - Image URL domain restriction (currently accepts any URL, should restrict to trusted domains)
  - Content-Type validation on incoming requests
  - Production error responses in AI routes that leak `err.message` (could expose OpenAI/Prisma internals)
  - CORS header documentation/configuration
  - JWT expiry verification (relying on NextAuth defaults without explicit check)
  - Security-focused tests (XSS, injection, authorization bypass, error response content)
- **Relevant code**:
  - `src/app/api/recipes/[id]/comments/route.ts` — comment sanitization
  - `src/app/api/comments/[id]/route.ts` — comment update sanitization
  - `src/lib/search.ts` — search query sanitization
  - `src/lib/validations/recipe.ts` — recipe validation with `z.string().url()` for images
  - `src/app/api/ai/nutrition/[recipeId]/route.ts` — exposes `err.message` in 500 response
  - `src/app/api/ai/generate-image/[recipeId]/route.ts` — exposes `err.message` in 500 response
  - `src/app/api/ai/substitute/route.ts` — exposes `err.message` in 500 response
  - `src/app/api/ai/generate/route.ts` — AI generation route

---

## Desired Outcome

- **End state**: All user-supplied content is sanitized against XSS before storage. Error responses never leak internal details. Image URLs are restricted to trusted domains. All security concerns documented in the roadmap are addressed with tests.
- **User-facing changes**: None visible — security hardening is transparent to users.
- **Developer-facing changes**:
  - A robust `sanitizeHtml()` utility in `src/lib/sanitize.ts`
  - Updated validation schemas with image URL domain restrictions
  - Sanitized error responses in all API routes
  - Content-Type validation utility
  - Comprehensive security test suite

---

## Scope & Boundaries

### In Scope

- Replace the simple regex sanitizer with a robust HTML stripping function for all user-generated text content (recipe titles, descriptions, cuisine types, step instructions, comments, shopping list names)
- Restrict image URLs to trusted domains (Cloudinary, common image CDNs)
- Fix AI route error responses to never expose raw error messages in production
- Add Content-Type validation to mutation API routes
- Verify JWT expiry configuration in NextAuth.js setup
- Verify no API route leaks private recipe data (audit `canViewRecipe` usage across all recipe read paths)
- Verify no secrets exist in the repository (git history check)
- Write security-focused tests: XSS attempts, SQL injection attempts in search, authorization bypass attempts, share link token guessing, error response content verification

### Out of Scope

- Installing DOMPurify or sanitize-html library (these are browser/DOM-based; server-side stripping with a simple but correct function is sufficient since React escapes output by default)
- CORS header configuration (the app is same-origin only; no cross-origin API consumers are planned per `docs/CTO_SPECS.md`)
- Custom domain SSL configuration (handled by Vercel — task 13.2)
- Rate limiting (completed in task 12.1)
- Security headers in `next.config.ts` (completed in task 12.2)
- Penetration testing or third-party security audits

### Dependencies

- Task 12.1 (rate limiting on all routes must be in place)
- Task 12.2 (security headers in `next.config.ts` must be configured)

---

## Implementation Details

### Section 1: Robust HTML Sanitizer

**What to do**: Create a server-side HTML stripping utility and apply it to all user-generated text fields.

**Where to find context**:

- `src/app/api/recipes/[id]/comments/route.ts` — current regex sanitizer
- `docs/ROADMAP.md` Phase 12.3: "Sanitize user content (XSS prevention in titles/descriptions/comments)"

**Specific requirements**:

- Create `src/lib/sanitize.ts` with:
  - `sanitizeText(input: string): string` — strips all HTML tags, decodes HTML entities, trims whitespace
  - Handle edge cases: nested tags (`<scr<script>ipt>`), unclosed tags, HTML entities (`&lt;script&gt;`), null bytes
  - Do NOT install a heavy library — a well-tested regex-based approach or iterative stripping is sufficient since React escapes JSX output (this is defense-in-depth, not the primary XSS barrier)
- Apply `sanitizeText()` in:
  - Recipe creation/update: title, description, cuisineType, step instructions, ingredient notes
  - Comment creation/update: content (replace existing regex)
  - Shopping list creation/update: name, item names
  - Username setting: already validated by regex `^[a-zA-Z0-9_]{3,20}$` — no HTML possible
- Apply sanitization AFTER Zod validation, BEFORE database write
- Do NOT modify the Zod schemas themselves (sanitization is a separate concern from validation)

**Patterns to follow**:

- Per `docs/SENIOR_DEVELOPER.md`: utilities in `src/lib/` with clear JSDoc documentation
- Defense-in-depth: React escapes output + server-side stripping + no `dangerouslySetInnerHTML`

---

### Section 2: Image URL Domain Restriction

**What to do**: Restrict recipe image URLs to trusted domains.

**Where to find context**:

- `src/lib/validations/recipe.ts` — current validation uses `z.string().url()`
- `docs/CTO_SPECS.md` Decision 5: Images come from Cloudinary uploads, external URLs, or AI-generated (stored via Cloudinary)

**Specific requirements**:

- Create a custom Zod refinement for image URLs that validates the domain:
  - Allowed domains: `res.cloudinary.com`, `images.unsplash.com`, `oaidalleapiprodscus.blob.core.windows.net` (DALL-E temporary URLs), and any domain matching `*.cloudinary.com`
  - Also allow relative URLs starting with `/` (for potential local assets)
- Apply to the `images` array in `createRecipeSchema` and `updateRecipeSchema`
- Update the `ImageSource.URL` validation to use the restricted URL schema
- Provide a clear error message: "Image URL must be from a trusted source (Cloudinary, Unsplash)"

**Patterns to follow**:

- Per `.claude/validation-schema-skill.md`: custom Zod refinements with descriptive error messages

---

### Section 3: Fix Error Response Leakage in AI Routes

**What to do**: Ensure AI route error responses never expose internal error messages in production.

**Where to find context**:

- `src/app/api/ai/nutrition/[recipeId]/route.ts` — catches errors and returns `err.message`
- `src/app/api/ai/generate-image/[recipeId]/route.ts` — same pattern
- `src/app/api/ai/substitute/route.ts` — same pattern
- `src/lib/ai-utils.ts` — `formatAIError()` utility (verify it's used consistently)

**Specific requirements**:

- Audit all 4 AI route files for error handling in catch blocks
- Replace any `err.message` exposure with the `formatAIError()` utility from `src/lib/ai-utils.ts`
- If `formatAIError()` is not already used in all AI routes, add it
- Ensure the error response format is: `{ error: "<user-friendly message>" }` with status 500
- In development mode (`process.env.NODE_ENV === 'development'`), optionally include `details: err.message` for debugging
- Audit all non-AI routes as well — verify they return generic error messages in catch blocks

**Patterns to follow**:

- Per `docs/ROADMAP.md` Phase 12.3: "production error responses don't leak stack traces"
- Per `src/lib/ai-utils.ts`: use the existing `formatAIError(action)` pattern

---

### Section 4: Content-Type Validation

**What to do**: Add Content-Type validation to mutation API routes.

**Where to find context**:

- `docs/ROADMAP.md` Phase 12.3: "content-type validation"

**Specific requirements**:

- Create a utility function `validateContentType(request: Request): NextResponse | null` in `src/lib/api-utils.ts`
- For POST/PUT routes that expect JSON: validate that `Content-Type` header includes `application/json`
- Return `415 Unsupported Media Type` with `{ error: "Content-Type must be application/json" }` if invalid
- Apply to all mutation (POST/PUT/DELETE with body) API routes
- Do NOT apply to GET or DELETE routes without bodies, or to multipart/form-data routes (if any exist)

**Patterns to follow**:

- Same utility function pattern as `checkRateLimit()` — returns `NextResponse | null`

---

### Section 5: JWT Configuration Verification

**What to do**: Verify and document the JWT session configuration in NextAuth.js.

**Where to find context**:

- `src/lib/auth.ts` — NextAuth configuration
- `docs/CTO_SPECS.md`: JWT session strategy

**Specific requirements**:

- Verify that NextAuth.js JWT sessions have a reasonable expiry (default is 30 days — confirm this is acceptable)
- Verify that the `NEXTAUTH_SECRET` environment variable is used for JWT signing
- If JWT maxAge is not explicitly set, consider adding `session: { maxAge: 30 * 24 * 60 * 60 }` (30 days) for explicitness
- Document the JWT configuration in the Notes section (no code change needed if defaults are acceptable)

**Patterns to follow**:

- Per NextAuth.js v5 documentation for JWT session configuration

---

### Section 6: Visibility & Authorization Audit

**What to do**: Comprehensive audit of all recipe read paths to ensure no private data leaks.

**Where to find context**:

- `src/lib/auth-utils.ts` — `canViewRecipe()`, `requireAuth()`, `requireRecipeOwner()`
- All API routes under `src/app/api/recipes/`
- `docs/CTO_SPECS.md` Decision 3: Three-Tier Visibility

**Specific requirements**:

- Audit each recipe-reading endpoint and verify it checks visibility:
  - `GET /api/recipes` — must filter by visibility (own + public + shared)
  - `GET /api/recipes/[id]` — must use `canViewRecipe()`
  - `GET /api/recipes/[id]/comments` — must verify recipe is accessible
  - `GET /api/recipes/[id]/ratings` — must verify recipe is accessible
  - `GET /api/search` — must filter by visibility
  - `GET /api/share/[token]` — must verify token is active
  - `GET /api/collections` — must filter to own tags/saves
  - `GET /api/recipes/shared-with-me` — must filter to own shares
- Verify that comment/rating creation also checks recipe accessibility (not just auth)
- Verify that the user search endpoint (`/api/users/search`) does not leak email addresses
- Document any gaps found; fix them inline

**Patterns to follow**:

- Per `docs/CTO_SPECS.md` Decision 8: Guest Access — API-Level Enforcement

---

### Section 7: Security Tests

**What to do**: Write comprehensive security-focused tests.

**Where to find context**:

- `docs/ROADMAP.md` Phase 12.3: "Security tests: XSS, injection, authorization bypass, share link token guessing, error response content"
- Existing test files in `src/app/api/` for patterns

**Specific requirements**:

- Create `src/lib/__tests__/sanitize.test.ts`:
  - Test `sanitizeText()` strips `<script>` tags, nested tags, event handlers (`onerror`, `onclick`), HTML entities, null bytes
  - Test it preserves normal text, numbers, special characters (ampersands, quotes)
  - Test edge cases: empty string, very long strings, Unicode
- Create `src/__tests__/security/` directory with:
  - `xss.test.ts`: Test that API routes strip HTML from all user-supplied text fields (recipe title, description, comments, etc.)
  - `injection.test.ts`: Test that SQL injection attempts in search queries are safely handled (e.g., `'; DROP TABLE Recipe; --`)
  - `authorization.test.ts`: Test authorization bypass attempts:
    - Non-owner cannot edit/delete another user's recipe
    - Non-owner cannot view a private recipe
    - Non-shared user cannot view a shared recipe
    - Expired/revoked share link denies access
    - Random token does not grant access
  - `error-responses.test.ts`: Test that 500 error responses from AI routes do not contain stack traces or internal error details

**Patterns to follow**:

- Per `.claude/test-file-skill.md`: co-located tests, vi.mock for dependencies, MSW for HTTP mocking
- Security tests can be in a dedicated `src/__tests__/security/` directory since they span multiple modules

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors
- [ ] All existing tests pass (`npm run test`)

### Functional Verification

- [ ] `sanitizeText()` strips all HTML tags and entities from user input
- [ ] Recipe creation with `<script>` in title results in cleaned text stored in DB
- [ ] Image URLs from non-trusted domains are rejected with validation error
- [ ] AI route 500 errors return generic messages (no `err.message` leakage)
- [ ] Content-Type validation returns 415 for non-JSON mutation requests
- [ ] No API route leaks private recipe data to unauthorized users
- [ ] User search endpoint returns only id/username/name/image (no email)
- [ ] All security tests pass

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] `sanitizeText()` has comprehensive JSDoc documentation

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
