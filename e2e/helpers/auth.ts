import type { Page } from '@playwright/test';

/**
 * Login as the test user via the UI login flow.
 * Assumes a test user exists in the database.
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/login');

  // Wait for the login page to load
  await page.waitForSelector('text=Sign In');

  // Click the GitHub sign-in button (or whichever OAuth provider is configured)
  // In a real E2E setup, you'd use session cookie injection or a test-specific auth route
  // For now, we provide a pattern that can be adapted to the actual auth mechanism
  const signInButton = page.getByRole('button', { name: /sign in/i });
  if (await signInButton.isVisible()) {
    await signInButton.click();
  }
}

/**
 * Logout by navigating to a sign-out endpoint.
 */
export async function logout(page: Page) {
  await page.goto('/api/auth/signout');
  await page.waitForLoadState('networkidle');
}

/**
 * Inject a session cookie for direct authentication without UI flow.
 * This is faster and more reliable for E2E tests.
 */
export async function injectTestSession(page: Page) {
  // In a real setup, this would create a valid session token
  // and inject it as a cookie before navigating
  const testSessionToken = process.env.TEST_SESSION_TOKEN;
  if (testSessionToken) {
    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: testSessionToken,
        domain: 'localhost',
        path: '/',
      },
    ]);
  }
}
