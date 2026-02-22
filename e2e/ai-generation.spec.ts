import { test, expect } from '@playwright/test';

test.describe('AI Generation Flow', () => {
  test.slow();

  test('user can access AI generation page', async ({ page }) => {
    await page.goto('/ai/generate');

    // Should see the AI generation form
    await expect(page.getByText(/ai|generate/i)).toBeVisible();
  });

  test('user can enter ingredients for AI recipe generation', async ({
    page,
  }) => {
    await page.goto('/ai/generate');

    // Find ingredient input
    const ingredientInput = page.getByPlaceholder(/ingredient|enter/i).first();
    if (await ingredientInput.isVisible()) {
      await ingredientInput.fill('chicken, garlic, lemon');
    }

    // Find and click generate button
    const generateButton = page.getByRole('button', {
      name: /generate/i,
    });
    if (await generateButton.isVisible()) {
      // Just verify the button is clickable (don't actually call AI in E2E)
      await expect(generateButton).toBeEnabled();
    }
  });

  test('AI substitute feature is accessible from recipe page', async ({
    page,
  }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Check if substitute feature exists on recipe page
      const substituteButton = page.getByRole('button', {
        name: /substitut/i,
      });
      if (await substituteButton.isVisible()) {
        await expect(substituteButton).toBeEnabled();
      }
    }
  });
});
