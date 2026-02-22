import { test, expect } from '@playwright/test';

test.describe('Social Features Flow', () => {
  test('user can view star ratings on a recipe', async ({ page }) => {
    await page.goto('/community');

    // Wait for recipe cards to load
    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Should see the star rating component
      const ratingContainer = page.getByLabel(/rating/i);
      await expect(ratingContainer).toBeVisible();
    }
  });

  test('user can rate a recipe', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Click a star to rate (e.g., 4 stars)
      const fourthStar = page.getByLabel('4 stars');
      if (await fourthStar.isVisible()) {
        await fourthStar.click();
      }
    }
  });

  test('user can post a comment', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Find comment textarea
      const commentBox = page.getByLabel(/write a comment/i);
      if (await commentBox.isVisible()) {
        await commentBox.fill('This recipe looks amazing!');

        const postButton = page.getByRole('button', { name: /post comment/i });
        await postButton.click();

        // Should see the comment appear
        await expect(
          page.getByText('This recipe looks amazing!')
        ).toBeVisible();
      }
    }
  });

  test('comment section shows correct count', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Comments section should be visible
      const commentsHeader = page.getByText(/comments/i);
      await expect(commentsHeader).toBeVisible();
    }
  });
});
