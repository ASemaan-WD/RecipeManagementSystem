/**
 * Test data constants for E2E tests.
 * These values should match seed data or be created during test setup.
 */

export const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
} as const;

export const TEST_RECIPE = {
  name: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish',
  cuisineType: 'Italian',
  difficulty: 'MEDIUM',
  prepTime: 15,
  cookTime: 20,
  servings: 4,
} as const;

export const TEST_INGREDIENTS = [
  { name: 'Spaghetti', quantity: '400g' },
  { name: 'Eggs', quantity: '4' },
  { name: 'Pecorino Romano', quantity: '100g' },
  { name: 'Guanciale', quantity: '200g' },
  { name: 'Black pepper', quantity: 'to taste' },
] as const;

export const TEST_STEPS = [
  { instruction: 'Bring a large pot of salted water to a boil.', duration: 10 },
  { instruction: 'Cook the spaghetti according to package directions.' },
  { instruction: 'Meanwhile, cut the guanciale into small pieces.' },
  { instruction: 'Cook guanciale in a pan until crispy.', duration: 8 },
  { instruction: 'Mix eggs and pecorino in a bowl.' },
  { instruction: 'Drain pasta, toss with guanciale and egg mixture.' },
] as const;

/**
 * Maximum boundary values for testing edge cases.
 */
export const BOUNDARY_VALUES = {
  maxTitleLength: 200,
  maxDescriptionLength: 1000,
  maxCommentLength: 1000,
  maxIngredients: 30,
  maxSteps: 20,
} as const;
