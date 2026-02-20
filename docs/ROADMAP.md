# Recipe Management System — Development Roadmap

> **Project:** AI-Enhanced Recipe Management Platform
> **Stack:** Next.js 14+ (App Router) · shadcn/ui · Tailwind CSS · Prisma · PostgreSQL (Neon) · NextAuth.js v5 · OpenAI · Cloudinary · Vercel
> **Status:** Specification phase complete — ready for implementation

---

## Phase 1: Project Scaffolding & Dev Environment

**Goal:** Initialize the monorepo, install all dependencies, configure tooling, and establish the foundational project structure so every subsequent phase builds on a clean, working baseline.

### Task 1.1 — Initialize Next.js Project

- Run `npx create-next-app@latest` with the following flags: TypeScript, Tailwind CSS, ESLint, App Router, `src/` directory, import alias `@/*`
- Verify the project boots with `npm run dev` and renders the default page
- Remove boilerplate content from `src/app/page.tsx` and `src/app/layout.tsx`

### Task 1.2 — Install Core Dependencies

- Install production dependencies:
  - `prisma` and `@prisma/client` (ORM)
  - `next-auth@beta` (Auth.js v5)
  - `@tanstack/react-query` and `@tanstack/react-query-devtools` (server state)
  - `react-hook-form` and `@hookform/resolvers` (forms)
  - `zod` (schema validation)
  - `ai` and `@ai-sdk/openai` (Vercel AI SDK)
  - `next-cloudinary` (Cloudinary integration)
  - `bcryptjs` (if needed for token hashing)
  - `nanoid` (unique token generation for share links)
- Install dev dependencies:
  - `prettier`, `prettier-plugin-tailwindcss`
  - `@types/node`, `@types/react`, `@types/react-dom`
  - Testing libraries (see Phase 10)

### Task 1.3 — Install and Configure shadcn/ui

- Run `npx shadcn-ui@latest init` with the New York style, slate base color, CSS variables enabled
- Install initial set of shadcn/ui components needed across the app:
  - `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`, `avatar`, `badge`, `tabs`, `separator`, `skeleton`, `toast`, `sonner`, `sheet`, `select`, `textarea`, `command`, `popover`, `tooltip`, `slider`, `switch`, `checkbox`, `form`, `progress`, `scroll-area`, `alert`, `alert-dialog`
- Verify components render correctly with a quick smoke test

### Task 1.4 — Configure Environment Variables

