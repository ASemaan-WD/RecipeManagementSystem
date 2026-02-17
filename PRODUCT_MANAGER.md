# Recipe Management System - Product Manager Specs

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
- Can browse public recipes
- Cannot save, share, or interact beyond viewing

---

## Feature Breakdown

### 1. Recipe Management (CRUD)
- Add a recipe with: name, ingredients (with quantities), step-by-step instructions, prep time, cook time, servings, difficulty level, cuisine type, dietary tags (vegan, gluten-free, etc.), image
- Edit existing recipes
- Delete recipes
- Duplicate/fork a recipe to make variations

### 2. Status Tagging System
- Mark recipes as:
  - **Favorite** (heart/star)
  - **To Try** (want to make)
  - **Made Before** (already cooked)
- Filter by status tags
- Personal vs. global tagging (each user has their own tags)

### 3. Search & Discovery
- Search by: recipe name, ingredient, cuisine type, preparation time
- Filters: dietary tags, difficulty, cook time range, status tag
- Sort by: name, date added, prep time, rating/popularity

### 4. AI Features (Differentiators)
- **AI Recipe Generator:** "I have chicken, rice, and bell peppers — what can I make?"
- **Ingredient Substitution:** "I don't have butter, what can I use instead in this recipe?"
- **AI Nutritional Estimates:** Auto-calculate approximate nutrition info from ingredients
- **Smart Tagging:** AI auto-suggests cuisine type, dietary tags, difficulty when adding a recipe
- **Meal Plan Suggestions:** AI suggests a weekly meal plan from your collection

### 5. Multi-user & Sharing
- User registration and authentication
- Personal recipe collections (private by default)
- Share recipes publicly or with specific users
- Browse community/public recipes
- Save/bookmark other users' recipes to your collection

### 6. Creative / Extra Features
- Cooking timer built into recipe view
- Shopping list generator from selected recipes
- Recipe scaling (adjust servings, auto-recalculate quantities)
- Import recipes from URL (paste a link, AI extracts the recipe)
- Dark mode / theme switching
- Print-friendly recipe view

---

## Open Questions for You

> **Please answer these so the CTO and Senior Dev specs can be finalized.**

### Product Scope
1. **Sharing model:** Should recipes be private-by-default with an option to share, or public-by-default with an option to make private?

2. **User interaction level:** Do you want social features (comments, ratings on shared recipes), or keep it simpler (just share/view)?

3. **Which AI features excite you most?** I listed 5 options. Which are must-haves vs nice-to-haves? Any other AI ideas?

4. **Recipe images:** Actual image upload, URL-based, or AI-generated placeholder images?

5. **Guest access:** Should unauthenticated users see public recipes, or must everyone log in?

### UX & Design
6. **Design preference:** Clean recipe-card layout (Pinterest-style), or a more traditional list-based view?

7. **Mobile responsive:** Is mobile important? (People often cook with their phone nearby)

### Data
8. **Seed data:** Should the app come pre-loaded with sample recipes?

9. **Recipe import:** Is "paste a URL and extract recipe" a priority feature, or a nice-to-have?

### Deployment
10. **Preferred hosting platform?** (Vercel, Railway, Azure, Render, etc.)

### Consistency with Library Project
11. **Should both projects share the same tech stack** for consistency and faster development, or are you open to different stacks?

---

## User Stories (Priority Order)

| Priority | Story |
|----------|-------|
| P0 | As a user, I can sign up and log in |
| P0 | As a user, I can add/edit/delete my recipes |
| P0 | As a user, I can tag recipes as favorite/to-try/made-before |
| P0 | As a user, I can search recipes by name, ingredient, cuisine, or prep time |
| P1 | As a user, I can ask AI "what can I make with these ingredients?" |
| P1 | As a user, I can share my recipes publicly |
| P1 | As a user, I can browse and save other users' public recipes |
| P1 | As a user, I can ask AI for ingredient substitutions |
| P2 | As a user, I can get AI-estimated nutritional info |
| P2 | As a user, I can generate a shopping list from selected recipes |
| P2 | As a user, I can scale recipe servings and see adjusted quantities |
| P3 | As a user, I can import a recipe from a URL |
| P3 | As a user, I can get AI meal plan suggestions |

---

## Success Metrics

- All core features functional and deployed
- AI features feel natural and genuinely useful
- Multi-user sharing works seamlessly
- Clean, appetizing UI that makes recipes look great
- Deployed and accessible via public URL
- Code is clean and well-organized in GitHub
