# Recipe Management System - Product Manager Specs

> **Status:** FINALIZED — All open questions resolved. Ready for CTO and Senior Dev refinement.

## Product Vision

A modern recipe management platform where users can organize their culinary collection, discover new recipes, share with others, and leverage AI to enhance their cooking experience — from ingredient substitution to meal planning.

---

## User Personas

### P1: Home Cook / Primary User

- Manages their personal recipe collection
- Tags and organizes recipes
- Searches for recipes by various criteria
- Uses AI features for cooking assistance
- Shares recipes with other users

### P2: Community Member

- Browses shared/public recipes
- Saves recipes to their own collection
- Rates and comments on recipes

### P3: Guest (unauthenticated)

- Can browse public recipe **summaries** (title, image, prep time, cuisine)
- Must log in to view full recipe details (ingredients, steps, instructions)
- Cannot save, share, rate, or comment

---

## Finalized Decisions

### 1. Sharing Model: Three-Tier Visibility (Google Docs-style)

Recipes are **private by default** with three visibility levels:

| Visibility  | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| **Private** | Only the author can see the recipe (default)                         |
| **Shared**  | Author invites specific users by email/username — only they can view |
| **Public**  | Visible to all authenticated users; summaries visible to guests      |

- When sharing with specific users, the author selects users from a share dialog
- Shared users receive a notification or can find the recipe in their "Shared with me" section
- Author can revoke shared access at any time
- This mirrors the Google Docs sharing model: Private → Share with specific people → Public

### 2. Social Features: Yes — Comments & Ratings

Public and shared recipes support:

- **Ratings:** 1-5 star rating system on shared/public recipes
- **Comments:** Users can leave comments on shared/public recipes
- **Average rating** displayed on recipe cards and detail pages
- Author can delete comments on their own recipes
- Users can edit/delete their own comments

### 3. AI Features: Prioritized

| Priority      | Feature                  | Description                                                                  |
| ------------- | ------------------------ | ---------------------------------------------------------------------------- |
| **Must-have** | AI Recipe Generator      | "I have chicken, rice, and bell peppers — what can I make?"                  |
| **Must-have** | Ingredient Substitution  | "I don't have butter, what can I use instead in this recipe?"                |
| **Must-have** | AI Nutritional Estimates | Auto-calculate approximate nutrition info from ingredients                   |
| Nice-to-have  | Smart Tagging            | AI auto-suggests cuisine type, dietary tags, difficulty when adding a recipe |
| Nice-to-have  | Meal Plan Suggestions    | AI suggests a weekly meal plan from your collection                          |

### 4. Recipe Images: All Three Options

| Option           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| **URL-based**    | Paste an image URL                                             |
| **File upload**  | Upload an image directly (stored via Cloudinary or equivalent) |
| **AI-generated** | Auto-generate a placeholder image when no image is provided    |

- Display priority: uploaded image > URL image > AI-generated placeholder
- All images are optimized and served via CDN

### 5. Guest Access: Summary-Only

| User Type         | Can See                                                 | Cannot See                                      |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Guest**         | Recipe cards (title, image, prep time, cuisine, rating) | Full ingredients, steps, instructions, comments |
| **Guest**         | "Log in to view full recipe" prompt on click            | —                                               |
| **Authenticated** | Full recipe detail                                      | Private recipes of other users                  |

### 6. Design: Pinterest-Style Recipe Cards

- **Recipe cards** in a responsive grid layout (Pinterest/Masonry style)
- Each card shows: image, title, prep time, difficulty, cuisine, average rating
- Cards expand on click to show full recipe detail (or navigate to detail page)
- Clean, appetizing design with food-centric visual hierarchy
- Subtle animations on hover/expand

### 7. Mobile Responsive: Yes (Priority)

- Mobile-first design — people cook with their phone nearby
- Touch-friendly controls (large tap targets for tag buttons, timers)
- Responsive recipe detail view optimized for kitchen use
- Step-by-step mode for mobile: one instruction at a time, large text

### 8. Seed Data: Yes

- App ships pre-loaded with **sample recipes** covering:
  - Multiple cuisines (Italian, Asian, Mexican, Middle Eastern, etc.)
  - Various difficulties (easy, medium, hard)
  - Different dietary types (vegan, gluten-free, standard)
  - ~15-20 seed recipes with real images
- Seed recipes are authored by a "RecipeApp" system user and marked as public

### 9. Recipe Import from URL: Nice-to-Have

- Not a launch priority
- Implement if time allows: paste a URL → AI extracts recipe title, ingredients, steps
- Lower priority than core CRUD, sharing, and must-have AI features