- Create `.env.example` with all required variables (no real values):
  ```
  DATABASE_URL=
  NEXTAUTH_SECRET=
  NEXTAUTH_URL=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=
  OPENAI_API_KEY=
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  ```
- Create `.env.local` (git-ignored) with actual development values
- Add `.env.local` to `.gitignore` (confirm it's present)

### Task 1.5 — Set Up Project Directory Structure

- Create the full folder hierarchy under `src/`:
  ```
  src/
  ├── app/
  │   ├── (auth)/           # Auth-related pages (login, onboarding)
  │   ├── (main)/           # Authenticated app pages
  │   ├── api/              # API route handlers
  │   └── globals.css
  ├── components/
  │   ├── ui/               # shadcn/ui primitives
  │   ├── layout/           # Header, Navigation, Footer, Sidebar
  │   ├── recipes/          # Recipe-specific components
  │   ├── search/           # Search bar, filters, results
  │   ├── social/           # Ratings, comments, sharing
  │   ├── ai/               # AI feature components
  │   └── shared/           # Reusable cross-cutting components
  ├── hooks/                # Custom React hooks
  ├── lib/                  # Utility modules (auth, db, openai, etc.)
  ├── types/                # TypeScript type definitions
  └── providers/            # React context providers
  ```
- Create placeholder `index.ts` barrel files where appropriate

### Task 1.6 — Configure Tailwind CSS & Theme

- Extend `tailwind.config.ts` with custom colors matching the design system
- Configure dark mode support (`class` strategy for manual toggle)
- Add custom font configuration (if applicable)
- Set up responsive breakpoints (mobile-first: `sm`, `md`, `lg`, `xl`)
- Define any custom animations or keyframes needed

### Task 1.7 — Configure TypeScript Strictly

- Review `tsconfig.json` and enable strict settings:
  - `"strict": true`
  - `"noUncheckedIndexedAccess": true`
  - `"forceConsistentCasingInFileNames": true`
- Verify path aliases (`@/*` → `src/*`) work correctly
- Add any necessary type declaration files

### Task 1.8 — Configure ESLint & Prettier

- Extend ESLint configuration with recommended rules for Next.js, TypeScript, and React hooks
- Create `.prettierrc` with team-consistent settings (semicolons, single quotes, trailing commas, print width)
- Add lint and format scripts to `package.json`:
  - `"lint": "next lint"`
  - `"format": "prettier --write ."`
  - `"format:check": "prettier --check ."`

### Task 1.9 — Set Up Git Hooks (Optional but Recommended)

- Consider adding `husky` + `lint-staged` for pre-commit linting
- Configure `lint-staged` to run ESLint and Prettier on staged files
- Ensure hooks don't block CI/CD pipelines

### Task 1.10 — Create Initial README.md

- Write a comprehensive README with:
  - Project name and description
  - Tech stack overview
  - Prerequisites (Node.js version, npm/pnpm)
  - Local development setup instructions (clone, install, env vars, db, seed, run)
  - Available scripts (`dev`, `build`, `lint`, `format`, `db:push`, `db:seed`)
  - Project structure overview
  - Deployment instructions (Vercel)
  - License

---

## Phase 2: Database Schema & Prisma Setup

**Goal:** Define the complete PostgreSQL database schema using Prisma, configure the Neon database connection, run migrations, and create the seed script with diverse recipe data.

### Task 2.1 — Initialize Prisma

- Run `npx prisma init` to create `prisma/schema.prisma` and update `.env`
- Set the datasource provider to `postgresql`
- Configure the Neon connection string in `DATABASE_URL`
- Set up Prisma client generation with appropriate preview features

### Task 2.2 — Define Core Models & Enums

- Define all enums in `schema.prisma`: `Difficulty`, `Visibility`, `TagStatus`, `ImageSource`
- Create `User` model with all fields per CTO_SPECS.md plus NextAuth adapter fields (`emailVerified`, `accounts`, `sessions`)
- Create `Account` model (OAuth provider data) per Auth.js v5 Prisma adapter requirements
- Create `Session` model per Auth.js v5 Prisma adapter requirements
- Create `VerificationToken` model per Auth.js v5 Prisma adapter requirements

### Task 2.3 — Define Recipe & Related Models

- Create `Recipe` model with all fields, relations, and inline indexes per CTO_SPECS.md
- Create recipe sub-models: `RecipeImage`, `Ingredient`, `RecipeIngredient`, `RecipeStep`, `DietaryTag`, `RecipeDietaryTag`
- Create tagging models: `UserRecipeTag` (multi-tag support), `SavedRecipe`
- Create sharing models: `RecipeShare` (share-by-username), `ShareLink` (share-by-link)
- Create social models: `Rating` (1-5 stars, upsert pattern), `Comment` (flat list)
- All unique constraints, cascade deletes, and inline indexes per CTO_SPECS.md

### Task 2.4 — Define Shopping List Models

- Create `ShoppingList` model per SENIOR_DEVELOPER.md Phase 7b
- Create `ShoppingListItem` model per SENIOR_DEVELOPER.md Phase 7b
- Add `shoppingLists ShoppingList[]` relation to the `User` model

### Task 2.5 — Add Database Indexes

- Audit existing indexes from CTO_SPECS.md model definitions
- Add additional performance indexes: composite `[visibility, createdAt]` on Recipe, `difficulty`, `avgRating`, `ingredientId` on RecipeIngredient, `[userId, status]` on UserRecipeTag, `userId` on RecipeShare, `recipeId` on Rating

### Task 2.6 — Configure Prisma Client & Run Migration

- Create `src/lib/db.ts` with a singleton Prisma client instance (global pattern for Next.js hot reload)
- Validate the schema (`npx prisma validate`)
- Run the initial migration (`npx prisma migrate dev --name init`)
- Generate the Prisma client types (`npx prisma generate`)
- Verify all 19 tables, indexes, constraints, and enums are created

### Task 2.7 — Set Up Full-Text Search

- Create a raw SQL migration to add PostgreSQL full-text search capabilities:
  - Add a `searchVector` column (tsvector) to the `Recipe` table
  - Create a GIN index on the `searchVector` column
  - Create a trigger to auto-update `searchVector` on INSERT/UPDATE using `name`, `description`, and `cuisineType`
- Test full-text search with a sample query

### Task 2.8 — Create Seed Script & DB Utilities

- Install `tsx` and configure Prisma seed command in `package.json`
- Add convenience scripts: `db:push`, `db:migrate`, `db:seed`, `db:studio`, `db:reset`
- Create `prisma/seed.ts` with:
  - System user ("RecipeApp") and 2–3 test users
  - All dietary tags (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Paleo, Halal, Low-Carb)
  - 15–20 diverse recipes across multiple cuisines with full data (ingredients, steps, images, dietary tags, nutrition data)
  - Sample ratings and comments for demo purposes
- Idempotent seed script (safe to re-run)

---

## Phase 3: Authentication & User Management

**Goal:** Implement NextAuth.js v5 with Google and GitHub OAuth providers, JWT sessions, username onboarding flow, and auth middleware to protect routes.

### Task 3.1 — Configure NextAuth.js v5 & Auth Routes

- Create `src/lib/auth.ts` (or `auth.ts` at root) with NextAuth configuration:
  - Prisma adapter for database persistence
  - JWT session strategy (not database sessions)
  - Google OAuth provider with client ID/secret from env
  - GitHub OAuth provider with client ID/secret from env
- Configure callbacks:
  - `jwt` callback: attach `userId` and `username` to the token
  - `session` callback: expose `userId` and `username` on the session object
  - `signIn` callback: handle first-time sign-in logic if needed
- Export `handlers` (GET, POST), `auth`, `signIn`, `signOut`
- Create `src/app/api/auth/[...nextauth]/route.ts`
- Export the GET and POST handlers from the NextAuth configuration
- Verify OAuth callback URLs work for both Google and GitHub
- Document the steps to create Google OAuth app (Google Cloud Console)
- Document the steps to create GitHub OAuth app (GitHub Developer Settings)
- Include redirect URIs: `http://localhost:3000/api/auth/callback/google` and `/github`
- Add production redirect URIs for Vercel deployment

### Task 3.2 — Create Auth Middleware & Helper Utilities

- Create `middleware.ts` at the project root
- Define protected route matchers (e.g., `/dashboard`, `/recipes/new`, `/recipes/*/edit`, `/my-collection`, `/settings`)
- Define public routes (e.g., `/`, `/login`, `/community`, `/recipes/*` for viewing, `/api/auth/*`)
- Redirect unauthenticated users to `/login` when accessing protected routes
- Redirect authenticated users away from `/login` to `/dashboard`
- Create `src/lib/auth-utils.ts` with helper functions:
  - `getCurrentUser()`: get the current authenticated user from the session (server-side)
  - `requireAuth()`: throw/redirect if not authenticated (for API routes)
  - `requireRecipeOwner(recipeId)`: verify the current user owns a specific recipe
  - `canViewRecipe(recipeId)`: check if the current user has visibility access to a recipe (owner, public, shared, or valid share link)
- These helpers will be used extensively in API routes

### Task 3.3 — Create Login Page

- Create `src/app/(auth)/login/page.tsx`
- Design a clean login page with:
  - App logo and name
  - Brief description / tagline
  - "Sign in with Google" button (styled with Google icon)
  - "Sign in with GitHub" button (styled with GitHub icon)
  - Terms of service / privacy policy links (optional)
- Use shadcn/ui components (Card, Button)
- Handle error states (e.g., OAuthAccountNotLinked)

### Task 3.4 — Create Username Onboarding Flow

- Create `src/app/(auth)/onboarding/page.tsx`
- Design a step to capture username on first login:
  - Input field with validation: `^[a-zA-Z0-9_]{3,20}$` (alphanumeric + underscores, 3-20 chars)
  - Real-time availability check (debounced API call)
  - Case-sensitive display, explain that username cannot be changed
  - "Continue" button (disabled until valid + available)
- Create API route `src/app/api/auth/username/route.ts`:
  - POST: set username for the authenticated user
  - GET: check username availability
- Add middleware/logic to redirect users without a username to `/onboarding`

### Task 3.5 — Set Up Root Providers & App Layout

- Create `src/providers/auth-provider.tsx` using `SessionProvider` from NextAuth
- Ensure session data is available client-side via `useSession()`
- Create `src/providers/query-provider.tsx` with `QueryClientProvider`
- Configure default query options (staleTime, retry, refetchOnWindowFocus)
- Add React Query DevTools in development mode
- Update `src/app/layout.tsx`:
  - Wrap children with AuthProvider and QueryProvider
  - Add ThemeProvider for dark mode support (from shadcn/ui `next-themes`)
  - Set metadata (title, description, favicon)
  - Configure the root font (Inter or similar)
  - Add Toaster component for notifications

### Task 3.6 — Write Tests for Authentication

- Test OAuth callback handling
- Test username validation (regex, length, uniqueness)
- Test username availability check endpoint
- Test auth middleware redirects (protected routes, public routes)
- Test `requireAuth()` utility for unauthenticated requests
- Test `requireRecipeOwner()` with owned/unowned recipes
- Test `canViewRecipe()` across all visibility levels (private, shared, public)
- Test session callback attaches correct user data

---

## Phase 4: Core Layout & Navigation

**Goal:** Build the shell of the application — header, navigation, sidebar, footer — so all subsequent pages slot into a consistent, responsive layout.

### Task 4.1 — Create Header & Navigation (Desktop + Mobile)

- Create `src/components/layout/header.tsx`:
  - App logo (linked to `/` or `/dashboard`)
  - Global search bar (placeholder — wired in Phase 7)
  - Navigation links (My Recipes, Community, Shopping Lists)
  - User avatar dropdown (profile, settings, dark mode toggle, sign out)
  - "Add Recipe" button (prominent CTA)
  - Mobile hamburger menu trigger
- Use shadcn/ui components: DropdownMenu, Avatar, Button, Sheet (mobile)
- Create `src/components/layout/mobile-nav.tsx`:
  - Sheet/drawer that slides in from the left
  - Full navigation links
  - User info section
  - Sign out button
- Ensure touch targets are at least 44px (mobile accessibility)

### Task 4.2 — Create Main App Layout & Footer

- Create `src/components/layout/footer.tsx`:
  - Copyright notice
  - Links (About, Privacy, Terms)
  - "Built with Next.js" or similar attribution
- Keep it minimal and unobtrusive
- Create `src/app/(main)/layout.tsx`:
  - Header at top
  - Main content area with proper padding/max-width
  - Footer at bottom
  - Responsive container (max-width with centered content)
- This layout wraps all authenticated pages

### Task 4.3 — Create Landing Page & Dashboard

- Create `src/app/page.tsx` (Unauthenticated Landing Page):
  - Hero section with tagline and CTA ("Get Started" → login)
  - Featured recipes preview (from seed data, summary cards only)
  - Feature highlights (AI-powered, sharing, collections)
  - Responsive layout with appealing visuals
  - For authenticated users, redirect to `/dashboard`
- Create `src/app/(main)/dashboard/page.tsx` (Authenticated Dashboard):
  - Welcome message with user's name
  - Quick stats (total recipes, favorites, to-try count)
  - Recent recipes (last 5 created/edited)
  - Quick actions (Add Recipe, Browse Community, View Collection)
  - Community highlights (top-rated public recipes)
  - Use skeleton loaders while data fetches

### Task 4.4 — Create Loading, Error States & Dark Mode

- Create `src/app/loading.tsx` (global loading fallback)
- Create `src/app/error.tsx` (global error boundary)
- Create `src/app/not-found.tsx` (custom 404 page)
- Create reusable loading skeleton components for common patterns (recipe card skeleton, list skeleton, page skeleton)
- Configure `next-themes` ThemeProvider with `attribute="class"` and `defaultTheme="system"`
- Create a theme toggle component (sun/moon icon button)
- Place toggle in the header dropdown and mobile nav
- Verify all shadcn/ui components respect dark mode
- Test all custom styles in both light and dark themes

### Task 4.5 — Write Tests for Layout & Navigation

- Test Header renders correctly for authenticated and unauthenticated states
- Test navigation links point to correct routes
- Test mobile navigation opens and closes properly
- Test dark mode toggle switches themes
- Test landing page displays correctly for guests
- Test dashboard redirects unauthenticated users
- Test responsive behavior at different breakpoints

---

## Phase 5: Recipe CRUD Operations

**Goal:** Implement the complete recipe lifecycle — create, read, update, delete, and duplicate recipes — with a multi-step form wizard, image management, and Pinterest-style grid display.

### Task 5.1 — Create Recipe Types & Validation Schemas

- Create `src/types/recipe.ts` with comprehensive types:
  - `RecipeFormData` (Zod schema for form validation)
  - `RecipeListItem` (summary for grid display)
  - `RecipeDetail` (full recipe with all relations)
  - `RecipeIngredientInput`, `RecipeStepInput` (for form arrays)
  - `RecipeFilters` (search/filter parameters)
  - `PaginatedResponse<T>` (generic paginated response)
- Create `src/lib/validations/recipe.ts`:
  - `createRecipeSchema`: validates all fields for recipe creation
    - title: 1-200 chars, required
    - description: 1-2000 chars, required
    - prepTime: positive integer, required
    - cookTime: positive integer, required
    - servings: positive integer (1-100), required
    - difficulty: enum validation
    - cuisineType: 1-50 chars, required
    - visibility: enum validation, default PRIVATE
    - ingredients: array of { name, quantity, unit, notes, order }, min 1 item
    - steps: array of { instruction, duration, stepNumber }, min 1 item
    - dietaryTags: array of tag IDs
    - images: array of { url, source, isPrimary, order }
  - `updateRecipeSchema`: partial version of create schema
  - `recipeFilterSchema`: validates search/filter query params

### Task 5.2 — Create Recipe API Routes

- Create `src/app/api/recipes/route.ts`:
  - **GET** `/api/recipes`: List recipes with pagination, filtering, and sorting
    - Query params: `page`, `limit`, `search`, `cuisine`, `difficulty`, `maxPrepTime`, `dietary`, `sort` (newest, rating, prepTime), `visibility`
    - For authenticated users: return their own recipes + public recipes
    - For guests: return only public recipes (summary fields only)
    - Include pagination metadata (total, page, pageSize, totalPages)
  - **POST** `/api/recipes`: Create a new recipe
    - Require authentication
    - Validate body against `createRecipeSchema`
    - Create recipe with all related records (ingredients, steps, images, dietary tags) in a transaction
    - Handle ingredient upsert (create if not exists in global `Ingredient` table)
    - Return the created recipe with all relations
- Create `src/app/api/recipes/[id]/route.ts`:
  - **GET** `/api/recipes/:id`: Get full recipe details
    - Check visibility permissions via `canViewRecipe()`
    - Include all relations: author, images, ingredients (with ingredient names), steps, dietary tags, user's tags/rating
    - For guests: return summary-only fields if recipe is public
  - **PUT** `/api/recipes/:id`: Update a recipe
    - Require authentication + ownership via `requireRecipeOwner()`
    - Validate body against `updateRecipeSchema`
    - Handle partial updates (only update provided fields)
    - Handle ingredient/step list updates (delete removed, add new, update existing) in a transaction
  - **DELETE** `/api/recipes/:id`: Delete a recipe
    - Require authentication + ownership
    - Cascade delete all related records (images, ingredients, steps, tags, shares, ratings, comments)
    - Return success confirmation
- Create `src/app/api/recipes/[id]/duplicate/route.ts`:
  - **POST** `/api/recipes/:id/duplicate`: Duplicate a recipe
    - Require authentication
    - Require view access to the source recipe
    - Create a new recipe copying all data (title with " (Copy)" suffix)
    - Set the new recipe's author to the current user
    - Set visibility to PRIVATE
    - Copy ingredients, steps, dietary tags, images (by reference)
    - Return the new recipe
- Create `src/app/api/images/[id]/route.ts`:
  - **DELETE** `/api/images/:id`: Delete a recipe image
    - Require authentication + recipe ownership
    - Remove from Cloudinary (if uploaded)
    - Remove from database
    - Return success

### Task 5.3 — Create Recipe Form Wizard & Image Upload

- Create `src/components/recipes/recipe-form/recipe-form-wizard.tsx`:
  - Multi-step wizard with progress indicator (Step 1 of 5)
  - Step navigation (Previous, Next, Submit)
  - Step titles: Basic Info → Ingredients → Instructions → Tags → Images
  - Per-step validation before allowing next
  - Review summary before final submission
  - Form state persistence across steps (React Hook Form context)
  - Loading state during submission
  - Error handling with toast notifications
- Use React Hook Form with Zod resolver throughout all steps
- **Step 1 — Basic Info** (`basic-info-step.tsx`):
  - Recipe title input
  - Description textarea (with character count)
  - Prep time and cook time inputs (minutes)
  - Servings input (number)
  - Difficulty select (Easy, Medium, Hard)
  - Cuisine type input (with suggestions/autocomplete from existing recipes)
  - Visibility select (Private, Shared, Public)
  - All fields show inline validation errors
- **Step 2 — Ingredients** (`ingredients-step.tsx`):
  - Dynamic ingredient list using `useFieldArray`
  - Each ingredient row: name (with autocomplete from existing ingredients), quantity, unit, notes (optional)
  - Add ingredient button (adds a blank row)
  - Remove ingredient button (per row, with confirmation if populated)
  - Drag-and-drop reordering (or up/down buttons)
  - Minimum 1 ingredient required validation
  - "Common ingredients" quick-add suggestions
- **Step 3 — Instructions** (`steps-step.tsx`):
  - Dynamic step list using `useFieldArray`
  - Each step: step number (auto-generated), instruction textarea, optional duration (minutes)
  - Add step button
  - Remove step button (with confirmation)
  - Reorder steps (auto-renumber on reorder)
  - Minimum 1 step required validation
- **Step 4 — Tags & Diet** (`tags-step.tsx`):
  - Dietary tag multi-select (checkboxes or tag chips)
  - Load available dietary tags from the database
  - Visual tag chips for selected tags
  - Option to add custom dietary tags (stretch)
- **Step 5 — Images** (`images-step.tsx`):
  - Three image source options:
    1. **Upload**: Cloudinary upload widget integration (drag-and-drop, file picker)
    2. **URL**: Direct image URL input with preview
    3. **AI Generate**: Button to generate image with DALL-E (wired in Phase 9)
  - Image preview grid with reordering
  - Set primary image toggle
  - Remove image button
  - Maximum image limit (e.g., 5 per recipe)
- **Cloudinary Integration**:
  - Create `src/lib/cloudinary.ts`:
    - Server-side: generate signed upload signatures
    - Configure upload preset, folder, transformations
  - Create `src/app/api/images/upload-signature/route.ts`:
    - POST: Generate a Cloudinary upload signature for client-side uploads
    - Require authentication
  - Create upload widget component using `next-cloudinary` or CldUploadWidget
  - Handle upload success (store URL in form state) and error callbacks

### Task 5.4 — Create Recipe Card & Grid Components

- Create `src/components/recipes/recipe-card.tsx`:
  - Pinterest-style card with:
    - Primary image (with fallback placeholder)
    - Recipe title
    - Cuisine type badge
    - Difficulty badge (color-coded: green/yellow/red)
    - Prep time + cook time
    - Average rating (stars)
    - Author avatar and name
    - Tag indicators (favorite, to-try, made-before icons)
    - Visibility indicator (private lock, shared users, public globe)
  - Hover effects (subtle scale, shadow)
  - Click navigates to recipe detail page
  - Responsive sizing
- Create `src/components/recipes/recipe-grid.tsx`:
  - Pinterest-style masonry grid layout (CSS columns or grid)
  - Responsive: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop) → 4 columns (wide)
  - Empty state ("No recipes found" with CTA)
  - Loading state (skeleton cards)
  - Infinite scroll or "Load More" pagination

