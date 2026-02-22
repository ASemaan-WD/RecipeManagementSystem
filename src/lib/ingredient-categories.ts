/**
 * Static mapping of ingredient keywords to shopping categories.
 * Used by the shopping list feature to auto-categorize ingredients.
 */

const INGREDIENT_CATEGORY_MAP: Record<string, string> = {
  // Produce
  tomato: 'Produce',
  onion: 'Produce',
  garlic: 'Produce',
  potato: 'Produce',
  carrot: 'Produce',
  celery: 'Produce',
  lettuce: 'Produce',
  spinach: 'Produce',
  kale: 'Produce',
  pepper: 'Produce',
  mushroom: 'Produce',
  zucchini: 'Produce',
  broccoli: 'Produce',
  cauliflower: 'Produce',
  cucumber: 'Produce',
  avocado: 'Produce',
  lemon: 'Produce',
  lime: 'Produce',
  orange: 'Produce',
  apple: 'Produce',
  banana: 'Produce',
  berry: 'Produce',
  herb: 'Produce',
  basil: 'Produce',
  cilantro: 'Produce',
  parsley: 'Produce',
  mint: 'Produce',
  ginger: 'Produce',
  cabbage: 'Produce',
  corn: 'Produce',
  pea: 'Produce',
  bean: 'Produce',
  scallion: 'Produce',
  shallot: 'Produce',

  // Dairy & Eggs
  milk: 'Dairy & Eggs',
  cheese: 'Dairy & Eggs',
  butter: 'Dairy & Eggs',
  cream: 'Dairy & Eggs',
  yogurt: 'Dairy & Eggs',
  egg: 'Dairy & Eggs',
  'sour cream': 'Dairy & Eggs',
  mozzarella: 'Dairy & Eggs',
  parmesan: 'Dairy & Eggs',
  cheddar: 'Dairy & Eggs',
  ricotta: 'Dairy & Eggs',

  // Proteins
  chicken: 'Proteins',
  beef: 'Proteins',
  pork: 'Proteins',
  turkey: 'Proteins',
  lamb: 'Proteins',
  fish: 'Proteins',
  salmon: 'Proteins',
  shrimp: 'Proteins',
  tuna: 'Proteins',
  bacon: 'Proteins',
  sausage: 'Proteins',
  tofu: 'Proteins',
  tempeh: 'Proteins',

  // Pantry
  rice: 'Pantry',
  pasta: 'Pantry',
  noodle: 'Pantry',
  bread: 'Pantry',
  tortilla: 'Pantry',
  broth: 'Pantry',
  stock: 'Pantry',
  'tomato sauce': 'Pantry',
  'tomato paste': 'Pantry',
  'soy sauce': 'Pantry',
  vinegar: 'Pantry',
  canned: 'Pantry',
  dried: 'Pantry',
  lentil: 'Pantry',
  chickpea: 'Pantry',
  oat: 'Pantry',
  cereal: 'Pantry',
  cracker: 'Pantry',
  breadcrumb: 'Pantry',
  'coconut milk': 'Pantry',

  // Spices & Seasonings
  salt: 'Spices & Seasonings',
  'pepper flake': 'Spices & Seasonings',
  cumin: 'Spices & Seasonings',
  paprika: 'Spices & Seasonings',
  cinnamon: 'Spices & Seasonings',
  nutmeg: 'Spices & Seasonings',
  oregano: 'Spices & Seasonings',
  thyme: 'Spices & Seasonings',
  rosemary: 'Spices & Seasonings',
  cayenne: 'Spices & Seasonings',
  turmeric: 'Spices & Seasonings',
  chili: 'Spices & Seasonings',
  clove: 'Spices & Seasonings',
  'bay leaf': 'Spices & Seasonings',
  curry: 'Spices & Seasonings',

  // Baking
  flour: 'Baking',
  sugar: 'Baking',
  'brown sugar': 'Baking',
  'powdered sugar': 'Baking',
  'baking soda': 'Baking',
  'baking powder': 'Baking',
  yeast: 'Baking',
  vanilla: 'Baking',
  cocoa: 'Baking',
  chocolate: 'Baking',
  cornstarch: 'Baking',

  // Oils & Condiments
  oil: 'Oils & Condiments',
  'olive oil': 'Oils & Condiments',
  'vegetable oil': 'Oils & Condiments',
  'sesame oil': 'Oils & Condiments',
  mayonnaise: 'Oils & Condiments',
  mustard: 'Oils & Condiments',
  ketchup: 'Oils & Condiments',
  honey: 'Oils & Condiments',
  'maple syrup': 'Oils & Condiments',
  'hot sauce': 'Oils & Condiments',
  worcestershire: 'Oils & Condiments',
};

/**
 * Categorize an ingredient name into a shopping category.
 * Uses keyword matching against a static mapping.
 * Returns "Other" if no match is found.
 */
export function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase().trim();

  // Check exact match first, then partial match
  if (INGREDIENT_CATEGORY_MAP[lower]) {
    return INGREDIENT_CATEGORY_MAP[lower];
  }

  for (const [keyword, category] of Object.entries(INGREDIENT_CATEGORY_MAP)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }

  return 'Other';
}
