import { test, expect } from '@playwright/test';

import { TEST_RECIPE, TEST_INGREDIENTS, TEST_STEPS } from './helpers/test-data';

test.describe('Recipe Creation Flow', () => {
  test.slow();

  test('user can create a recipe through the wizard', async ({ page }) => {
    await page.goto('/recipes/new');

    // Step 1: Basic Info
    await page.getByLabel(/recipe name/i).fill(TEST_RECIPE.name);
    await page.getByLabel(/description/i).fill(TEST_RECIPE.description);

    const cuisineInput = page.getByLabel(/cuisine/i);
    if (await cuisineInput.isVisible()) {
      await cuisineInput.fill(TEST_RECIPE.cuisineType);
    }

    const difficultySelect = page.getByLabel(/difficulty/i);
    if (await difficultySelect.isVisible()) {
      await difficultySelect.selectOption(TEST_RECIPE.difficulty);
    }

    // Fill time and servings
    const prepTimeInput = page.getByLabel(/prep time/i);
    if (await prepTimeInput.isVisible()) {
      await prepTimeInput.fill(String(TEST_RECIPE.prepTime));
    }

    const cookTimeInput = page.getByLabel(/cook time/i);
    if (await cookTimeInput.isVisible()) {
      await cookTimeInput.fill(String(TEST_RECIPE.cookTime));
    }

    const servingsInput = page.getByLabel(/servings/i);
    if (await servingsInput.isVisible()) {
      await servingsInput.fill(String(TEST_RECIPE.servings));
    }

    // Navigate to next step
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Step 2: Ingredients
    for (const ingredient of TEST_INGREDIENTS.slice(0, 3)) {
      const nameInput = page.getByPlaceholder(/ingredient name/i).last();
      if (await nameInput.isVisible()) {
        await nameInput.fill(ingredient.name);
      }

      const quantityInput = page.getByPlaceholder(/quantity/i).last();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill(ingredient.quantity);
      }

      const addButton = page.getByRole('button', { name: /add ingredient/i });
      if (await addButton.isVisible()) {
        await addButton.click();
      }
    }

    // Navigate to next step
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Step 3: Steps
    for (const step of TEST_STEPS.slice(0, 3)) {
      const instructionInput = page.getByPlaceholder(/instruction/i).last();
      if (await instructionInput.isVisible()) {
        await instructionInput.fill(step.instruction);
      }

      const addStepButton = page.getByRole('button', { name: /add step/i });
      if (await addStepButton.isVisible()) {
        await addStepButton.click();
      }
    }

    // Submit the recipe
    const submitButton = page.getByRole('button', {
      name: /create|submit|save/i,
    });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Verify we're redirected to the recipe detail page
    await expect(page).toHaveURL(/\/recipes\//);
    await expect(page.getByText(TEST_RECIPE.name)).toBeVisible();
  });

  test('recipe creation form validates required fields', async ({ page }) => {
    await page.goto('/recipes/new');

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', {
      name: /create|submit|next/i,
    });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should see validation errors
      const errorCount = await page.locator('[aria-invalid="true"]').count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });
});