### 10. Deployment Platform

Reuse the same platform stack as the Library project, since multiple projects can be deployed:

| Choice       | Technology             | Rationale                                                                       |
| ------------ | ---------------------- | ------------------------------------------------------------------------------- |
| Platform     | **Vercel**             | Best free tier for Next.js, supports multiple projects per account              |
| Database     | **Neon**               | Free tier PostgreSQL, serverless, pgvector support — multiple databases allowed |
| File Storage | **Cloudinary**         | Free tier image hosting with CDN and transformations                            |
| CI/CD        | **Vercel auto-deploy** | Push to `main` → auto build + deploy                                            |

> **Verified:** Vercel, Neon, and Cloudinary all support multiple projects on their free tiers.

### 11. Tech Stack: Same as Library Project (Unless Better Alternatives Exist)

- Default to the Library project's stack for consistency and speed
- Only deviate if a different technology clearly better serves a recipe-specific need
- Shared patterns reduce context-switching and speed up development

---

## Feature Breakdown (Finalized)

### 1. Recipe Management (CRUD)

- Add a recipe with: name, ingredients (with quantities), step-by-step instructions, prep time, cook time, servings, difficulty level, cuisine type, dietary tags (vegan, gluten-free, etc.), image (upload, URL, or AI-generated)
- Edit existing recipes
- Delete recipes
- Duplicate/fork a recipe to make variations

### 2. Status Tagging System

- Mark recipes as:
  - **Favorite** (heart icon)
  - **To Try** (bookmark icon)
  - **Made Before** (checkmark icon)
- Filter by status tags
- Personal per-user tagging (my "favorite" is independent of your "favorite")

### 3. Search & Discovery

- Search by: recipe name, ingredient, cuisine type, preparation time
- Filters: dietary tags, difficulty, cook time range, status tag, rating
- Sort by: name, date added, prep time, rating/popularity

### 4. AI Features

- **Must-have:** AI Recipe Generator, Ingredient Substitution, AI Nutritional Estimates
- **Nice-to-have:** Smart Tagging, Meal Plan Suggestions
- (See prioritized table above for details)

### 5. Three-Tier Sharing & Social

- Three-tier visibility: Private → Shared (specific users) → Public
- User registration and authentication
- Browse community/public recipes
- Save/bookmark other users' recipes
- Rate (1-5 stars) and comment on shared/public recipes

### 6. Creative / Extra Features

- Cooking timer built into recipe view
- Shopping list generator from selected recipes
- Recipe scaling (adjust servings, auto-recalculate quantities)
- Import recipes from URL (nice-to-have)
- Dark mode / theme switching
- Print-friendly recipe view
- Step-by-step mobile cooking mode

---

## User Stories (Finalized Priority Order)

| Priority | Story                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| P0       | As a user, I can sign up and log in                                                    |
| P0       | As a user, I can add/edit/delete my recipes with images (upload, URL, or AI-generated) |
| P0       | As a user, I can tag recipes as favorite/to-try/made-before                            |
| P0       | As a user, I can search recipes by name, ingredient, cuisine, or prep time             |
| P1       | As a user, I can set recipe visibility to private, shared (specific users), or public  |
| P1       | As a user, I can share a recipe with specific users by email/username                  |
| P1       | As a user, I can browse and save other users' public recipes                           |
| P1       | As a user, I can ask AI "what can I make with these ingredients?"                      |
| P1       | As a user, I can ask AI for ingredient substitutions                                   |
| P1       | As a user, I can rate and comment on public/shared recipes                             |
| P2       | As a user, I can get AI-estimated nutritional info for a recipe                        |
| P2       | As a user, I can generate a shopping list from selected recipes                        |
| P2       | As a user, I can scale recipe servings and see adjusted quantities                     |
| P2       | As a guest, I can see recipe summaries but must log in to view full details            |
| P3       | As a user, I can import a recipe from a URL                                            |
| P3       | As a user, I can get AI meal plan suggestions                                          |
| P3       | As a user, AI auto-suggests tags when I create a recipe                                |

---

## Success Metrics

- All core features (P0 + P1) functional and deployed
- AI features feel natural and genuinely useful
- Three-tier sharing works seamlessly (private → shared → public)
- Social features (ratings, comments) work on shared/public recipes
- Clean, appetizing Pinterest-style UI that makes recipes look great
- Mobile-responsive and usable in a kitchen setting
- Guest users can browse summaries, with clear prompts to sign up
- Deployed and accessible via public URL
- Code is clean and well-organized in GitHub
