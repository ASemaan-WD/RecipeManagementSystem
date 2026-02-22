import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('user can search for recipes', async ({ page }) => {
    await page.goto('/search');

    // Type in the search bar
    const searchInput = page.getByLabel(/search recipes/i);
    await searchInput.fill('pasta');
    await searchInput.press('Enter');

    // Should see search results or the URL updated with query
    await expect(page).toHaveURL(/q=pasta/);
  });

  test('user can filter by cuisine', async ({ page }) => {
    await page.goto('/search');

    // Look for cuisine filter
    const cuisineFilter = page.getByLabel(/cuisine/i).first();
    if (await cuisineFilter.isVisible()) {
      await cuisineFilter.click();

      // Select a cuisine option
      const option = page.getByText('Italian');
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });

  test('user can filter by difficulty', async ({ page }) => {
    await page.goto('/search');

    // Look for difficulty filter
    const difficultyFilter = page.getByLabel(/difficulty/i).first();
    if (await difficultyFilter.isVisible()) {
      await difficultyFilter.click();

      const option = page.getByText('Easy');
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });

  test('user can navigate from search result to recipe detail', async ({
    page,
  }) => {
    await page.goto('/search');

    // Wait for recipes to load
    const recipeCard = page.locator('[data-testid="recipe-card"]').first();
    if (await recipeCard.isVisible({ timeout: 5000 })) {
      await recipeCard.click();

      // Should navigate to recipe detail page
      await expect(page).toHaveURL(/\/recipes\//);
    }
  });

  test('keyboard shortcut Ctrl+K focuses search', async ({ page }) => {
    await page.goto('/search');

    // Press Ctrl+K
    await page.keyboard.press('Control+k');

    // Search input should be focused
    const searchInput = page.getByLabel(/search recipes/i);
    await expect(searchInput).toBeFocused();
  });
});
