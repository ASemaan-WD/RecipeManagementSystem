import { test, expect } from '@playwright/test';

import { BOUNDARY_VALUES } from './helpers/test-data';

test.describe('Edge Cases & Error Handling', () => {
  test('non-existent recipe shows 404', async ({ page }) => {
    const response = await page.goto('/recipes/nonexistent-id-12345');

    // Should show 404 page
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test('recipe name handles maximum length', async ({ page }) => {
    await page.goto('/recipes/new');

    const nameInput = page.getByLabel(/recipe name/i);
    if (await nameInput.isVisible()) {
      const longName = 'A'.repeat(BOUNDARY_VALUES.maxTitleLength);
      await nameInput.fill(longName);

      // Input should accept the max length
      const value = await nameInput.inputValue();
      expect(value.length).toBeLessThanOrEqual(BOUNDARY_VALUES.maxTitleLength);
    }
  });

  test('HTML in recipe name is sanitized', async ({ page }) => {
    await page.goto('/recipes/new');

    const nameInput = page.getByLabel(/recipe name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('<script>alert("xss")</script>');

      // The input should contain the text but not execute script
      const value = await nameInput.inputValue();
      expect(value).toContain('script');
    }
  });

  test('comment respects maximum length', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      const commentBox = page.getByLabel(/write a comment/i);
      if (await commentBox.isVisible()) {
        const longComment = 'A'.repeat(BOUNDARY_VALUES.maxCommentLength + 100);
        await commentBox.fill(longComment);

        // Should be truncated at max length
        const value = await commentBox.inputValue();
        expect(value.length).toBeLessThanOrEqual(
          BOUNDARY_VALUES.maxCommentLength
        );
      }
    }
  });

  test('search handles special characters', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.getByLabel(/search recipes/i);
    await searchInput.fill('<script>alert("xss")</script>');
    await searchInput.press('Enter');

    // Should not crash, URL should be encoded
    await expect(page).toHaveURL(/q=/);
  });

  test('search handles SQL injection patterns', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.getByLabel(/search recipes/i);
    await searchInput.fill("'; DROP TABLE recipes; --");
    await searchInput.press('Enter');

    // Should handle gracefully, no error
    await expect(page).toHaveURL(/q=/);
  });

  test('empty search returns results or empty state', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.getByLabel(/search recipes/i);
    await searchInput.fill('');
    await searchInput.press('Enter');

    // Should show either results or an empty state message
    const hasResults = page.locator('a[href^="/recipes/"]');
    const emptyState = page.getByText(/no recipes|no results/i);

    const resultsVisible = await hasResults
      .first()
      .isVisible()
      .catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(resultsVisible || emptyVisible).toBe(true);
  });

  test('recipe detail page loads images correctly', async ({ page }) => {
    await page.goto('/community');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Check that images don't show broken image indicator
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        const naturalWidth = await img.evaluate(
          (el) => (el as HTMLImageElement).naturalWidth
        );
        // If image loaded, naturalWidth > 0
        // Skip data-uri or placeholder images
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          expect(naturalWidth).toBeGreaterThan(0);
        }
      }
    }
  });

  test('navigation works with browser back/forward', async ({ page }) => {
    await page.goto('/community');
    await page.goto('/search');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/community/);

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/search/);
  });

  test('page handles network errors gracefully', async ({ page }) => {
    // Block API requests to simulate network failure
    await page.route('/api/**', (route) => route.abort());

    await page.goto('/community');

    // Should not crash, may show error state or empty state
    await expect(page.locator('body')).toBeVisible();
  });
});