### Task 5.5 — Create Recipe Detail Page

- Create `src/app/(main)/recipes/[id]/page.tsx`:
  - Full recipe display with all information:
    - Hero image (primary image, full width)
    - Title, description, author info
    - Metadata bar: prep time, cook time, total time, servings, difficulty, cuisine
    - Dietary tags as badges
    - Ingredients list (with checkbox toggles for cooking mode)
    - Step-by-step instructions (numbered, with optional durations)
    - Nutrition data (if available — collapsible section)
    - Image gallery (thumbnail strip, click to enlarge)
  - Action buttons:
    - Edit (owner only)
    - Delete (owner only, with confirmation dialog)
    - Duplicate
    - Share (opens share dialog — wired in Phase 8)
    - Tag toggles (Favorite, To Try, Made Before)
    - Save/unsave
    - Print
  - Social section (Ratings, Comments — wired in Phase 8)
  - Related recipes suggestion (same cuisine or tags)

### Task 5.6 — Create Recipe Create, Edit & My Recipes Pages

- Create `src/app/(main)/recipes/new/page.tsx`:
  - Render the RecipeFormWizard in "create" mode
  - On success: redirect to the new recipe detail page with success toast
- Create `src/app/(main)/recipes/[id]/edit/page.tsx`:
  - Load existing recipe data
  - Render the RecipeFormWizard in "edit" mode (pre-populated)
  - On success: redirect to the recipe detail page with success toast
