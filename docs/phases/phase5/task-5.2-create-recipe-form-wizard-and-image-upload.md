---
task_id: 'task-5.2'
title: 'Create Recipe Form Wizard & Image Upload'
phase: 5
task_number: 2
status: 'pending'
priority: 'high'
dependencies:
  - 'task-5.1'
blocks:
  - 'task-5.5'
  - 'task-5.6'
created_at: '2026-02-20'
---

# Create Recipe Form Wizard & Image Upload

## Current State

> Recipe types, validation schemas, and API routes exist from task-5.1. React Hook Form, @hookform/resolvers, and Zod are installed. shadcn/ui form components (form, input, textarea, select, checkbox, button, dialog, card, tabs, progress, skeleton, sonner) are available. No recipe form components exist yet.

- **What exists**:
  - `src/types/recipe.ts` — `RecipeFormData`, `RecipeIngredientInput`, `RecipeStepInput`, `RecipeImageInput` types
  - `src/lib/validations/recipe.ts` — `createRecipeSchema`, `updateRecipeSchema` Zod schemas
  - `src/lib/cloudinary.ts` — Upload signature generation utility
  - `src/app/api/images/upload-signature/route.ts` — Cloudinary signature endpoint
  - `src/app/api/recipes/route.ts` — POST endpoint for recipe creation
  - `src/app/api/recipes/[id]/route.ts` — PUT endpoint for recipe update
  - All shadcn/ui form components in `src/components/ui/`
  - `react-hook-form`, `@hookform/resolvers`, `zod` installed
  - `next-cloudinary` installed
  - `lucide-react` icons installed
- **What is missing**:
  - `src/components/recipes/recipe-form/` — Multi-step form wizard and all step components
  - Cloudinary upload widget component
- **Relevant code**:
  - `src/lib/validations/recipe.ts` — Schemas to use with React Hook Form resolver
  - `src/types/recipe.ts` — Types for form data
  - `src/components/ui/form.tsx` — shadcn/ui Form component (uses React Hook Form)
  - `src/app/(auth)/onboarding/page.tsx` — Existing form pattern reference (React Hook Form + Zod)

---

## Desired Outcome

- **End state**: A complete multi-step recipe form wizard component with 5 steps (Basic Info, Ingredients, Instructions, Tags, Images), including Cloudinary image upload integration. The wizard is reusable in both "create" and "edit" modes.
- **User-facing changes**: None yet — the wizard component exists but is not mounted on any page (pages are task-5.5).
- **Developer-facing changes**:
  - `src/components/recipes/recipe-form/recipe-form-wizard.tsx` — Main wizard container
  - `src/components/recipes/recipe-form/basic-info-step.tsx` — Step 1
  - `src/components/recipes/recipe-form/ingredients-step.tsx` — Step 2
  - `src/components/recipes/recipe-form/steps-step.tsx` — Step 3
  - `src/components/recipes/recipe-form/tags-step.tsx` — Step 4
  - `src/components/recipes/recipe-form/images-step.tsx` — Step 5
  - `src/components/recipes/recipe-form/form-progress.tsx` — Progress indicator
  - `src/components/recipes/image-upload-widget.tsx` — Cloudinary upload component

---

## Scope & Boundaries

### In Scope

- Create multi-step form wizard with progress indicator and step navigation
- Create all 5 step components with per-step validation
- Create Cloudinary upload widget component
- Support both "create" mode (empty form) and "edit" mode (pre-populated with existing recipe data)
- Form state persistence across steps via React Hook Form context
- Loading states during submission
- Error handling with toast notifications (using sonner)

### Out of Scope

- Pages that mount the wizard (`/recipes/new`, `/recipes/[id]/edit`) — task-5.5
- React Query mutation hooks for create/update — task-5.5
- AI image generation button in the images step — Phase 9
- Drag-and-drop reordering of ingredients/steps — nice-to-have, can be added later
- Ingredient autocomplete from existing ingredients — can use a simple text input for now
- Cuisine type autocomplete from existing recipes — can use a simple text input for now

### Dependencies

- Task-5.1 must be complete (types, validation schemas, Cloudinary utility, API routes)

---

## Implementation Details

### Section 1: Form Progress Indicator (`src/components/recipes/recipe-form/form-progress.tsx`)

