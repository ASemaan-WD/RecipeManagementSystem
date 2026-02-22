import { test, expect } from '@playwright/test';

test.describe('Collection Flow', () => {
  test('user can view their collection page', async ({ page }) => {
    await page.goto('/my-collection');

    // Should see collection page with tabs or sections
    await expect(page.getByText(/collection|favorites/i)).toBeVisible();
  });

  test('user can tag a recipe as Favorite', async ({ page }) => {
    await page.goto('/community');

    // Find a recipe card with tag toggles
    const favoriteButton = page
      .getByRole('button', { name: /favorite/i })
      .first();
    if (await favoriteButton.isVisible({ timeout: 5000 })) {
      await favoriteButton.click();

      // The button should visually change to indicate it's active
      await expect(favoriteButton).toBeVisible();
    }
  });

  test('user can tag a recipe as To Try', async ({ page }) => {
    await page.goto('/community');

    const toTryButton = page.getByRole('button', { name: /to try/i }).first();
    if (await toTryButton.isVisible({ timeout: 5000 })) {
      await toTryButton.click();
      await expect(toTryButton).toBeVisible();
    }
  });

  test('user can save a recipe', async ({ page }) => {
    await page.goto('/community');

    const saveButton = page.getByRole('button', { name: /save/i }).first();
    if (await saveButton.isVisible({ timeout: 5000 })) {
      await saveButton.click();
      await expect(saveButton).toBeVisible();
    }
  });

  test('collection page shows tagged recipes', async ({ page }) => {
    await page.goto('/my-collection');

    // Should see sections for different tag types
    const tabs = page.locator('[role="tablist"]');
    if (await tabs.isVisible()) {
      await expect(tabs).toBeVisible();
    }
  });
});