- Create `src/app/(main)/my-recipes/page.tsx`:
  - Recipe grid showing only the authenticated user's recipes
  - Filter tabs: All, Published (public), Shared, Private, Drafts
  - Sort options: Newest, Oldest, Title A-Z, Most Popular
  - "Add New Recipe" CTA button
  - Empty state with onboarding prompt

### Task 5.7 — Create React Query Hooks for Recipes

- Create `src/hooks/use-recipes.ts`:
  - `useRecipes(filters)`: fetch paginated recipe list with filters
  - `useRecipe(id)`: fetch single recipe details
  - `useCreateRecipe()`: mutation to create a recipe (with optimistic updates)
  - `useUpdateRecipe()`: mutation to update a recipe
  - `useDeleteRecipe()`: mutation to delete a recipe (with optimistic removal from list)
  - `useDuplicateRecipe()`: mutation to duplicate a recipe
  - Configure cache invalidation on mutations (invalidate recipe lists)

### Task 5.8 — Write Tests for Recipe CRUD

- Test recipe creation with valid data (all fields)
- Test recipe creation with missing required fields (expect validation errors)
- Test recipe creation with invalid data types
- Test recipe update (partial and full updates)
- Test recipe deletion and cascade behavior
- Test recipe duplication (verify all fields copied, author changed)
- Test recipe list pagination (page, limit, total count)
- Test recipe list filtering (cuisine, difficulty, prepTime, dietary)
- Test recipe list sorting (newest, rating, prepTime)
- Test authorization: non-owner cannot edit/delete
- Test visibility: private recipe not visible to others
- Test guest access: only summary fields returned
- Test Cloudinary upload signature generation
- Test image deletion (database + Cloudinary cleanup)
- Test recipe form validation (Zod schemas)
- Test recipe form wizard navigation (step progression, validation per step)
- Test recipe card rendering with various data states
- Test recipe grid responsive layout
- Test recipe detail page with full and partial data