**What to do**: Create a reusable step progress indicator showing current position in the wizard.

**Where to find context**:

- `docs/ROADMAP.md` (lines 443-448) — Wizard progress spec
- `src/components/ui/progress.tsx` — shadcn/ui Progress component

**Specific requirements**:

- Display step labels: "Basic Info", "Ingredients", "Instructions", "Tags", "Images"
- Highlight the current step and mark completed steps
- Responsive: on mobile, show "Step X of 5" text; on desktop, show the full step bar
- Props: `currentStep: number`, `totalSteps: number`, `stepLabels: string[]`
- Use shadcn/ui styling conventions

---

### Section 2: Recipe Form Wizard Container (`src/components/recipes/recipe-form/recipe-form-wizard.tsx`)

**What to do**: Create the main wizard component that manages form state, step navigation, and submission.

**Where to find context**:

- `docs/ROADMAP.md` (lines 442-450) — Wizard container spec
- `src/app/(auth)/onboarding/page.tsx` — Existing React Hook Form + Zod pattern

**Specific requirements**:

- Initialize React Hook Form with `zodResolver(createRecipeSchema)` (or `updateRecipeSchema` for edit mode)
- Props:
  - `mode: 'create' | 'edit'`
  - `defaultValues?: RecipeFormData` (for edit mode pre-population)
  - `onSubmit: (data: RecipeFormData) => Promise<void>` (called on final submit)
  - `isSubmitting?: boolean`
- Manage `currentStep` state (0-4)
- Render the current step component, passing the form methods via `FormProvider`
- "Previous" button (disabled on step 0)
- "Next" button with per-step validation before advancing:
  - Step 0 (Basic Info): validate `name`, `description`, `prepTime`, `cookTime`, `servings`, `difficulty`, `cuisineType`, `visibility`
  - Step 1 (Ingredients): validate `ingredients` array (min 1 item, each item valid)
  - Step 2 (Instructions): validate `steps` array (min 1 item, each item valid)
  - Step 3 (Tags): no validation (optional)
  - Step 4 (Images): no validation (optional)
- "Submit" button on the last step (calls `handleSubmit(onSubmit)`)
- Show `FormProgress` at the top
- Display loading state when `isSubmitting` is true
- Use `sonner` toast for error notifications on validation failure

**Patterns to follow**:

- Use `FormProvider` from React Hook Form to share form context with step components
- Use `useFormContext()` inside step components to access form methods
- Follow shadcn/ui Form integration pattern

---

### Section 3: Basic Info Step (`src/components/recipes/recipe-form/basic-info-step.tsx`)

**What to do**: Create Step 1 of the wizard — basic recipe metadata fields.

**Where to find context**:

- `docs/ROADMAP.md` (lines 452-460) — Basic info fields

**Specific requirements**:

- Fields:
  - Recipe title: text input, max 200 chars
  - Description: textarea with character count indicator (max 2000)
  - Prep time: number input (minutes)
  - Cook time: number input (minutes)
  - Servings: number input
  - Difficulty: select dropdown (Easy, Medium, Hard)
  - Cuisine type: text input (max 50 chars)
  - Visibility: select dropdown (Private, Shared, Public)
- All fields show inline validation errors from React Hook Form
- Use shadcn/ui `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` components
- Use `useFormContext()` to access form state

---

### Section 4: Ingredients Step (`src/components/recipes/recipe-form/ingredients-step.tsx`)

**What to do**: Create Step 2 — dynamic ingredient list with add/remove functionality.

**Where to find context**:

- `docs/ROADMAP.md` (lines 462-468) — Ingredients step spec

**Specific requirements**:

- Use `useFieldArray` from React Hook Form for the `ingredients` array
- Each ingredient row: name (text input), quantity (text input), notes (optional text input)
- "Add Ingredient" button appends a blank row with auto-incremented `order`
- "Remove" button per row (with confirmation if the row has data filled in — or just remove directly for simplicity)
- Auto-set `order` field based on array position
- Show validation error if no ingredients exist when trying to advance
- Minimum 1 ingredient required

---

### Section 5: Instructions Step (`src/components/recipes/recipe-form/steps-step.tsx`)

**What to do**: Create Step 3 — dynamic instruction list with add/remove functionality.

**Where to find context**:

