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

### Task 6.1 — Create Tagging & Save API Routes

- Create `src/app/api/recipes/[id]/tags/route.ts`:
  - **POST** `/api/recipes/:id/tags`: Add a tag to a recipe
    - Body: `{ status: "FAVORITE" | "TO_TRY" | "MADE_BEFORE" }`
    - Require authentication
    - Create `UserRecipeTag` record
    - Return the created tag
  - **DELETE** `/api/recipes/:id/tags`: Remove a tag from a recipe
    - Body: `{ status: "FAVORITE" | "TO_TRY" | "MADE_BEFORE" }`
    - Require authentication
    - Delete the matching `UserRecipeTag` record
- Create `src/app/api/recipes/[id]/save/route.ts`:
  - **POST** `/api/recipes/:id/save`: Save a recipe to collection
    - Require authentication
    - Create `SavedRecipe` record (ignore if already saved)
  - **DELETE** `/api/recipes/:id/save`: Unsave a recipe
    - Require authentication
    - Delete the `SavedRecipe` record
- Create `src/app/api/collections/route.ts`:
  - **GET** `/api/collections`: Get the user's collection
    - Query params: `tab` (all, favorites, to-try, made-before, saved), `page`, `limit`, `sort`
    - Return paginated recipes matching the tab filter
    - Include tag and save status for each recipe

### Task 6.2 — Create Tag & Save UI Components

- Create `src/components/recipes/tag-toggles.tsx`:
  - Three toggle buttons: Favorite (heart), To Try (bookmark), Made Before (check)
  - Visual states: active (filled icon, color) vs inactive (outline icon)
  - Optimistic UI updates on toggle
  - Works on recipe cards and recipe detail page
  - Requires authentication (show login prompt for guests)
- Create `src/components/recipes/save-button.tsx`:
  - Toggle button: Save (bookmark+) / Saved (bookmark-filled)
  - Optimistic UI update
  - Toast notification on save/unsave

### Task 6.3 — Create My Collection Page & React Query Hooks

- Create `src/app/(main)/my-collection/page.tsx`:
  - Tab navigation: All | Favorites | To Try | Made Before | Saved
  - Recipe grid filtered by selected tab
  - Recipe count per tab (shown in tab label)
  - Sort options within each tab
  - Empty states per tab with relevant CTAs
  - URL-driven tab state (e.g., `/my-collection?tab=favorites`)
- Create `src/hooks/use-tags.ts`:
  - `useToggleTag()`: mutation to add/remove a tag (with optimistic update)
  - `useToggleSave()`: mutation to save/unsave (with optimistic update)
  - `useCollection(tab, filters)`: fetch the user's collection with filters

### Task 6.4 — Write Tests for Tagging & Collections

- Test adding each tag status (FAVORITE, TO_TRY, MADE_BEFORE)
- Test removing each tag status
- Test multiple tags on the same recipe (e.g., FAVORITE + MADE_BEFORE simultaneously)
- Test tag uniqueness constraint (same user+recipe+status)
- Test save and unsave operations
- Test save uniqueness constraint (one save per user+recipe)
- Test collection list with each tab filter
- Test collection pagination
- Test tag toggle component renders correct states
- Test optimistic updates revert on API error
- Test unauthenticated user cannot tag or save

---

## Phase 7: Search & Discovery

**Goal:** Implement full-text search powered by PostgreSQL tsvector/tsquery, multi-filter search panel, debounced search bar, and URL-driven filter state for shareable search results.

### Task 7.1 — Create Search API Route & Utilities

- Create `src/app/api/search/route.ts`:
  - **GET** `/api/search`: Search recipes with full-text search and filters
    - Query params:
      - `q` (search query — uses PostgreSQL full-text search)
      - `cuisine` (filter by cuisine type, comma-separated for multiple)
      - `difficulty` (EASY, MEDIUM, HARD)
      - `maxPrepTime` (max prep time in minutes)
      - `maxCookTime` (max cook time in minutes)
      - `dietary` (dietary tag IDs, comma-separated)
      - `minRating` (minimum average rating)
      - `sort` (relevance, newest, rating, prepTime)
      - `page`, `limit`
    - Use PostgreSQL `ts_query` and `ts_rank` for relevance scoring when `q` is provided
    - Combine full-text search with filter conditions
    - Return paginated results with highlight snippets (optional)
    - Respect visibility rules (public + own + shared)
- Create `src/lib/search.ts`:
  - `buildSearchQuery(params)`: construct Prisma `where` clause from filter parameters
  - `buildFullTextSearch(query)`: convert user search string to PostgreSQL tsquery format (handle AND/OR, stemming)
  - `buildSortOrder(sort, hasQuery)`: determine ORDER BY clause (relevance rank when searching, else by sort param)
  - Handle edge cases: empty query, special characters, very long queries

### Task 7.2 — Create Search Bar & Filter Panel Components

- Create `src/components/search/search-bar.tsx`:
  - Input with search icon and clear button
  - Debounced input (300ms delay before triggering search)
  - Search suggestions dropdown (recent searches, popular searches — stretch)
  - Loading indicator during search
  - Keyboard shortcut (Cmd/Ctrl + K) to focus search
  - Integrates with the header search bar
- Wire the header search bar to navigate to `/search?q=...` on submit
- Ensure search works from any page in the app
- Create `src/components/search/filter-panel.tsx`:
  - Collapsible filter sections:
    - **Cuisine**: multi-select checkboxes (populated from existing recipes)
    - **Difficulty**: radio group (Easy, Medium, Hard, Any)
    - **Prep Time**: slider or preset ranges (Under 15min, Under 30min, Under 1hr, Any)
    - **Dietary**: multi-select checkboxes (from DietaryTag table)
    - **Rating**: minimum star rating selector
  - "Apply Filters" button
  - "Clear All Filters" button
  - Active filter count badge
  - Mobile: filter panel slides in as a sheet/drawer