---

## Phase 6: Status Tagging & Collections

**Goal:** Implement the multi-tag system (Favorite, To Try, Made Before), saved recipes, and the "My Collection" page with filtered tabs.

### Task 6.1 — Tagging & Save API with UI Components

Build all tagging and save API routes, UI components, React Query hooks, and tests as a single vertical slice.

- Create `src/app/api/recipes/[id]/tags/route.ts`:
  - **POST** `/api/recipes/:id/tags`: Add a tag (`{ status: "FAVORITE" | "TO_TRY" | "MADE_BEFORE" }`), require auth, create `UserRecipeTag` record
  - **DELETE** `/api/recipes/:id/tags`: Remove a tag, require auth, delete matching `UserRecipeTag` record
- Create `src/app/api/recipes/[id]/save/route.ts`:
  - **POST** `/api/recipes/:id/save`: Save recipe to collection (require auth, idempotent)
  - **DELETE** `/api/recipes/:id/save`: Unsave recipe
- Create `src/components/recipes/tag-toggles.tsx`:
  - Three toggle buttons: Favorite (heart), To Try (bookmark), Made Before (check)
  - Active (filled icon, color) vs inactive (outline icon) visual states
  - Optimistic UI updates on toggle
  - Works on recipe cards and recipe detail page
  - Show login prompt for unauthenticated guests
- Create `src/components/recipes/save-button.tsx`:
  - Save/Saved toggle with optimistic update and toast notification
- Create `src/hooks/use-tags.ts`:
  - `useToggleTag()`: mutation to add/remove tag (with optimistic update)
  - `useToggleSave()`: mutation to save/unsave (with optimistic update)
- **Tests**: Tag add/remove for each status, multiple tags on same recipe, tag uniqueness constraint, save/unsave operations, save uniqueness, tag toggle component rendering, optimistic update revert on error, unauthenticated user denial

### Task 6.2 — My Collection Page

Build the collection API route, the My Collection page with tabbed filtering, and all associated tests.

- Create `src/app/api/collections/route.ts`:
  - **GET** `/api/collections`: Get user's collection with query params `tab` (all, favorites, to-try, made-before, saved), `page`, `limit`, `sort`
  - Return paginated recipes with tag and save status
- Create `src/app/(main)/my-collection/page.tsx`:
  - Tab navigation: All | Favorites | To Try | Made Before | Saved
  - Recipe grid filtered by selected tab
  - Recipe count per tab in tab labels
  - Sort options within each tab
  - Empty states per tab with relevant CTAs
  - URL-driven tab state (`/my-collection?tab=favorites`)
- Create `useCollection(tab, filters)` hook in `src/hooks/use-tags.ts`
- **Tests**: Collection list with each tab filter, collection pagination, tab switching, empty states, URL-driven state persistence

---

## Phase 7: Search & Discovery

**Goal:** Implement full-text search powered by PostgreSQL tsvector/tsquery, multi-filter search panel, debounced search bar, and URL-driven filter state for shareable search results.

### Task 7.1 — Search API & Utilities

Build the search API route, search utility library, React Query hook, and integration tests.

- Create `src/app/api/search/route.ts`:
  - **GET** `/api/search`: Search with full-text search and filters
  - Query params: `q` (PostgreSQL FTS), `cuisine`, `difficulty`, `maxPrepTime`, `maxCookTime`, `dietary`, `minRating`, `sort` (relevance, newest, rating, prepTime), `page`, `limit`
  - Use `ts_query` and `ts_rank` for relevance scoring
  - Combine full-text search with filter conditions
  - Respect visibility rules (public + own + shared)
- Create `src/lib/search.ts`:
  - `buildSearchQuery(params)`: construct Prisma `where` clause from filter parameters
  - `buildFullTextSearch(query)`: convert user search string to PostgreSQL tsquery (handle AND/OR, stemming)
  - `buildSortOrder(sort, hasQuery)`: determine ORDER BY (relevance rank when searching, else sort param)
  - Handle edge cases: empty query, special characters, very long queries
- Create `useSearch(params)` hook in `src/hooks/use-search.ts` with debounce support
- **Tests**: Full-text search relevance, search ranking, each filter individually, combined filters, pagination, empty results, special characters, visibility enforcement, guest search (public summaries only)

### Task 7.2 — Search UI & Results Page

Build the search bar, filter panel, search results page, and component tests.

- Create `src/components/search/search-bar.tsx`:
  - Input with search icon, clear button, debounced (300ms)
  - Keyboard shortcut (Cmd/Ctrl + K) to focus
  - Loading indicator during search
  - Integrates with header search bar — navigates to `/search?q=...` on submit
- Create `src/components/search/filter-panel.tsx`:
  - Collapsible filter sections: Cuisine (multi-select), Difficulty (radio), Prep Time (slider/presets), Dietary (multi-select from DB), Rating (minimum stars)
  - Apply Filters / Clear All buttons, active filter count badge
  - Mobile: slides in as sheet/drawer
- Create `src/app/(main)/search/page.tsx`:
  - Search bar pre-populated from URL query
  - Filter panel (sidebar desktop, sheet mobile)
  - Results count, sort dropdown, recipe grid, pagination
  - Empty state ("No recipes match your search")
  - URL-driven state for all filters (shareable/bookmarkable)
- Create hooks: `useCuisineOptions()`, `useDietaryTags()` in `src/hooks/use-search.ts`
- **Tests**: Debounce behavior, filter apply/clear, URL state persistence, responsive filter panel

---