- `docs/ROADMAP.md` (lines 469-475) — Instructions step spec

**Specific requirements**:

- Use `useFieldArray` from React Hook Form for the `steps` array
- Each step row: step number (auto-generated, display only), instruction (textarea), duration (optional number input, minutes)
- "Add Step" button appends a blank row
- "Remove" button per row
- Auto-set `stepNumber` based on array position (1-indexed)
- Re-number steps on removal
- Minimum 1 step required

---

### Section 6: Tags Step (`src/components/recipes/recipe-form/tags-step.tsx`)

**What to do**: Create Step 4 — dietary tag selection.

**Where to find context**:

- `docs/ROADMAP.md` (lines 477-480) — Tags step spec

**Specific requirements**:

- Fetch available dietary tags from the database (create a simple fetch call to get all `DietaryTag` records, or accept them as a prop)
- Display dietary tags as checkboxes or toggle chips
- Selected tags stored in `dietaryTagIds` array field
- This step is optional — no minimum selection required
- For initial implementation: accept a `dietaryTags: { id: string; name: string }[]` prop with available tags
- Use shadcn/ui `Checkbox` or `Badge` components for visual selection

---

### Section 7: Images Step (`src/components/recipes/recipe-form/images-step.tsx`)

**What to do**: Create Step 5 — image management with three source options.

**Where to find context**:

- `docs/ROADMAP.md` (lines 481-498) — Images step spec

**Specific requirements**:

- Three image source options:
  1. **Upload**: Cloudinary upload via the `ImageUploadWidget` component
  2. **URL**: Direct URL input with image preview
  3. **AI Generate**: Placeholder button (disabled with "Coming soon" tooltip — wired in Phase 9)
- Display added images in a preview grid
- Each image preview: thumbnail, set as primary toggle (radio-style — only one primary), remove button
- Store images in the `images` form field array
- Maximum 5 images per recipe
- This step is optional — no minimum images required
- Auto-set `order` based on array position
- First image is set as `isPrimary` by default

---

### Section 8: Cloudinary Upload Widget (`src/components/recipes/image-upload-widget.tsx`)

**What to do**: Create a component that integrates with Cloudinary for file uploads.

**Where to find context**:

- `docs/ROADMAP.md` (lines 491-498) — Upload widget spec
- `next-cloudinary` package documentation

**Specific requirements**:

- Use `CldUploadWidget` from `next-cloudinary` for the upload interface
- Before uploading, fetch the upload signature from `POST /api/images/upload-signature`
- On successful upload: call an `onUpload(result)` callback prop with `{ url, publicId }`
- On error: show toast notification
- Props:
  - `onUpload: (result: { url: string; publicId: string }) => void`
  - `disabled?: boolean`
- Style as a dropzone/button area with upload icon

---

## Verification & Acceptance Criteria

### Build Verification

- [ ] Project builds without errors (`npm run build`)
- [ ] No new TypeScript/linting errors introduced
- [ ] No new console warnings or errors

### Functional Verification

- [ ] Form wizard renders all 5 steps with correct labels
- [ ] Progress indicator shows current step accurately
- [ ] "Next" button validates current step before advancing
- [ ] "Previous" button navigates back without losing data
- [ ] Basic Info step renders all 8 fields with validation
- [ ] Ingredients step supports adding and removing ingredient rows
- [ ] Ingredients step requires at least 1 ingredient
- [ ] Instructions step supports adding and removing step rows
- [ ] Instructions step auto-numbers steps on add/remove
- [ ] Tags step displays dietary tag checkboxes
- [ ] Images step supports URL input with preview
- [ ] Images step supports Cloudinary upload via widget
- [ ] Images step enforces max 5 images
- [ ] Primary image toggle works (only one primary at a time)
- [ ] Form data persists across step navigation
- [ ] "Submit" button on last step calls `onSubmit` with complete form data
- [ ] Edit mode pre-populates all fields correctly
- [ ] Loading state displays during submission

### Code Quality Checks

- [ ] New code follows patterns established in `docs/SENIOR_DEVELOPER.md`
- [ ] No hardcoded values that should be configuration
- [ ] No TODO/FIXME comments left unresolved within this task's scope
- [ ] Each component in its own file under `src/components/recipes/recipe-form/`

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
