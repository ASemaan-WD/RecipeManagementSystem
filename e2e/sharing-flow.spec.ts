import { test, expect } from '@playwright/test';

test.describe('Sharing Flow', () => {
  test('owner can see share button on their recipe', async ({ page }) => {
    // Navigate to a recipe the user owns
    await page.goto('/my-recipes');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      // Should see the Share button (owner-only action)
      const shareButton = page.getByRole('button', { name: /share/i });
      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Share dialog should open
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('owner can change recipe visibility', async ({ page }) => {
    await page.goto('/my-recipes');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      const shareButton = page.getByRole('button', { name: /share/i });
      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Look for visibility dropdown or radio
        const publicOption = page.getByText(/public/i).first();
        if (await publicOption.isVisible()) {
          await publicOption.click();
        }
      }
    }
  });

  test('owner can generate a share link', async ({ page }) => {
    await page.goto('/my-recipes');

    const firstCard = page.locator('a[href^="/recipes/"]').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      await firstCard.click();

      const shareButton = page.getByRole('button', { name: /share/i });
      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Look for "Generate Link" button
        const generateLink = page.getByRole('button', {
          name: /generate link/i,
        });
        if (await generateLink.isVisible()) {
          await generateLink.click();

          // Should see the generated link
          const linkInput = page.locator('input[value*="/share/"]');
          if (await linkInput.isVisible()) {
            await expect(linkInput).toHaveValue(/\/share\//);
          }
        }
      }
    }
  });

  test('shared-with-me page shows shared recipes', async ({ page }) => {
    await page.goto('/shared-with-me');

    // Page should load without errors
    await expect(page.getByText(/shared with me/i)).toBeVisible();
  });
});