## Phase 8: Sharing, Social Features & Guest Access

**Goal:** Implement three-tier visibility, share-by-username, share-by-link, star ratings, comments, community page, and guest summary-only access.

### Task 8.1 — Sharing & Visibility System

Build all sharing API routes, the share dialog component, user search, React Query hooks, and tests.

- Create `src/app/api/recipes/[id]/visibility/route.ts`:
  - **PUT**: Update visibility (PRIVATE/SHARED/PUBLIC), require auth + ownership
- Create `src/app/api/recipes/[id]/shares/route.ts`:
  - **GET**: List shared users (require ownership)
  - **POST**: Share by username (auto-set visibility to SHARED if private), require ownership
  - **DELETE**: Revoke share, require ownership
- Create `src/app/api/users/search/route.ts`:
  - **GET** `/api/users/search?q=...`: Search by username prefix, return limited fields (no email leakage), exclude self, limit to 10
- Create `src/app/api/recipes/[id]/share-link/route.ts`:
  - **POST**: Generate share link (nanoid token, 21+ chars), return full URL
  - **DELETE**: Revoke share link (set `isActive = false`)
- Update `canViewRecipe()` to check: author → PUBLIC → RecipeShare → valid ShareLink token
- Create `src/components/social/share-dialog.tsx`:
  - Tabs: "Share with Users" (username search + autocomplete, shared user list with remove) | "Share Link" (generate, copy, revoke)
  - Visibility selector at top
- Create hooks in `src/hooks/use-sharing.ts`: `useRecipeShares`, `useShareRecipe`, `useRevokeShare`, `useCreateShareLink`, `useRevokeShareLink`, `useSearchUsers`
- **Tests**: Visibility transitions, share creation/revocation, user search (no leakage), share link generation/access/revocation, token security, access control across all visibility+share combinations

### Task 8.2 — Ratings & Comments

Build the rating and comment APIs, UI components, React Query hooks, and tests.

- Create `src/app/api/recipes/[id]/ratings/route.ts`:
  - **GET**: Return average rating, total count, current user's rating
  - **POST**: Create/update rating (upsert, value 1-5), recalculate `avgRating`/`ratingCount`, cannot rate own recipes, require public/shared access
- Create `src/app/api/recipes/[id]/comments/route.ts`:
  - **GET**: Paginated comments, newest first, with author info
  - **POST**: Add comment (1-1000 chars, sanitize XSS), require auth + public/shared access
- Create `src/app/api/comments/[id]/route.ts`:
  - **PUT**: Edit own comment
  - **DELETE**: Delete own comment
- Create `src/components/social/star-rating.tsx`:
  - 5-star interactive widget with hover preview, click to rate, read-only mode, optimistic update
- Create `src/components/social/comment-section.tsx`:
  - Comment form, paginated list, edit/delete for own comments, empty state, character count
- Create hooks in `src/hooks/use-ratings.ts` and `src/hooks/use-comments.ts`
- **Tests**: Rating validation, upsert pattern, cannot-rate-own, avgRating recalc, comment CRUD, ownership checks, XSS sanitization, pagination

### Task 8.3 — Community Page & Guest Access

Build the community pages, guest summary view, "Shared with Me", and tests.

- Create `src/app/(main)/community/page.tsx`:
  - Browse all public recipes with sort (Newest, Top Rated, Most Commented) and filters
- Create `src/app/community/page.tsx` (public, no auth required):
  - Summary-only cards: title, image, prep time, cuisine, rating
  - Click → summary detail with "Log in to view full recipe" CTA
- Handle guest vs authenticated rendering in recipe detail page:
  - Guest: show title, image, metadata, blurred/hidden ingredients/steps/comments with login CTA
  - Accept `?token=` query parameter for share link access
- Create `src/app/(main)/shared-with-me/page.tsx` (or tab in collection):
  - List recipes shared with current user via `RecipeShare`, show who shared and when
- **Tests**: Guest access restrictions (summary-only), community returns public only, shared-with-me correctness, token-based access

### Task 8.4 — Social Integration into Recipe Detail

Wire all social features into the recipe detail page and verify end-to-end.

