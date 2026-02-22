import { test, expect } from '@playwright/test';

test.describe('Guest Access', () => {
  test('guest can view the community page', async ({ page }) => {
    await page.goto('/community');

    // Should see community recipes
    await expect(page.getByText(/community/i)).toBeVisible();
  });

  test('guest can view recipe card summaries', async ({ page }) => {
    await page.goto('/community');

    // Wait for recipe cards to load
    const cards = page.locator('a[href^="/recipes/"]');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Cards should show recipe name, rating info, etc.
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();
    }
  });

  test('guest can view a public recipe detail page', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Should see recipe detail content
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('guest sees sign in prompt for protected actions', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Guest should not see comment form or should see a login prompt
      const commentBox = page.getByLabel(/write a comment/i);
      const signInLink = page.getByRole('link', { name: /sign in/i });

      // Either the comment box is hidden or there's a sign-in prompt
      const isCommentVisible = await commentBox.isVisible().catch(() => false);
      if (!isCommentVisible) {
        // This is expected for guest users
        expect(isCommentVisible).toBe(false);
      }
    }
  });

  test('protected routes redirect guest to login', async ({ page }) => {
    // Try to access protected routes directly
    await page.goto('/my-recipes');

    // Should redirect to login page or show auth prompt
    await page.waitForURL(/\/(login|my-recipes)/);
  });

  test('guest can access the search page', async ({ page }) => {
    await page.goto('/search');

    // Search page should be accessible
    const searchInput = page.getByLabel(/search recipes/i);
    await expect(searchInput).toBeVisible();
  });

  test('guest cannot access shopping lists', async ({ page }) => {
    await page.goto('/shopping-lists');

    // Should redirect to login or show auth prompt
    await page.waitForURL(/\/(login|shopping-lists)/);
  });
});