### Task 7.3 — Create Search Results Page & React Query Hooks

- Create `src/app/(main)/search/page.tsx`:
  - Search bar (pre-populated from URL query)
  - Filter panel (sidebar on desktop, sheet on mobile)
  - Results count ("Found 42 recipes for 'pasta'")
  - Sort dropdown
  - Recipe grid with search results
  - Pagination or infinite scroll
  - Empty state ("No recipes match your search")
  - URL-driven state: all filters reflected in URL params for shareable/bookmarkable search URLs
- Create `src/hooks/use-search.ts`:
  - `useSearch(params)`: fetch search results with debounced query and filters
  - `useCuisineOptions()`: fetch distinct cuisine types for filter autocomplete
  - `useDietaryTags()`: fetch all dietary tags for filter panel

### Task 7.4 — Write Tests for Search & Discovery

- Test full-text search returns relevant results for various queries
- Test search ranking (more relevant results appear first)
- Test each filter individually (cuisine, difficulty, prepTime, dietary, rating)
- Test combined filters (multiple filters applied simultaneously)
- Test pagination with search results
- Test empty search results
- Test search with special characters (doesn't break)
- Test URL-driven filter state (filters persist in URL)
- Test debounced search bar (doesn't fire on every keystroke)
- Test filter panel apply and clear functionality
- Test visibility rules in search (private recipes don't appear for other users)
- Test guest search (only public recipe summaries)

---

## Phase 8: Sharing, Social Features & Guest Access

**Goal:** Implement three-tier visibility, share-by-username, share-by-link, star ratings, comments, and guest summary-only access.

### Task 8.1 — Create Sharing & Visibility API Routes

- Create `src/app/api/recipes/[id]/visibility/route.ts`:
  - **PUT** `/api/recipes/:id/visibility`: Update recipe visibility
    - Body: `{ visibility: "PRIVATE" | "SHARED" | "PUBLIC" }`
    - Require authentication + ownership
    - When changing from SHARED to PRIVATE: optionally remove existing shares
    - Return updated recipe
- Create `src/app/api/recipes/[id]/shares/route.ts`:
  - **GET** `/api/recipes/:id/shares`: List users the recipe is shared with
    - Require ownership
    - Return list of shared users (username, name, avatar, sharedAt)
  - **POST** `/api/recipes/:id/shares`: Share recipe with a user
    - Body: `{ username: string }`
    - Require ownership
    - Auto-set visibility to SHARED (if currently PRIVATE)
    - Create `RecipeShare` record
    - Return the share record
  - **DELETE** `/api/recipes/:id/shares`: Revoke share from a user
    - Body: `{ userId: string }`
    - Require ownership
    - Delete `RecipeShare` record
- Create `src/app/api/users/search/route.ts`:
  - **GET** `/api/users/search?q=...`: Search users by username
    - Require authentication
    - Search by username prefix (autocomplete)
    - Return limited fields: `id`, `username`, `name`, `image` (no email leakage)
    - Exclude the requesting user from results
    - Limit results (e.g., top 10 matches)
- Create `src/app/api/recipes/[id]/share-link/route.ts`:
  - **POST** `/api/recipes/:id/share-link`: Generate a share link
    - Require ownership
    - Generate cryptographically random token (nanoid, 21+ chars)
    - Create `ShareLink` record
    - Return the full shareable URL (`/recipes/:id?token=...`)
  - **DELETE** `/api/recipes/:id/share-link`: Revoke a share link
    - Require ownership
    - Set `isActive = false` on the ShareLink record
- Update `canViewRecipe()` in auth utils to check:
  1. User is the recipe author → allow
  2. Recipe visibility is PUBLIC → allow
  3. User has a `RecipeShare` record → allow
  4. Request includes a valid, active `ShareLink` token → allow
  5. Otherwise → deny
- Update the recipe detail page to accept `?token=` query parameter
- Pass the token through the access check

### Task 8.2 — Create Share Dialog Component

- Create `src/components/social/share-dialog.tsx`:
  - Dialog with tabs: "Share with Users" | "Share Link"
  - **Share with Users tab**:
    - Username search input with autocomplete dropdown
    - List of currently shared users with remove buttons
    - "Share" button to add selected user
  - **Share Link tab**:
    - Generated link display with copy button
    - "Generate Link" button (if no active link)
    - "Revoke Link" button (if active link exists)
    - Visual confirmation on copy
  - Visibility selector at the top
  - Show current visibility status

### Task 8.3 — Create Rating Feature (API & Component)

- Create `src/app/api/recipes/[id]/ratings/route.ts`:
  - **GET** `/api/recipes/:id/ratings`: Get ratings for a recipe
    - Return average rating, total count, and current user's rating (if authenticated)
  - **POST** `/api/recipes/:id/ratings`: Create or update a rating
    - Body: `{ value: 1-5 }`
    - Require authentication
    - Upsert pattern (create if new, update if exists)
    - Recalculate `avgRating` and `ratingCount` on the Recipe record
    - Cannot rate own recipes
    - Recipe must be public or shared with the user
- Create `src/components/social/star-rating.tsx`:
  - 5-star interactive rating widget
  - Hover preview (highlight stars up to hovered position)
  - Click to set rating
  - Display current user's rating (filled stars)
  - Show average rating and count
  - Read-only mode for recipe cards
  - Optimistic update on rating change

### Task 8.4 — Create Comment Feature (API & Components)

- Create `src/app/api/recipes/[id]/comments/route.ts`:
  - **GET** `/api/recipes/:id/comments`: List comments for a recipe
    - Paginated, sorted by newest first
    - Include author info (username, name, avatar)
  - **POST** `/api/recipes/:id/comments`: Add a comment
    - Body: `{ content: string }` (1-1000 chars)
    - Require authentication
    - Sanitize input (XSS prevention)
    - Recipe must be public or shared with the user
- Create `src/app/api/comments/[id]/route.ts`:
  - **PUT** `/api/comments/:id`: Edit own comment
    - Require authentication + comment ownership
  - **DELETE** `/api/comments/:id`: Delete own comment
    - Require authentication + comment ownership
- Create `src/components/social/comment-section.tsx`:
  - Comment input form (textarea + submit button)
  - Comment list with pagination ("Load More" button)
  - Each comment: author avatar, username, content, timestamp, edit/delete buttons (if owner)
  - Edit mode: inline textarea replacement
  - Delete confirmation dialog
  - Empty state ("Be the first to comment!")
  - Character count indicator on input

### Task 8.5 — Create Community Page, Guest Access & "Shared with Me"

- Create `src/app/(main)/community/page.tsx`:
  - Browse all public recipes
  - Sort: Newest, Top Rated, Most Commented
  - Filter by cuisine, difficulty, dietary tags
  - Recipe grid with public recipes
  - Featured/trending section (top rated this week — stretch)
- Create `src/app/community/page.tsx` (public, no auth required):
  - Similar to authenticated community page but with limited data
  - Recipe cards show summary only: title, image, prep time, cuisine, rating
  - Click on a recipe → show summary detail page with "Log in to view full recipe" CTA
- Create `src/app/recipes/[id]/summary/page.tsx` (or handle in the detail page):
  - Guest-accessible summary view of a public recipe
  - Shows: title, primary image, prep time, cook time, cuisine type, difficulty, average rating
  - Blurred/hidden sections for full ingredients, steps, comments
  - Prominent "Sign in to view the full recipe" CTA
- Update recipe detail page to handle guest vs authenticated rendering
- Create `src/app/(main)/shared-with-me/page.tsx` (or tab in collection):
  - List all recipes shared with the current user via `RecipeShare`
  - Show who shared each recipe and when
  - Recipe grid display

### Task 8.6 — Create React Query Hooks for Social Features

- Create `src/hooks/use-sharing.ts`:
  - `useRecipeShares(recipeId)`: list shares for a recipe
  - `useShareRecipe()`: mutation to share with a user
  - `useRevokeShare()`: mutation to revoke a share
  - `useCreateShareLink()`: mutation to create share link
  - `useRevokeShareLink()`: mutation to revoke share link
  - `useSearchUsers(query)`: debounced user search
- Create `src/hooks/use-ratings.ts`:
  - `useRecipeRating(recipeId)`: fetch rating info
  - `useRateRecipe()`: mutation to rate (with optimistic update)
- Create `src/hooks/use-comments.ts`:
  - `useComments(recipeId)`: fetch paginated comments
  - `useAddComment()`: mutation to add comment
  - `useEditComment()`: mutation to edit comment
  - `useDeleteComment()`: mutation to delete comment

### Task 8.7 — Write Tests for Sharing & Social Features

- Test visibility update (PRIVATE → SHARED → PUBLIC and back)
- Test share-by-username creates RecipeShare record
- Test share revocation removes access
- Test user search returns correct results (no email leakage)
- Test share link generation (valid token format)
- Test share link access (valid token grants access)
- Test share link revocation (revoked token denied)
- Test recipe access with various visibility + share combinations
- Test rating creation (value 1-5)
- Test rating update (upsert pattern)
- Test rating value validation (reject 0, 6, negative, non-integer)
- Test cannot rate own recipe
- Test average rating recalculation after new rating
- Test comment creation with valid content
- Test comment content sanitization (XSS prevention)
- Test comment edit (only by author)
- Test comment delete (only by author)
- Test comment pagination
- Test guest access (summary-only for public recipes)
- Test guest cannot access private/shared recipes
- Test community page returns only public recipes
- Test "Shared with me" returns correctly shared recipes

---

## Phase 9: AI Features

**Goal:** Integrate OpenAI GPT-4o-mini and DALL-E 3 via Vercel AI SDK for recipe generation, ingredient substitution, nutritional estimates, AI image generation, and nice-to-have features (smart tagging, meal planning).

### Task 9.1 — Set Up AI Infrastructure (OpenAI, Rate Limiting, Error Handling)

- Create `src/lib/openai.ts`:
  - Initialize OpenAI client with API key from env
  - Export configured client for use across AI routes
  - Define model constants (GPT-4o-mini for text, DALL-E 3 for images)
- Create `src/lib/rate-limit.ts`:
  - In-memory rate limiter (Map-based, per user ID)
  - Configurable limits per endpoint:
    - Recipe generation: 20 requests/hour
    - Ingredient substitution: 50 requests/hour
    - DALL-E image generation: 10 requests/hour
    - Nutritional estimates: 30 requests/hour
  - Sliding window algorithm
  - Return remaining requests and reset time in response headers
  - Handle rate limit exceeded with 429 status and helpful message
- Create `src/lib/ai-utils.ts`:
  - `withAIRetry(fn)`: wrapper that implements the retry-once pattern
  - `formatAIError(action)`: generate user-friendly error messages
  - On API failure: silent retry once
  - On second failure: return a generic user-friendly message ("Could not generate recipe. Please try again.")
  - Never expose internal OpenAI errors to the user
  - Log errors server-side for debugging

### Task 9.2 — Create AI Recipe Generator

- Create `src/app/api/ai/generate/route.ts`:
  - **POST** `/api/ai/generate`: Generate a recipe from ingredients/preferences
    - Body: `{ ingredients: string[], cuisine?: string, dietary?: string[], difficulty?: string, servings?: number }`
    - Require authentication + rate limit check
    - System prompt: instruct GPT-4o-mini to generate a structured recipe (JSON format) with title, description, ingredients with quantities, steps, prep/cook time, servings, difficulty, cuisine, dietary tags
    - Use Vercel AI SDK `streamText()` for streaming response
    - Parse and validate the generated recipe structure
    - Return the recipe data (user can then save it as a new recipe)
- Create `src/components/ai/recipe-generator.tsx`:
  - Ingredient input (tag-style, add multiple ingredients)
  - Optional preference selectors (cuisine, dietary, difficulty)
  - "Generate Recipe" button
  - Streaming display of generated recipe
  - "Save as New Recipe" button (pre-fills the recipe form)
  - Loading/streaming animation
  - Error handling with retry option

### Task 9.3 — Create Ingredient Substitution & Nutritional Estimate Features

- Create `src/app/api/ai/substitute/route.ts`:
  - **POST** `/api/ai/substitute`: Get ingredient substitutions
    - Body: `{ ingredient: string, recipeContext?: string, dietaryRestrictions?: string[] }`
    - Require authentication + rate limit check
    - System prompt: instruct GPT-4o-mini to suggest 2-3 substitution alternatives with:
      - Substitute name
      - Quantity ratio (e.g., "use 1.5x the amount")
      - Flavor/texture impact notes
      - Dietary compatibility
    - Return structured substitution data
- Create `src/components/ai/substitution-dialog.tsx`:
  - Trigger button on each ingredient in the recipe detail view
  - Dialog showing substitution suggestions
  - Each suggestion: substitute name, ratio, notes
  - "Apply Substitution" button (updates the ingredient in the form)
- Create `src/app/api/ai/nutrition/route.ts`:
  - **POST** `/api/ai/nutrition`: Estimate nutritional information
    - Body: `{ recipeId: string }` or `{ ingredients: RecipeIngredient[], servings: number }`
    - Require authentication + rate limit check
    - System prompt: instruct GPT-4o-mini to estimate per-serving nutrition:
      - Calories, protein, carbs, fat, fiber, sugar, sodium
    - Cache results in `Recipe.nutritionData` JSON field
    - Return the nutrition data
- Create `src/components/ai/nutrition-display.tsx`:
  - Nutrition facts card (styled like a food label)
  - Per-serving values
  - "Estimate Nutrition" button (if no cached data)
  - "Refresh" button (to re-estimate)
  - Disclaimer: "AI-generated estimates. For accurate values, consult a nutritionist."
  - Loading skeleton while estimating

### Task 9.4 — Create AI Image Generation

- Create `src/app/api/ai/generate-image/route.ts`:
  - **POST** `/api/ai/generate-image`: Generate a recipe image with DALL-E 3
    - Body: `{ recipeTitle: string, description: string }`
    - Require authentication + rate limit check
    - Generate a food photography style prompt from the recipe details
    - Call DALL-E 3 API with appropriate size (1024x1024)
    - Upload the generated image to Cloudinary (for persistence)
    - Return the Cloudinary URL
- Integrate into the recipe form's image step:
  - "Generate with AI" option
  - Preview of generated image
  - Option to regenerate
  - Save to recipe images

### Task 9.5 — Create AI Entry Points & Nice-to-Have Features

- Add AI feature access points throughout the app:
  - "Generate Recipe" in the header/navigation or dashboard
  - "Substitute" buttons next to ingredients on recipe detail
  - "Estimate Nutrition" button on recipe detail page
  - "Generate Image" option in recipe form image step
  - AI features page/hub (`/ai`) linking to all AI tools
- Create `src/app/api/ai/suggest-tags/route.ts` (Nice-to-Have):
  - **POST** `/api/ai/suggest-tags`: Suggest tags for a recipe
    - Body: `{ title: string, ingredients: string[], description: string }`
    - AI suggests: cuisine type, dietary tags, difficulty level
    - Return structured tag suggestions
  - Integrate into recipe form as auto-suggest chips
- Create `src/app/api/ai/meal-plan/route.ts` (Nice-to-Have):
  - **POST** `/api/ai/meal-plan`: Generate a weekly meal plan
    - Body: `{ preferences: { dietary?: string[], cuisines?: string[], servings: number, mealsPerDay: number } }`
    - AI generates a 7-day meal plan using existing recipes + new suggestions
    - Return structured plan (day → meals)
- Create `src/components/ai/meal-planner.tsx` (Nice-to-Have):
  - Preference input form
  - Weekly calendar grid display
  - Recipe links for existing recipes
  - "Generate Recipe" links for AI suggestions

### Task 9.6 — Write Tests for AI Features

- Test recipe generator with valid ingredient inputs
- Test recipe generator response parsing (valid JSON structure)
- Test recipe generator streaming behavior
- Test ingredient substitution returns structured suggestions
- Test nutritional estimate returns all required fields
- Test nutrition caching (second request uses cached data)
- Test DALL-E image generation returns valid URL
- Test generated image is uploaded to Cloudinary
- Test rate limiter enforces per-user limits
- Test rate limiter returns 429 with helpful message when exceeded
- Test rate limit headers (remaining, reset time)
- Test AI error handling: retry-once pattern
- Test AI error handling: user-friendly error messages on failure
- Test AI endpoints require authentication
- Test smart tagging suggestions (if implemented)
- Test meal plan generation (if implemented)
- Mock OpenAI API for all tests (don't call real API in tests)

---

## Phase 10: Extra Features & Polish

**Goal:** Implement creative extra features — recipe scaling, shopping lists, cooking timer, step-by-step cooking mode, print view — and polish the overall UX.

### Task 10.1 — Implement Recipe Scaling

- Create `src/lib/scaling.ts`:
  - `scaleQuantity(quantity: string, factor: number)`: parse quantity strings ("2 1/2 cups", "1/4 tsp") → scale → format back
  - Handle fractions, decimals, ranges ("2-3 cloves")
  - Handle unit-less quantities ("3 eggs" → "6 eggs")
  - Round to sensible precision
- Create `src/components/recipes/serving-adjuster.tsx`:
  - +/- buttons to adjust serving count
  - Display current servings vs original
  - All ingredient quantities update in real-time
  - Reset button to return to original servings
- Integrate into recipe detail page

### Task 10.2 — Create Shopping List Feature (API & UI)

- Shopping list models should already exist from Phase 2 (`ShoppingList`, `ShoppingListItem`)
- Create `src/app/api/shopping-lists/route.ts`:
  - **GET** `/api/shopping-lists`: List user's shopping lists
  - **POST** `/api/shopping-lists`: Create a new shopping list
    - Body: `{ name: string, recipeIds?: string[] }`
    - If recipeIds provided: auto-populate with aggregated ingredients from those recipes
- Create `src/app/api/shopping-lists/[id]/route.ts`:
  - **GET** `/api/shopping-lists/:id`: Get shopping list with items
  - **PUT** `/api/shopping-lists/:id`: Update shopping list name
  - **DELETE** `/api/shopping-lists/:id`: Delete shopping list and items
- Create `src/app/api/shopping-lists/[id]/items/route.ts`:
  - **POST**: Add items to shopping list
  - **PUT** `/api/shopping-lists/:id/items/:itemId`: Update item (check/uncheck, edit quantity)
  - **DELETE** `/api/shopping-lists/:id/items/:itemId`: Remove item
- Create `src/components/shopping/shopping-list.tsx`:
  - Checklist UI with checkboxes for each item
  - Items grouped by category (Produce, Dairy, Meat, Pantry, etc.)
  - Strikethrough on checked items
  - "Add Item" button (manual item entry)
  - "Remove Checked" button
  - "Clear All" button
  - Editable quantities and notes
- Create `src/components/shopping/add-to-list-button.tsx`:
  - Button on recipe detail page: "Add to Shopping List"
  - Select existing list or create new one
  - Auto-aggregate ingredients (combine duplicates, sum quantities)
- Create `src/app/(main)/shopping-lists/page.tsx`:
  - List all shopping lists with item counts
  - Create new list button
  - Delete list with confirmation
- Create `src/app/(main)/shopping-lists/[id]/page.tsx`:
  - Full shopping list view and editing

### Task 10.3 — Create Cooking Mode & Timer

- Create `src/components/recipes/cooking-timer.tsx`:
  - Per-step timer based on `RecipeStep.duration` field
  - Start/pause/reset controls
  - Countdown display (MM:SS)
  - Audio alert when timer completes (browser notification or sound)
  - Multiple concurrent timers (for parallel cooking steps)
  - Visual indicator on the step being timed
  - Persist timer state in component (not across page navigation)
- Create `src/components/recipes/cooking-mode.tsx`:
  - Full-screen/overlay mode optimized for cooking:
    - Large text for readability
    - One step at a time display
    - Swipe left/right navigation (or arrow buttons)
    - Step progress indicator (Step 3 of 8)
    - Current step timer (if duration defined)
    - Ingredient list accessible via slide-up panel
    - "Exit Cooking Mode" button
  - Mobile-optimized: prevent screen sleep (Wake Lock API), large tap targets
  - Accessible: high contrast, large fonts

### Task 10.4 — Implement Print View & URL Import

- Create `src/components/recipes/print-view.tsx`:
  - CSS `@media print` styles:
    - Hide navigation, header, footer, interactive elements
    - Clean, single-column layout
    - Recipe title, image (optional), metadata
    - Ingredients list
    - Numbered instructions
    - Nutrition data (if available)
    - Source attribution
  - "Print Recipe" button on recipe detail page
  - Uses `window.print()` or generates a printer-friendly layout
- Create `src/app/api/recipes/import/route.ts` (Nice-to-Have):
  - **POST** `/api/recipes/import`: Import recipe from a URL
    - Body: `{ url: string }`
    - Fetch the URL, parse recipe structured data (JSON-LD, microdata)
    - Extract: title, ingredients, steps, images, times, servings
    - Return parsed data (user reviews and saves as new recipe)
- Create `src/components/recipes/import-dialog.tsx` (Nice-to-Have):
  - URL input field
  - "Import" button
  - Preview of parsed data
  - "Save as Recipe" button (pre-fills recipe form)

### Task 10.5 — Polish UX (Responsive Design, Error Handling & Accessibility)

- Review and fix responsive layout across all pages:
  - Mobile (< 640px): single column, stacked layout, hamburger menu
  - Tablet (640-1024px): two column grid, visible but compact nav
  - Desktop (> 1024px): full layout with sidebar options
- Ensure all tap targets are minimum 44px on mobile
- Test on common device sizes (iPhone SE, iPhone 14, iPad, Desktop)
- Fix any overflow, text truncation, or alignment issues
- Review all API routes for consistent error responses:
  - 400: validation errors (with field-level details)
  - 401: unauthenticated
  - 403: unauthorized (not owner, no access)
  - 404: resource not found
  - 429: rate limited
  - 500: internal server error (generic message, log details)
- Add toast notifications for all user actions (success, error)
- Handle network errors gracefully (offline state, retry prompts)
- Handle loading states consistently (skeletons, not spinners)
- Review all components for accessibility:
  - Proper ARIA labels on interactive elements
  - Keyboard navigation (tab order, Enter/Space activation)
  - Focus management (dialogs, modals, dropdowns)
  - Color contrast ratios (WCAG AA minimum)
  - Screen reader compatibility (semantic HTML, landmarks)
  - Form error announcements (aria-live, aria-describedby)
  - Alt text on all images
  - Skip navigation link

### Task 10.6 — Write Tests for Extra Features

- Test recipe scaling calculations (integers, fractions, decimals, ranges)
- Test scaling edge cases (0 servings, very large numbers)
- Test shopping list CRUD operations
- Test ingredient aggregation (combining duplicate ingredients)
- Test shopping list item check/uncheck persistence
- Test cooking timer countdown accuracy
- Test cooking timer pause/resume behavior
- Test step-by-step cooking mode navigation
- Test print view renders correct content
- Test URL import parsing (if implemented)
- Test responsive breakpoints render correctly
- Test accessibility: keyboard navigation through recipe form
- Test accessibility: screen reader reads recipe content

---

## Phase 11: Comprehensive Testing

**Goal:** Implement a thorough testing strategy covering unit tests, integration tests, component tests, and end-to-end tests to ensure application reliability and correctness.

### Task 11.1 — Set Up Testing Infrastructure & MSW

- Install testing dependencies:
  - `vitest` (test runner — faster than Jest for Vite/Next.js)
  - `@testing-library/react` and `@testing-library/jest-dom` (component testing)
  - `@testing-library/user-event` (user interaction simulation)
  - `msw` (Mock Service Worker — API mocking)
  - `@playwright/test` (end-to-end testing — optional)
  - `prisma` test utils (database seeding/cleanup for integration tests)
- Configure `vitest.config.ts` with:
  - Path aliases matching tsconfig
  - Setup files for testing-library matchers
  - Coverage reporting (Istanbul or v8)
- Add test scripts to `package.json`:
  - `"test": "vitest"`
  - `"test:run": "vitest run"` (CI mode)
  - `"test:coverage": "vitest run --coverage"`
  - `"test:ui": "vitest --ui"` (visual test UI)
  - `"test:e2e": "playwright test"` (if using Playwright)
- Create `src/mocks/handlers.ts`:
  - Define mock API handlers for all endpoints
  - Cover success and error scenarios
  - Use realistic mock data
- Create `src/mocks/server.ts` (for Node.js/test environment)
- Create `src/mocks/browser.ts` (for browser/Storybook — optional)
- Create mock data factories for all models (User, Recipe, etc.)

### Task 11.2 — Write Unit Tests — Utility Functions

- Test `src/lib/scaling.ts`:
  - Fraction parsing and formatting
  - Scaling up and down
  - Edge cases (zero, negatives, very large numbers)
- Test `src/lib/search.ts`:
  - Query building from various filter combinations
  - Full-text search query formatting
  - Special character handling
- Test `src/lib/rate-limit.ts`:
  - Rate limit counting
  - Window expiration
  - Per-user isolation
- Test `src/lib/validations/recipe.ts`:
  - Valid recipe data passes validation
  - Each required field triggers error when missing
  - Field-level validation (string length, number ranges, enum values)
- Test `src/lib/auth-utils.ts`:
  - Access control logic for various visibility/share combinations
- Test `src/lib/ai-utils.ts`:
  - Retry-once pattern
  - Error message formatting

### Task 11.3 — Write Unit Tests — React Hooks

- Test `src/hooks/use-recipes.ts`:
  - Query key generation
  - Cache invalidation on mutations
  - Optimistic update behavior
  - Error state handling
- Test `src/hooks/use-tags.ts`:
  - Tag toggle optimistic updates
  - Cache updates after mutation
- Test `src/hooks/use-search.ts`:
  - Debounce behavior
  - Filter parameter serialization
- Test `src/hooks/use-ratings.ts`:
  - Optimistic rating update
  - Average recalculation
- Test `src/hooks/use-comments.ts`:
  - Pagination behavior
  - Comment CRUD operations

### Task 11.4 — Write Component Tests — UI Components

- Test `RecipeCard`:
  - Renders all recipe information correctly
  - Handles missing data (no image, no rating)
  - Click navigates to detail page
  - Tag indicators display correctly
- Test `RecipeGrid`:
  - Renders correct number of cards
  - Empty state displays
  - Loading skeleton displays
- Test `RecipeFormWizard`:
  - Step navigation (forward and backward)
  - Per-step validation prevents progression
  - Form data persists across steps
  - Submit sends correct data
- Test `StarRating`:
  - Renders correct number of filled/empty stars
  - Hover preview works
  - Click fires onChange
  - Read-only mode disables interaction
- Test `TagToggles`:
  - Renders correct active/inactive states
  - Click toggles state
  - Disabled when not authenticated
- Test `SearchBar`:
  - Debounces input
  - Clear button works
  - Submit navigates with query
- Test `FilterPanel`:
  - Filters apply correctly
  - Clear all resets all filters
  - Active filter count updates
- Test `ShareDialog`:
  - Username search works
  - Share link generation and copy
  - Share revocation
- Test `CommentSection`:
  - Comments render with correct data
  - Add comment form submits
  - Edit/delete buttons appear for own comments
- Test `CookingMode`:
  - Step navigation (next, previous)
  - Progress indicator updates
- Test `ServingAdjuster`:
  - Increment/decrement changes count
  - Reset returns to original
- Test `ShoppingList`:
  - Item check/uncheck
  - Add item
  - Remove checked items
- Test `NutritionDisplay`:
  - Renders all nutrition fields
  - Shows estimate button when no data

### Task 11.5 — Write Integration Tests — API Routes

- Test each API route with a real or mocked database:
  - `POST /api/recipes`: full recipe creation flow
  - `GET /api/recipes`: list with various filters
  - `GET /api/recipes/:id`: with visibility checks
  - `PUT /api/recipes/:id`: update with ownership check
  - `DELETE /api/recipes/:id`: deletion with cascade
  - `POST /api/recipes/:id/duplicate`: duplication flow
  - `POST /api/recipes/:id/tags`: tag toggle
  - `POST /api/recipes/:id/save`: save toggle
  - `GET /api/collections`: collection with tab filters
  - `GET /api/search`: full-text search with filters
  - `PUT /api/recipes/:id/visibility`: visibility change
  - `POST /api/recipes/:id/shares`: share creation
  - `POST /api/recipes/:id/share-link`: link generation
  - `POST /api/recipes/:id/ratings`: rating upsert
  - `POST /api/recipes/:id/comments`: comment creation
  - `POST /api/ai/generate`: recipe generation (mocked OpenAI)
  - `POST /api/ai/substitute`: substitution (mocked OpenAI)
  - `POST /api/ai/nutrition`: nutrition estimate (mocked OpenAI)
  - `POST /api/ai/generate-image`: image generation (mocked OpenAI + Cloudinary)
  - Shopping list CRUD routes
  - User search route

### Task 11.6 — Write Integration Tests — Auth Flows

- Test complete OAuth sign-in flow (mocked)
- Test username onboarding flow
- Test middleware route protection (redirect behavior)
- Test session token contains correct user data
- Test sign-out clears session

### Task 11.7 — Write End-to-End Tests (Optional — Playwright)

- If using Playwright, create E2E tests for critical user journeys:
  - **Happy path — Recipe creation**: Sign in → Navigate to "New Recipe" → Fill all form steps → Submit → Verify recipe appears
  - **Search flow**: Navigate to search → Enter query → Apply filters → Verify results
  - **Social flow**: Find a public recipe → Rate it → Leave a comment → Verify both appear
  - **Sharing flow**: Create recipe → Share by username → Verify recipient sees it
  - **Collection flow**: Browse recipes → Tag as favorite → View collection → Verify recipe appears
  - **AI flow**: Open recipe generator → Enter ingredients → Generate → Save recipe
  - **Guest flow**: Visit community page → Click recipe → See summary only → Login prompt

### Task 11.8 — Set Up Test Coverage Reporting

- Configure coverage thresholds:
  - Statements: 80%+
  - Branches: 75%+
  - Functions: 80%+
  - Lines: 80%+
- Generate coverage reports (HTML, lcov)
- Add coverage check to CI pipeline (fail build if below threshold)

### Task 11.9 — Write Tests for Edge Cases & Error Scenarios

- Test concurrent tag/save operations (race conditions)
- Test recipe creation with maximum data (long title, many ingredients/steps)
- Test search with empty query, special characters, SQL injection attempts
- Test rate limiter under high concurrency
- Test API routes with malformed request bodies
- Test file upload with invalid file types/sizes
- Test authentication with expired/invalid tokens
- Test database constraint violations (duplicate username, etc.)
- Test handling of deleted resources (recipe deleted while another user is viewing)
- Test network timeout handling in React Query

---

## Phase 12: Performance Optimization

**Goal:** Optimize the application for speed, efficiency, and smooth user experience across all devices and network conditions.

### Task 12.1 — Optimize Database Queries

- Review all Prisma queries for N+1 problems — use `include` and `select` appropriately
- Add strategic `select` clauses to limit fields returned (especially for list views)
- Ensure all filtered queries use indexed columns
- Test query performance with Prisma logging/query analysis
- Optimize the full-text search query for speed

### Task 12.2 — Implement Next.js Optimizations

- Use `next/image` for all recipe images (automatic optimization, lazy loading, responsive srcSet)
- Configure image sizes and quality settings for recipe cards vs detail pages
- Implement dynamic imports (`next/dynamic`) for heavy components (recipe form wizard, AI features, cooking mode)
- Use React Server Components where possible (data-fetching pages)
- Implement proper cache headers for API routes
- Use `generateMetadata` for SEO-friendly page titles and descriptions

### Task 12.3 — Optimize React Query Caching

- Configure appropriate `staleTime` per query type:
  - Recipe list: 30 seconds
  - Recipe detail: 1 minute
  - User collection: 30 seconds
  - Search results: 30 seconds
  - Dietary tags: 5 minutes (rarely changes)
- Implement prefetching for likely navigations (hover over recipe card → prefetch detail)
- Use `placeholderData` from list data when navigating to detail pages

### Task 12.4 — Implement Loading Performance

- Add skeleton loading states for all data-dependent views
- Implement progressive image loading (blur placeholder → full image)
- Minimize JavaScript bundle size (check with `next build` output)
- Defer non-critical JavaScript (AI features, cooking timer)
- Optimize font loading (subset, preload)

### Task 12.5 — Write Performance Tests

- Test initial page load time (target: < 3 seconds on 3G)
- Test recipe list rendering performance with 50+ recipes
- Test search response time (target: < 500ms)
- Test image loading performance (lazy load, proper sizes)
- Test bundle size (check for unexpectedly large imports)

---

## Phase 13: Security Hardening

**Goal:** Review and harden the application against common security vulnerabilities (OWASP Top 10) and ensure data protection.

### Task 13.1 — Input Validation & Sanitization

- Verify all API routes validate input with Zod schemas
- Sanitize user-generated content (recipe descriptions, comments) to prevent XSS
- Validate image URLs (allowlist domains or validate format)
- Sanitize search queries to prevent injection
- Validate all numeric inputs (prevent negative values, overflow)

### Task 13.2 — Authentication & Authorization Hardening

- Verify every protected API route uses `requireAuth()`
- Verify every mutation route checks resource ownership
- Verify `canViewRecipe()` is called on every recipe read
- Test that no route leaks data from private recipes
- Ensure JWT tokens have appropriate expiry
- Implement CSRF protection (NextAuth.js handles this)
- Test authorization bypass scenarios

### Task 13.3 — API Security

- Implement rate limiting on all API routes (not just AI endpoints)
- Add request size limits to prevent abuse
- Set appropriate CORS headers
- Validate content-type headers on POST/PUT routes
- Implement proper error responses (don't leak stack traces in production)

### Task 13.4 — Environment & Deployment Security

- Verify no secrets are committed to the repository
- Verify `.env.local` is in `.gitignore`
- Ensure `NEXTAUTH_SECRET` is a strong, unique random value
- Verify Cloudinary upload signatures prevent unauthorized uploads
- Review Vercel environment variable configuration

### Task 13.5 — Write Security Tests

- Test XSS prevention in recipe title, description, and comments
- Test SQL injection attempts in search queries
- Test unauthorized access to private recipes
- Test recipe ownership bypass attempts
- Test rate limiting enforcement
- Test CSRF protection
- Test share link token security (cannot be guessed or enumerated)
- Test that error responses don't leak sensitive information

---

## Phase 14: Pre-Deployment Preparation

**Goal:** Prepare the application for production deployment — final QA, build verification, documentation, and configuration.

### Task 14.1 — Production Build Verification

- Run `npm run build` and resolve any build errors
- Review build output for warnings (unused variables, missing types)
- Check bundle sizes and identify any unexpectedly large chunks
- Verify all pages render correctly in production mode (`npm run start`)
- Test with `NODE_ENV=production` to catch dev-only behavior

### Task 14.2 — Environment Configuration for Production

- Set up Neon production database (separate from development)
- Run migrations on production database: `npx prisma migrate deploy`
- Run seed script on production database
- Verify full-text search indexes are created in production
- Configure all environment variables for production deployment

### Task 14.3 — OAuth Configuration for Production

- Update Google OAuth app with production redirect URIs
- Update GitHub OAuth app with production redirect URIs
- Verify OAuth flows work with production URLs
- Test login/logout cycle with both providers

### Task 14.4 — Cloudinary Configuration for Production

- Verify Cloudinary upload preset is configured for production
- Set up appropriate transformations for recipe images
- Configure CDN delivery settings
- Test image upload in production environment

### Task 14.5 — OpenAI Configuration for Production

- Verify API key has appropriate permissions and rate limits
- Set up billing alerts/spending limits on OpenAI
- Test all AI features with production API key
- Verify rate limiting works correctly in production

### Task 14.6 — Final QA Checklist

- Test every user flow end-to-end in production build:
  - [ ] Sign in with Google
  - [ ] Sign in with GitHub
  - [ ] Complete username onboarding
  - [ ] Create a recipe (all form steps)
  - [ ] Upload an image
  - [ ] Edit a recipe
  - [ ] Delete a recipe
  - [ ] Duplicate a recipe
  - [ ] Search recipes
  - [ ] Filter recipes
  - [ ] Tag recipes (Favorite, To Try, Made Before)
  - [ ] Save/unsave recipes
  - [ ] View My Collection (all tabs)
  - [ ] Change recipe visibility
  - [ ] Share by username
  - [ ] Share by link
  - [ ] Rate a recipe
  - [ ] Comment on a recipe
  - [ ] Edit/delete comments
  - [ ] Browse community page
  - [ ] Guest access (summary only)
  - [ ] AI recipe generation
  - [ ] Ingredient substitution
  - [ ] Nutritional estimation
  - [ ] AI image generation
  - [ ] Recipe scaling
  - [ ] Shopping list CRUD
  - [ ] Cooking timer
  - [ ] Step-by-step cooking mode
  - [ ] Print recipe
  - [ ] Dark mode toggle
  - [ ] Mobile responsiveness
  - [ ] Keyboard navigation

### Task 14.7 — Finalize README.md

- Update README with:
  - Final feature list
  - Screenshots of key pages
  - Live demo URL (after deployment)
  - Complete setup instructions
  - Architecture diagram (text-based or image)
  - API documentation summary
  - Tech stack details with versions
  - Known limitations / future improvements
  - Credits and license

### Task 14.8 — Clean Up Codebase

- Remove any TODO/FIXME comments left in code
- Remove unused imports and variables
- Remove console.log statements (use proper logging in production)
- Remove any test/debug code
- Verify consistent code formatting (`npm run format:check`)
- Run linter and fix any remaining warnings (`npm run lint`)

---

## Phase 15: Deployment & Launch

**Goal:** Deploy the application to Vercel, configure the production environment, verify everything works, and finalize the submission.

### Task 15.1 — Deploy to Vercel

- Connect the GitHub repository to Vercel
- Configure the build settings:
  - Framework: Next.js
  - Build command: `npm run build` (or `prisma generate && next build`)
  - Output directory: `.next`
- Add all production environment variables in Vercel dashboard
- Trigger the first deployment
- Monitor build logs for errors

### Task 15.2 — Configure Production Database

- Verify Neon database connection from Vercel
- Run `prisma migrate deploy` in production (via Vercel build or manually)
- Seed production database with sample data
- Verify all tables and indexes are created

### Task 15.3 — Verify Production Deployment

- Access the production URL (\*.vercel.app)
- Run through the full QA checklist (Task 14.6) on the production site
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices (iOS Safari, Android Chrome)
- Verify all OAuth providers work with production URLs
- Verify Cloudinary uploads work in production
- Verify AI features work in production
- Check for any CORS or mixed-content issues

### Task 15.4 — Set Up Monitoring (Optional)

- Enable Vercel Analytics for performance monitoring
- Set up error tracking (Vercel's built-in or Sentry)
- Configure OpenAI usage alerts
- Monitor Neon database usage

### Task 15.5 — Configure Custom Domain (Optional)

- If using a custom domain, configure DNS settings
- Set up SSL certificate (Vercel handles automatically)
- Update OAuth redirect URIs for custom domain
- Update `NEXTAUTH_URL` environment variable

### Task 15.6 — Final Submission Preparation

- Verify GitHub repository is public (or accessible to reviewers)
- Verify the live URL is accessible and functional
- Create a final commit with any last-minute fixes
- Verify README includes both the GitHub repo link and live URL
- Do one final walkthrough of the entire application

### Task 15.7 — Post-Deployment Smoke Test

- Sign in with both Google and GitHub
- Create a recipe, verify it appears in grid
- Test search functionality
- Test sharing features
- Test AI features
- Verify guest access works
- Check mobile responsiveness on a real device
- Confirm everything is production-ready

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