- Integrate into `src/app/(main)/recipes/[id]/page.tsx`:
  - Star rating widget (with current user's rating)
  - Comment section (form + list)
  - Share button (opens share dialog)
  - Tag toggles (Favorite, To Try, Made Before) from Phase 6
  - Save/unsave button from Phase 6
- Verify complete social experience end-to-end: view recipe → rate → comment → share → tag
- Ensure proper conditional rendering based on auth state and recipe ownership
- **Tests**: End-to-end integration of all social features on recipe detail, conditional rendering for owner vs viewer vs guest

---

## Phase 9: AI Features

**Goal:** Integrate OpenAI GPT-4o-mini and DALL-E 3 via Vercel AI SDK for recipe generation, ingredient substitution, nutritional estimates, and AI image generation.

### Task 9.1 — AI Infrastructure & Recipe Generator

Set up AI infrastructure (client, rate limiter, error handling) and build the recipe generator feature.

- Create `src/lib/openai.ts`: OpenAI client with API key, model constants (GPT-4o-mini, DALL-E 3)
- Create `src/lib/rate-limit.ts`:
  - In-memory sliding window rate limiter (Map-based, per user ID)
  - Configurable limits: recipe generation (20/hr), substitution (50/hr), DALL-E (10/hr), nutrition (30/hr)
  - Return remaining requests and reset time in headers
  - 429 status with helpful message on exceeded
- Create `src/lib/ai-utils.ts`:
  - `withAIRetry(fn)`: silent retry-once pattern
  - `formatAIError(action)`: user-friendly error messages, never expose OpenAI internals
- Create `src/app/api/ai/generate/route.ts`:
  - **POST**: Generate recipe from ingredients/preferences using Vercel AI SDK `streamText()`
  - Body: `{ ingredients: string[], cuisine?, dietary?, difficulty?, servings? }`
  - Structured JSON recipe output: title, description, ingredients, steps, times, servings, difficulty, cuisine, tags
- Create `src/components/ai/recipe-generator.tsx`:
  - Ingredient chip input, preference selectors, "Generate Recipe" button
  - Streaming display, "Save as New Recipe" button, error handling with retry
- Create React Query / AI SDK hooks
- **Tests** (mock OpenAI): Rate limiter enforcement (limits, 429, headers), retry-once pattern, error formatting, generator response parsing, streaming behavior, auth requirement

### Task 9.2 — Ingredient Substitution & Nutritional Estimates

Build substitution and nutrition AI features with UI components and tests.

- Create `src/app/api/ai/substitute/route.ts`:
  - **POST**: Suggest 2-3 substitutions with name, quantity ratio, flavor/texture notes, dietary compatibility
  - Body: `{ ingredient, recipeContext?, dietaryRestrictions? }`, require auth + rate limit
- Create `src/components/ai/substitution-dialog.tsx`:
  - Trigger button on each ingredient in recipe detail
  - Dialog showing suggestions with "Apply Substitution" option
- Create `src/app/api/ai/nutrition/route.ts`:
  - **POST**: Estimate per-serving nutrition (calories, protein, carbs, fat, fiber, sugar, sodium)
  - Cache results in `Recipe.nutritionData` JSON field
- Create `src/components/ai/nutrition-display.tsx`:
  - Nutrition facts card, "Estimate Nutrition" / "Refresh" buttons
  - Disclaimer: "AI-generated estimates"
- Create hooks for substitution and nutrition
- **Tests** (mock OpenAI): Substitution structure, nutrition field completeness, nutrition caching, cache invalidation, auth + rate limiting

### Task 9.3 — AI Image Generation & Entry Points

Build DALL-E image generation, integrate AI entry points across the app, and implement nice-to-have features.

- Create `src/app/api/ai/generate-image/route.ts`:
  - **POST**: Generate food photography image with DALL-E 3, upload to Cloudinary, return URL
  - Body: `{ recipeTitle, description }`, require auth + rate limit
- Integrate "Generate with AI" into recipe form image step (preview, regenerate, save)
- Add AI access points throughout app:
  - "Generate Recipe" in header/dashboard
  - "Substitute" buttons next to ingredients on recipe detail
  - "Estimate Nutrition" button on recipe detail
  - "Generate Image" in recipe form
- **Nice-to-Have** (if time permits):
  - `src/app/api/ai/suggest-tags/route.ts`: Auto-suggest cuisine, dietary tags, difficulty
  - `src/app/api/ai/meal-plan/route.ts` + `src/components/ai/meal-planner.tsx`: Weekly meal plan generator
- **Tests** (mock OpenAI/DALL-E): Image generation flow, Cloudinary upload, rate limiting, entry point rendering

---

## Phase 10: Extra Features & Polish

**Goal:** Implement recipe scaling, shopping lists, cooking mode/timer, print view, and polish the overall UX for responsive design, error handling, and accessibility.

### Task 10.1 — Recipe Scaling & Cooking Mode

Build recipe scaling, the cooking timer, and step-by-step cooking mode. All client-side, no API routes.

- Create `src/lib/scaling.ts`:
  - `scaleQuantity(quantity, factor)`: parse fractions ("2 1/2 cups"), decimals, ranges ("2-3 cloves"), unit-less ("3 eggs") → scale → format
  - Round to sensible precision
- Create `src/components/recipes/serving-adjuster.tsx`:
  - +/- buttons, current vs original servings display, real-time ingredient updates, reset button
- Create `src/components/recipes/cooking-timer.tsx`:
  - Per-step timer from `RecipeStep.duration`, start/pause/reset, countdown (MM:SS)
  - Audio alert on completion, multiple concurrent timers, visual indicator on timed step
- Create `src/components/recipes/cooking-mode.tsx`:
  - Full-screen overlay: large text, one step at a time, swipe/arrow navigation
  - Step progress (Step 3 of 8), step timer, ingredient slide-up panel, exit button
  - Mobile: Wake Lock API, large tap targets, high contrast
- Integrate into recipe detail page
- **Tests**: Scaling calculations (fractions, decimals, ranges, edge cases), timer countdown, pause/resume, cooking mode navigation

### Task 10.2 — Shopping List Feature

Build the complete shopping list as a vertical slice: API routes, pages, components, hooks, and tests.

- Create `src/app/api/shopping-lists/route.ts`:
  - **GET**: List user's shopping lists
  - **POST**: Create list, optionally auto-populate from recipe IDs with aggregated ingredients
- Create `src/app/api/shopping-lists/[id]/route.ts`: GET, PUT (name), DELETE
- Create `src/app/api/shopping-lists/[id]/items/route.ts`: POST (add), PUT (check/uncheck, edit), DELETE (remove)
- Create `src/components/shopping/shopping-list.tsx`:
  - Checklist with checkboxes, grouped by category, strikethrough on checked
  - Add item, remove checked, clear all, editable quantities
- Create `src/components/shopping/add-to-list-button.tsx`:
  - Button on recipe detail: select existing list or create new, auto-aggregate duplicate ingredients
- Create `src/app/(main)/shopping-lists/page.tsx` and `src/app/(main)/shopping-lists/[id]/page.tsx`
- Create React Query hooks
- **Tests**: Shopping list CRUD, ingredient aggregation, item check/uncheck, page rendering

### Task 10.3 — Print View & UX Polish

Build print-friendly view and perform comprehensive UX polish pass.

- Create `src/components/recipes/print-view.tsx`:
  - CSS `@media print`: hide nav/header/footer/interactive elements, clean single-column layout
  - Recipe title, image, metadata, ingredients, instructions, nutrition
  - "Print Recipe" button using `window.print()`
- **Responsive audit** across all pages:
  - Mobile (< 640px): single column, stacked, hamburger menu
  - Tablet (640-1024px): two column, compact nav
  - Desktop (> 1024px): full layout
  - Minimum 44px tap targets, fix overflow/truncation/alignment
- **Error handling consistency**: All API routes return proper status codes (400/401/403/404/429/500), toast notifications for all user actions, graceful network error handling, consistent skeleton loading states
- **Accessibility review**: ARIA labels, keyboard navigation, focus management, color contrast (WCAG AA), screen reader compatibility, form error announcements, alt text, skip navigation link
- **Nice-to-Have**: URL recipe import (`/api/recipes/import` + import dialog)
- **Tests**: Print view content, responsive breakpoint rendering

---

## Phase 11: Testing Infrastructure & E2E

**Goal:** Set up test tooling and write cross-cutting E2E/edge-case tests not covered by per-feature tests in Phases 6-10.

### Task 11.1 — Testing Infrastructure & Mock Setup

Set up testing infrastructure, consolidate mock handlers, configure coverage, and backfill any test gaps.

- Install/configure Vitest (config, path aliases, setup files, coverage)
- Install/configure MSW: `src/mocks/handlers.ts` (all endpoints), `src/mocks/server.ts`
- Install/configure Playwright (optional)
- Add test scripts: `test`, `test:run`, `test:coverage`, `test:ui`, `test:e2e`
- Configure coverage thresholds: statements 80%+, branches 75%+, functions 80%+, lines 80%+
- Audit test coverage gaps from Phases 6-10 and backfill missing tests
- Consolidate mock data factories for all models

### Task 11.2 — E2E Tests & Edge Cases

Write Playwright E2E tests for critical journeys and edge-case tests.

- **E2E journeys**: Recipe creation happy path, search flow, social flow (rate + comment), sharing flow, collection flow, AI generation flow, guest access flow
- **Edge cases**: Concurrent tag/save operations, maximum data (long titles, many ingredients/steps), SQL injection attempts in search, rate limiter under concurrency, malformed request bodies, expired tokens, deleted-resource handling, database constraint violations

---

## Phase 12: Performance & Security

**Goal:** Optimize performance and harden security across the entire application.

### Task 12.1 — Database & API Optimization

Audit and optimize all database queries and API-level caching.

- Review Prisma queries for N+1 problems, add strategic `select`/`include`
- Verify all filtered queries use indexed columns
- Optimize full-text search query performance
- Configure React Query `staleTime` per query type (recipe list 30s, detail 1min, dietary tags 5min)
- Implement proper cache headers on API routes
- Implement rate limiting on all API routes (not just AI)
- Add request size limits

### Task 12.2 — Frontend Performance

Optimize client-side rendering, loading, and bundle size.

- Verify `next/image` for all recipe images with proper size/quality
- Dynamic imports for heavy components (recipe form wizard, AI features, cooking mode)
- React Server Components where beneficial
- Prefetching on recipe card hover
- Skeleton loading audit, progressive image loading
- Bundle size optimization (`next build` output), defer non-critical JS
- Font loading optimization, Lighthouse audit

### Task 12.3 — Security Hardening

Comprehensive security review and testing.

- Verify all API routes validate input with Zod
- Sanitize user content (XSS prevention in titles/descriptions/comments)
- Validate image URLs
- Verify every protected route uses `requireAuth()` + ownership checks
- Verify `canViewRecipe()` on all recipe reads
- Verify no route leaks private recipe data
- JWT expiry, CORS headers, content-type validation
- Verify no secrets in repo, production error responses don't leak stack traces
- Verify Cloudinary signed uploads
- **Security tests**: XSS, injection, authorization bypass, share link token guessing, error response content

---

## Phase 13: Pre-Deployment & Launch

**Goal:** Prepare for production, deploy, perform final QA, and finalize submission.

### Task 13.1 — Production Build & Environment Setup

Build verification and production environment configuration.

- Run `npm run build`, resolve errors/warnings, check bundle sizes
- Verify pages render in production mode (`npm run start`)
- Set up Neon production database, run migrations (`prisma migrate deploy`) and seed
- Configure all Vercel environment variables
- Update OAuth redirect URIs (Google + GitHub) for production
- Verify Cloudinary and OpenAI production configuration
- Set up OpenAI billing alerts

### Task 13.2 — Deploy to Vercel

Deploy and verify the production environment.

- Connect GitHub repo to Vercel, configure build settings (`prisma generate && next build`)
- Trigger first deployment, monitor build logs
- Verify production URL, run OAuth flows, test Cloudinary uploads, test AI features
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS Safari, Android Chrome)

### Task 13.3 — Final QA & Codebase Cleanup

Complete QA checklist and codebase polish.

- Test every user flow on production: sign in (Google/GitHub), onboarding, recipe CRUD, search, filters, tags, saves, collection tabs, visibility, sharing (username + link), ratings, comments, community, guest access, AI features (generate, substitute, nutrition, image), scaling, shopping lists, cooking mode, timer, print, dark mode, mobile responsiveness, keyboard navigation
- Remove TODOs, unused imports, console.logs, test/debug code
- Run linter and formatter, verify consistent formatting

### Task 13.4 — README, Monitoring & Submission

Finalize documentation and prepare for submission.

- Update README: feature list, screenshots, live demo URL, setup instructions, architecture overview, API summary, tech stack versions, known limitations, credits, license
- Optional: Vercel Analytics, error tracking, custom domain configuration
- Final walkthrough of entire application
- Verify GitHub repo + live URL are accessible and ready

---

## Appendix A: Technology Versions Reference

| Technology      | Minimum Version | Purpose                 |
| --------------- | --------------- | ----------------------- |
| Node.js         | 18.17+          | Runtime                 |
| Next.js         | 14.0+           | App Router framework    |
| React           | 18.2+           | UI library              |
| TypeScript      | 5.0+            | Type safety             |
| Prisma          | 5.0+            | Database ORM            |
| NextAuth.js     | 5.0 (beta)      | Authentication          |
| TanStack Query  | 5.0+            | Server state management |
| React Hook Form | 7.0+            | Form management         |
| Zod             | 3.0+            | Schema validation       |
| Tailwind CSS    | 3.3+            | Utility CSS             |
| shadcn/ui       | latest          | UI component library    |
| Vercel AI SDK   | 3.0+            | AI streaming            |

## Appendix B: Environment Variable Reference

| Variable                            | Required | Description                              |
| ----------------------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`                      | Yes      | Neon PostgreSQL connection string        |
| `NEXTAUTH_SECRET`                   | Yes      | Random secret for JWT signing            |
| `NEXTAUTH_URL`                      | Yes      | Base URL (http://localhost:3000 for dev) |
| `GOOGLE_CLIENT_ID`                  | Yes      | Google OAuth client ID                   |
| `GOOGLE_CLIENT_SECRET`              | Yes      | Google OAuth client secret               |
| `GITHUB_CLIENT_ID`                  | Yes      | GitHub OAuth client ID                   |
| `GITHUB_CLIENT_SECRET`              | Yes      | GitHub OAuth client secret               |
| `OPENAI_API_KEY`                    | Yes      | OpenAI API key for GPT-4o-mini + DALL-E  |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes      | Cloudinary cloud name (public)           |
| `CLOUDINARY_API_KEY`                | Yes      | Cloudinary API key (server-side)         |
| `CLOUDINARY_API_SECRET`             | Yes      | Cloudinary API secret (server-side)      |

## Appendix C: Key Architectural Decisions

| Decision         | Choice             | Rationale                                                               |
| ---------------- | ------------------ | ----------------------------------------------------------------------- |
| Monorepo         | Yes                | Single Next.js app for frontend + backend, simpler deployment           |
| Session Strategy | JWT                | Stateless, no session table needed, works with Vercel serverless        |
| Search           | PostgreSQL FTS     | No external service, built into the database, sufficient for this scale |
| AI Streaming     | Vercel AI SDK      | Seamless integration with Next.js, built-in streaming utilities         |
| File Storage     | Cloudinary         | CDN delivery, image transformations, generous free tier                 |
| Shopping Lists   | Database-persisted | Survives across devices/sessions, not dependent on localStorage         |
| Rate Limiting    | In-memory          | Sufficient for single-instance Vercel deployment, simple to implement   |
| State Management | React Query only   | No Redux/Zustand needed, React Query handles all server state           |
