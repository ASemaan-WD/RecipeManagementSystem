import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  PrismaClient,
  Difficulty,
  Visibility,
  ImageSource,
} from '../src/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// ─── PRISMA CLIENT SETUP ───

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── TYPES ───

interface SeedRecipe {
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  cuisineType: string;
  nutritionData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
  steps: Array<{
    instruction: string;
    duration?: number;
  }>;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  dietaryTags: string[];
}

// ─── RECIPE DATA ───

const recipes: SeedRecipe[] = [
  // ── Italian ──
  {
    name: 'Classic Pasta Carbonara',
    description:
      'A traditional Roman pasta dish made with eggs, Pecorino Romano cheese, guanciale, and black pepper. Rich, creamy, and comforting.',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'Italian',
    nutritionData: { calories: 550, protein: 22, carbs: 65, fat: 24, fiber: 3 },
    ingredients: [
      { name: 'Spaghetti', quantity: '400g' },
      { name: 'Guanciale', quantity: '200g', notes: 'or pancetta' },
      { name: 'Egg yolks', quantity: '6' },
      { name: 'Pecorino Romano', quantity: '100g', notes: 'finely grated' },
      { name: 'Black pepper', quantity: '2 tsp', notes: 'freshly ground' },
      { name: 'Salt', quantity: 'to taste', notes: 'for pasta water' },
    ],
    steps: [
      {
        instruction: 'Bring a large pot of salted water to a boil.',
        duration: 10,
      },
      {
        instruction:
          'Cut guanciale into small strips and cook in a large skillet over medium heat until crispy.',
        duration: 8,
      },
      {
        instruction:
          'In a bowl, whisk together egg yolks, grated Pecorino Romano, and freshly ground black pepper.',
      },
      {
        instruction:
          'Cook spaghetti in the boiling water until al dente, reserving 1 cup of pasta water before draining.',
        duration: 10,
      },
      {
        instruction:
          'Remove the skillet from heat. Add drained pasta to the guanciale and toss to combine.',
      },
      {
        instruction:
          'Pour the egg and cheese mixture over the pasta, tossing quickly. Add pasta water a little at a time to create a creamy sauce.',
      },
      {
        instruction:
          'Serve immediately with extra Pecorino and black pepper on top.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: [],
  },
  {
    name: 'Margherita Pizza',
    description:
      'The classic Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella, basil, and extra virgin olive oil on a thin, crispy crust.',
    prepTime: 30,
    cookTime: 15,
    servings: 4,
    difficulty: Difficulty.HARD,
    cuisineType: 'Italian',
    nutritionData: { calories: 680, protein: 28, carbs: 78, fat: 28, fiber: 4 },
    ingredients: [
      { name: 'Pizza dough', quantity: '500g' },
      { name: 'San Marzano tomatoes', quantity: '400g', notes: 'crushed' },
      { name: 'Fresh mozzarella', quantity: '250g', notes: 'sliced' },
      { name: 'Fresh basil', quantity: '1 bunch' },
      { name: 'Extra virgin olive oil', quantity: '2 tbsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Garlic', quantity: '2 cloves', notes: 'minced' },
    ],
    steps: [
      {
        instruction:
          'Preheat your oven to the highest setting (ideally 250\u00B0C/480\u00B0F) with a pizza stone or baking sheet inside.',
        duration: 30,
      },
      {
        instruction:
          'Prepare the sauce by mixing crushed San Marzano tomatoes with minced garlic, a drizzle of olive oil, and salt.',
      },
      {
        instruction:
          'Stretch the pizza dough into a thin round on a floured surface, about 30cm in diameter.',
      },
      {
        instruction:
          'Spread a thin layer of tomato sauce over the dough, leaving a 2cm border for the crust.',
      },
      {
        instruction:
          'Distribute fresh mozzarella slices evenly over the sauce.',
      },
      {
        instruction:
          'Transfer the pizza to the preheated stone and bake until the crust is golden and the cheese is bubbly.',
        duration: 10,
      },
      {
        instruction:
          'Remove from oven, top with fresh basil leaves, drizzle with olive oil, and serve immediately.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegetarian'],
  },
  {
    name: 'Mushroom Risotto',
    description:
      'A creamy Italian rice dish made with Arborio rice, mixed mushrooms, white wine, Parmesan cheese, and fresh thyme. Slow-stirred to perfection.',
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    difficulty: Difficulty.HARD,
    cuisineType: 'Italian',
    nutritionData: { calories: 480, protein: 14, carbs: 62, fat: 18, fiber: 3 },
    ingredients: [
      { name: 'Arborio rice', quantity: '300g' },
      {
        name: 'Mixed mushrooms',
        quantity: '300g',
        notes: 'sliced (cremini, shiitake, oyster)',
      },
      { name: 'Vegetable broth', quantity: '1L', notes: 'warm' },
      { name: 'White wine', quantity: '120ml', notes: 'dry' },
      { name: 'Onion', quantity: '1 medium', notes: 'finely diced' },
      { name: 'Parmesan cheese', quantity: '80g', notes: 'grated' },
      { name: 'Butter', quantity: '30g' },
      { name: 'Fresh thyme', quantity: '1 tbsp', notes: 'leaves only' },
      { name: 'Extra virgin olive oil', quantity: '2 tbsp' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Black pepper', quantity: 'to taste' },
    ],
    steps: [
      {
        instruction:
          'Heat olive oil and half the butter in a large pan. Saut\u00E9 the onion until translucent.',
        duration: 5,
      },
      {
        instruction:
          'Add sliced mushrooms and thyme. Cook until mushrooms are golden and moisture has evaporated.',
        duration: 7,
      },
      {
        instruction:
          'Add Arborio rice and stir for 2 minutes until the grains are toasted and translucent at the edges.',
        duration: 2,
      },
      {
        instruction: 'Pour in the white wine and stir until fully absorbed.',
        duration: 2,
      },
      {
        instruction:
          'Add warm broth one ladle at a time, stirring frequently. Wait until each addition is absorbed before adding the next.',
        duration: 18,
      },
      {
        instruction:
          'When the rice is creamy and al dente, remove from heat. Stir in remaining butter and grated Parmesan.',
      },
      {
        instruction:
          'Season with salt and pepper. Let rest for 2 minutes, then serve with extra Parmesan on top.',
        duration: 2,
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
  },

  // ── Asian ──
  {
    name: 'Pad Thai',
    description:
      'Thailand\u2019s iconic stir-fried rice noodle dish with shrimp, tofu, bean sprouts, peanuts, and a tangy tamarind sauce. Sweet, sour, and savory.',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: Difficulty.HARD,
    cuisineType: 'Asian',
    nutritionData: { calories: 520, protein: 24, carbs: 68, fat: 18, fiber: 4 },
    ingredients: [
      { name: 'Rice noodles', quantity: '250g', notes: 'flat, medium width' },
      { name: 'Shrimp', quantity: '200g', notes: 'peeled and deveined' },
      { name: 'Firm tofu', quantity: '150g', notes: 'pressed and cubed' },
      { name: 'Bean sprouts', quantity: '150g' },
      { name: 'Eggs', quantity: '2' },
      { name: 'Green onions', quantity: '4', notes: 'cut into 2-inch pieces' },
      { name: 'Roasted peanuts', quantity: '60g', notes: 'roughly chopped' },
      { name: 'Tamarind paste', quantity: '3 tbsp' },
      { name: 'Fish sauce', quantity: '3 tbsp' },
      { name: 'Sugar', quantity: '2 tbsp' },
      { name: 'Lime', quantity: '1', notes: 'cut into wedges' },
      { name: 'Vegetable oil', quantity: '3 tbsp' },
    ],
    steps: [
      {
        instruction:
          'Soak rice noodles in warm water until pliable but still firm, about 20 minutes. Drain well.',
        duration: 20,
      },
      {
        instruction:
          'Mix tamarind paste, fish sauce, and sugar in a small bowl to make the sauce.',
      },
      {
        instruction:
          'Heat oil in a wok over high heat. Stir-fry tofu until golden on all sides. Remove and set aside.',
        duration: 4,
      },
      {
        instruction:
          'In the same wok, cook shrimp until pink, about 2 minutes per side. Remove and set aside.',
        duration: 4,
      },
      {
        instruction:
          'Push everything to the side, crack eggs into the wok, and scramble them.',
        duration: 1,
      },
      {
        instruction:
          'Add drained noodles and the tamarind sauce. Toss everything together over high heat for 2 minutes.',
        duration: 2,
      },
      {
        instruction:
          'Add bean sprouts and green onions. Return tofu and shrimp to the wok. Toss to combine.',
      },
      { instruction: 'Serve topped with chopped peanuts and lime wedges.' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Dairy-Free'],
  },
  {
    name: 'Chicken Stir-Fry',
    description:
      'A quick and colorful stir-fry with tender chicken breast, crisp vegetables, and a savory soy-ginger sauce. Ready in under 30 minutes.',
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    difficulty: Difficulty.EASY,
    cuisineType: 'Asian',
    nutritionData: { calories: 380, protein: 32, carbs: 28, fat: 14, fiber: 5 },
    ingredients: [
      { name: 'Chicken breast', quantity: '500g', notes: 'sliced thin' },
      { name: 'Bell peppers', quantity: '2', notes: 'mixed colors, sliced' },
      { name: 'Broccoli', quantity: '200g', notes: 'cut into florets' },
      { name: 'Carrots', quantity: '2', notes: 'julienned' },
      { name: 'Soy sauce', quantity: '3 tbsp' },
      { name: 'Fresh ginger', quantity: '1 tbsp', notes: 'grated' },
      { name: 'Garlic', quantity: '3 cloves', notes: 'minced' },
      { name: 'Sesame oil', quantity: '1 tbsp' },
      {
        name: 'Cornstarch',
        quantity: '1 tbsp',
        notes: 'dissolved in 2 tbsp water',
      },
      { name: 'Vegetable oil', quantity: '2 tbsp' },
    ],
    steps: [
      {
        instruction:
          'Marinate sliced chicken in 1 tbsp soy sauce and cornstarch slurry for 10 minutes.',
        duration: 10,
      },
      {
        instruction:
          'Heat vegetable oil in a wok over high heat until smoking.',
      },
      {
        instruction:
          'Stir-fry chicken in batches until golden. Remove and set aside.',
        duration: 4,
      },
      {
        instruction:
          'Add broccoli and carrots to the wok. Stir-fry for 3 minutes until crisp-tender.',
        duration: 3,
      },
      {
        instruction:
          'Add bell peppers, garlic, and ginger. Stir-fry for 1 minute.',
        duration: 1,
      },
      {
        instruction:
          'Return chicken to the wok. Add remaining soy sauce and sesame oil. Toss to coat.',
        duration: 2,
      },
      { instruction: 'Serve immediately over steamed rice or noodles.' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Dairy-Free'],
  },
  {
    name: 'Vegetable Sushi Rolls',
    description:
      'Fresh and colorful maki rolls with seasoned sushi rice, nori, avocado, cucumber, and carrots. Perfect for a light, healthy meal.',
    prepTime: 40,
    cookTime: 20,
    servings: 4,
    difficulty: Difficulty.HARD,
    cuisineType: 'Asian',
    nutritionData: { calories: 320, protein: 8, carbs: 58, fat: 8, fiber: 6 },
    ingredients: [
      { name: 'Sushi rice', quantity: '300g' },
      { name: 'Rice vinegar', quantity: '3 tbsp' },
      { name: 'Nori sheets', quantity: '6' },
      { name: 'Avocado', quantity: '2', notes: 'sliced' },
      { name: 'Cucumber', quantity: '1', notes: 'cut into thin strips' },
      { name: 'Carrots', quantity: '2', notes: 'cut into thin strips' },
      { name: 'Soy sauce', quantity: '3 tbsp', notes: 'for serving' },
      { name: 'Pickled ginger', quantity: '30g', notes: 'for serving' },
      { name: 'Wasabi', quantity: '1 tsp', notes: 'for serving' },
      { name: 'Sugar', quantity: '1 tbsp' },
      { name: 'Salt', quantity: '1 tsp' },
    ],
    steps: [
      {
        instruction:
          'Rinse sushi rice until water runs clear. Cook according to package directions.',
        duration: 20,
      },
      {
        instruction:
          'Mix rice vinegar, sugar, and salt. Fold into the cooked rice while still warm and let cool to room temperature.',
      },
      {
        instruction:
          'Place a nori sheet shiny-side down on a bamboo rolling mat.',
      },
      {
        instruction:
          'Spread a thin, even layer of seasoned rice over the nori, leaving a 1cm strip at the top edge.',
      },
      {
        instruction:
          'Arrange avocado, cucumber, and carrot strips in a line across the center of the rice.',
      },
      {
        instruction:
          'Roll tightly using the bamboo mat, applying gentle pressure. Seal the edge with a little water.',
      },
      {
        instruction: 'Slice each roll into 6-8 pieces with a wet, sharp knife.',
      },
      { instruction: 'Serve with soy sauce, pickled ginger, and wasabi.' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegan', 'Dairy-Free'],
  },
  {
    name: 'Miso Ramen',
    description:
      'A hearty Japanese noodle soup with rich miso broth, tender pork, soft-boiled eggs, corn, and green onions. Deeply savory and warming.',
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    difficulty: Difficulty.HARD,
    cuisineType: 'Asian',
    nutritionData: { calories: 620, protein: 35, carbs: 72, fat: 22, fiber: 5 },
    ingredients: [
      { name: 'Ramen noodles', quantity: '400g' },
      { name: 'White miso paste', quantity: '4 tbsp' },
      { name: 'Chicken broth', quantity: '1.5L' },
      { name: 'Pork belly', quantity: '300g', notes: 'sliced thin' },
      { name: 'Eggs', quantity: '4', notes: 'soft-boiled' },
      { name: 'Corn kernels', quantity: '100g' },
      { name: 'Green onions', quantity: '4', notes: 'sliced' },
      { name: 'Garlic', quantity: '3 cloves', notes: 'minced' },
      { name: 'Fresh ginger', quantity: '1 tbsp', notes: 'grated' },
      { name: 'Sesame oil', quantity: '1 tbsp' },
      { name: 'Soy sauce', quantity: '2 tbsp' },
      { name: 'Nori sheets', quantity: '4', notes: 'for garnish' },
    ],
    steps: [
      {
        instruction:
          'Bring eggs to a boil, then cook for exactly 6.5 minutes for a soft-boiled center. Transfer to ice water.',
        duration: 7,
      },
      {
        instruction:
          'Heat sesame oil in a large pot. Saut\u00E9 garlic and ginger until fragrant.',
        duration: 2,
      },
      { instruction: 'Add chicken broth and bring to a simmer.', duration: 5 },
      {
        instruction:
          'Meanwhile, sear pork belly slices in a hot skillet until caramelized on both sides.',
        duration: 8,
      },
      {
        instruction:
          'Dissolve miso paste in a small amount of hot broth, then stir it back into the pot. Add soy sauce.',
        duration: 2,
      },
      {
        instruction:
          'Cook ramen noodles according to package directions. Drain and divide among bowls.',
        duration: 4,
      },
      {
        instruction:
          'Ladle the miso broth over the noodles. Top with sliced pork, halved soft-boiled eggs, corn, green onions, and a piece of nori.',
      },
      { instruction: 'Serve immediately while piping hot.' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Dairy-Free'],
  },

  // ── Mexican ──
  {
    name: 'Chicken Tacos',
    description:
      'Flavorful seasoned chicken in warm corn tortillas topped with fresh salsa, cilantro, diced onion, and a squeeze of lime.',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: Difficulty.EASY,
    cuisineType: 'Mexican',
    nutritionData: { calories: 420, protein: 30, carbs: 38, fat: 16, fiber: 5 },
    ingredients: [
      { name: 'Chicken thighs', quantity: '500g', notes: 'boneless, skinless' },
      { name: 'Corn tortillas', quantity: '12', notes: 'small' },
      { name: 'Lime', quantity: '2', notes: 'cut into wedges' },
      { name: 'Fresh cilantro', quantity: '1/2 cup', notes: 'chopped' },
      { name: 'White onion', quantity: '1', notes: 'finely diced' },
      { name: 'Tomatoes', quantity: '3', notes: 'diced for salsa' },
      { name: 'Cumin', quantity: '1 tsp' },
      { name: 'Chili powder', quantity: '1 tsp' },
      { name: 'Smoked paprika', quantity: '1 tsp' },
      { name: 'Vegetable oil', quantity: '2 tbsp' },
      { name: 'Salt', quantity: '1 tsp' },
    ],
    steps: [
      {
        instruction:
          'Season chicken thighs with cumin, chili powder, smoked paprika, and salt.',
      },
      {
        instruction:
          'Heat oil in a skillet over medium-high heat. Cook chicken for 5-6 minutes per side until cooked through.',
        duration: 12,
      },
      {
        instruction:
          'Let chicken rest for 5 minutes, then slice into thin strips.',
        duration: 5,
      },
      {
        instruction:
          'Make a fresh salsa by combining diced tomatoes, half the diced onion, cilantro, lime juice, and salt.',
      },
      {
        instruction:
          'Warm corn tortillas in a dry skillet or directly over a gas flame for about 30 seconds per side.',
        duration: 3,
      },
      {
        instruction:
          'Assemble tacos: place chicken strips on tortillas, top with salsa, remaining diced onion, and cilantro.',
      },
      { instruction: 'Serve with lime wedges on the side.' },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Gluten-Free', 'Dairy-Free'],
  },
  {
    name: 'Classic Guacamole',
    description:
      'Simple, fresh guacamole made with ripe avocados, lime juice, cilantro, onion, jalape\u00F1o, and tomato. The perfect dip for any occasion.',
    prepTime: 15,
    cookTime: 0,
    servings: 6,
    difficulty: Difficulty.EASY,
    cuisineType: 'Mexican',
    nutritionData: { calories: 160, protein: 2, carbs: 9, fat: 14, fiber: 7 },
    ingredients: [
      { name: 'Avocado', quantity: '4', notes: 'ripe' },
      { name: 'Lime', quantity: '2', notes: 'juiced' },
      { name: 'Fresh cilantro', quantity: '1/4 cup', notes: 'chopped' },
      { name: 'Red onion', quantity: '1/2', notes: 'finely diced' },
      { name: 'Jalape\u00F1o', quantity: '1', notes: 'seeded and minced' },
      { name: 'Tomatoes', quantity: '1', notes: 'seeded and diced' },
      { name: 'Salt', quantity: '1/2 tsp' },
    ],
    steps: [
      {
        instruction:
          'Halve the avocados, remove the pits, and scoop the flesh into a bowl.',
      },
      {
        instruction:
          'Mash the avocado with a fork to your preferred consistency \u2014 chunky or smooth.',
      },
      { instruction: 'Add lime juice and salt. Stir to combine.' },
      {
        instruction:
          'Fold in diced red onion, minced jalape\u00F1o, chopped cilantro, and diced tomato.',
      },
      { instruction: 'Taste and adjust salt and lime juice as needed.' },
      {
        instruction:
          'Serve immediately with tortilla chips or alongside tacos.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Paleo'],
  },

  // ── Middle Eastern ──
  {
    name: 'Crispy Falafel',
    description:
      'Golden, crispy falafel made from dried chickpeas, fresh herbs, and warm spices. Served in pita with tahini sauce and fresh vegetables.',
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'Middle Eastern',
    nutritionData: {
      calories: 380,
      protein: 15,
      carbs: 45,
      fat: 16,
      fiber: 10,
    },
    ingredients: [
      {
        name: 'Dried chickpeas',
        quantity: '250g',
        notes: 'soaked overnight, NOT canned',
      },
      { name: 'Fresh parsley', quantity: '1 cup', notes: 'packed' },
      { name: 'Fresh cilantro', quantity: '1/2 cup', notes: 'packed' },
      { name: 'Onion', quantity: '1 medium', notes: 'roughly chopped' },
      { name: 'Garlic', quantity: '4 cloves' },
      { name: 'Cumin', quantity: '2 tsp' },
      { name: 'Coriander', quantity: '1 tsp', notes: 'ground' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Baking powder', quantity: '1/2 tsp' },
      { name: 'Vegetable oil', quantity: '500ml', notes: 'for frying' },
    ],
    steps: [
      { instruction: 'Drain the soaked chickpeas thoroughly and pat dry.' },
      {
        instruction:
          'Combine chickpeas, parsley, cilantro, onion, and garlic in a food processor. Pulse until finely ground but not a paste.',
      },
      {
        instruction:
          'Add cumin, ground coriander, salt, and baking powder. Pulse to combine.',
      },
      {
        instruction:
          'Transfer to a bowl, cover, and refrigerate for at least 30 minutes to firm up.',
        duration: 30,
      },
      {
        instruction:
          'Shape the mixture into small patties or balls, about 3cm in diameter.',
      },
      {
        instruction:
          'Heat vegetable oil to 175\u00B0C (350\u00B0F). Fry falafel in batches until deep golden brown, about 3-4 minutes per batch.',
        duration: 15,
      },
      {
        instruction:
          'Drain on paper towels and serve in pita bread with tahini sauce, pickled vegetables, and fresh salad.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegan', 'Dairy-Free', 'Nut-Free'],
  },
  {
    name: 'Classic Hummus',
    description:
      'Silky smooth hummus made with chickpeas, tahini, lemon juice, and garlic. Drizzled with olive oil and sprinkled with paprika.',
    prepTime: 10,
    cookTime: 0,
    servings: 6,
    difficulty: Difficulty.EASY,
    cuisineType: 'Middle Eastern',
    nutritionData: { calories: 180, protein: 8, carbs: 20, fat: 9, fiber: 5 },
    ingredients: [
      {
        name: 'Chickpeas',
        quantity: '400g',
        notes: 'canned, drained and rinsed',
      },
      { name: 'Tahini', quantity: '60g' },
      { name: 'Lemon juice', quantity: '3 tbsp', notes: 'fresh' },
      { name: 'Garlic', quantity: '1 clove' },
      { name: 'Extra virgin olive oil', quantity: '3 tbsp' },
      { name: 'Ice water', quantity: '3 tbsp' },
      { name: 'Salt', quantity: '1/2 tsp' },
      { name: 'Smoked paprika', quantity: '1/2 tsp', notes: 'for garnish' },
    ],
    steps: [
      {
        instruction:
          'Add tahini and lemon juice to a food processor. Process for 1 minute until light and whipped.',
        duration: 1,
      },
      {
        instruction:
          'Add garlic, salt, and 1 tablespoon of olive oil. Process for 30 seconds.',
      },
      {
        instruction:
          'Add chickpeas and process for 1 minute, scraping down the sides.',
        duration: 1,
      },
      {
        instruction:
          'With the processor running, drizzle in ice water. Continue processing for 2-3 minutes until very smooth and creamy.',
        duration: 3,
      },
      { instruction: 'Taste and adjust salt and lemon juice as needed.' },
      {
        instruction:
          'Transfer to a serving bowl. Create a well in the center, drizzle with olive oil, and sprinkle with smoked paprika.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegan', 'Gluten-Free', 'Dairy-Free'],
  },

  // ── American ──
  {
    name: 'Classic Cheeseburger',
    description:
      'A juicy beef patty with melted cheddar, crisp lettuce, ripe tomato, pickles, and special sauce on a toasted brioche bun.',
    prepTime: 15,
    cookTime: 12,
    servings: 4,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'American',
    nutritionData: { calories: 720, protein: 42, carbs: 40, fat: 42, fiber: 2 },
    ingredients: [
      { name: 'Ground beef', quantity: '600g', notes: '80/20 blend' },
      { name: 'Cheddar cheese', quantity: '4 slices' },
      { name: 'Brioche buns', quantity: '4' },
      { name: 'Lettuce', quantity: '4 leaves', notes: 'iceberg' },
      { name: 'Tomatoes', quantity: '1 large', notes: 'sliced' },
      { name: 'Pickles', quantity: '8 slices', notes: 'dill' },
      { name: 'Ketchup', quantity: '2 tbsp' },
      { name: 'Mustard', quantity: '1 tbsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Black pepper', quantity: '1/2 tsp' },
    ],
    steps: [
      {
        instruction:
          'Divide ground beef into 4 equal portions. Shape into patties slightly larger than the buns, making a small indent in the center.',
      },
      { instruction: 'Season both sides generously with salt and pepper.' },
      { instruction: 'Heat a cast iron skillet or grill to high heat.' },
      {
        instruction:
          'Cook patties for 3-4 minutes per side for medium doneness. Add cheese slices in the last minute and cover to melt.',
        duration: 8,
      },
      {
        instruction:
          'Toast the brioche buns cut-side down in the skillet for about 1 minute.',
        duration: 1,
      },
      {
        instruction:
          'Spread ketchup and mustard on the bottom buns. Layer lettuce, tomato slice, the cheeseburger patty, and pickles.',
      },
      {
        instruction:
          'Place top buns and serve immediately with your favorite sides.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Nut-Free'],
  },
  {
    name: 'Mac and Cheese',
    description:
      'Ultra-creamy baked macaroni and cheese with a blend of sharp cheddar, Gruy\u00E8re, and a crispy breadcrumb topping. Pure comfort food.',
    prepTime: 15,
    cookTime: 30,
    servings: 6,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'American',
    nutritionData: { calories: 580, protein: 24, carbs: 52, fat: 32, fiber: 2 },
    ingredients: [
      { name: 'Elbow macaroni', quantity: '400g' },
      { name: 'Sharp cheddar', quantity: '250g', notes: 'shredded' },
      { name: 'Gruy\u00E8re cheese', quantity: '100g', notes: 'shredded' },
      { name: 'Whole milk', quantity: '600ml' },
      { name: 'Butter', quantity: '50g' },
      { name: 'All-purpose flour', quantity: '40g' },
      { name: 'Breadcrumbs', quantity: '60g', notes: 'panko' },
      { name: 'Mustard powder', quantity: '1 tsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Black pepper', quantity: '1/2 tsp' },
    ],
    steps: [
      {
        instruction:
          'Preheat oven to 190\u00B0C (375\u00B0F). Cook macaroni in salted boiling water until just al dente, 1 minute less than package directions. Drain.',
        duration: 10,
      },
      {
        instruction:
          'In a large saucepan, melt butter over medium heat. Whisk in flour and cook for 1 minute to form a roux.',
        duration: 2,
      },
      {
        instruction:
          'Gradually whisk in milk, stirring constantly to prevent lumps. Cook until thickened, about 5 minutes.',
        duration: 5,
      },
      {
        instruction:
          'Remove from heat. Stir in most of the cheddar and Gruy\u00E8re (reserve some for topping), mustard powder, salt, and pepper until melted and smooth.',
      },
      {
        instruction:
          'Fold in the cooked macaroni. Transfer to a greased baking dish.',
      },
      {
        instruction:
          'Top with remaining cheese and breadcrumbs. Dot with small pieces of butter.',
      },
      {
        instruction:
          'Bake until bubbly and golden on top, about 20-25 minutes.',
        duration: 22,
      },
      { instruction: 'Let rest for 5 minutes before serving.', duration: 5 },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegetarian', 'Nut-Free'],
  },

  // ── Indian ──
  {
    name: 'Chicken Tikka Masala',
    description:
      'Tender chunks of marinated chicken in a rich, spiced tomato-cream sauce. One of the most beloved Indian-inspired dishes worldwide.',
    prepTime: 30,
    cookTime: 35,
    servings: 4,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'Indian',
    nutritionData: { calories: 480, protein: 36, carbs: 22, fat: 28, fiber: 4 },
    ingredients: [
      { name: 'Chicken breast', quantity: '600g', notes: 'cut into chunks' },
      { name: 'Plain yogurt', quantity: '150g' },
      { name: 'Crushed tomatoes', quantity: '400g' },
      { name: 'Heavy cream', quantity: '120ml' },
      { name: 'Onion', quantity: '1 large', notes: 'diced' },
      { name: 'Garlic', quantity: '4 cloves', notes: 'minced' },
      { name: 'Fresh ginger', quantity: '1 tbsp', notes: 'grated' },
      { name: 'Garam masala', quantity: '2 tsp' },
      { name: 'Turmeric', quantity: '1 tsp' },
      { name: 'Cumin', quantity: '1 tsp' },
      { name: 'Smoked paprika', quantity: '1 tsp' },
      { name: 'Butter', quantity: '30g' },
      { name: 'Fresh cilantro', quantity: '2 tbsp', notes: 'for garnish' },
      { name: 'Salt', quantity: '1 tsp' },
    ],
    steps: [
      {
        instruction:
          'Marinate chicken chunks in yogurt, 1 tsp garam masala, turmeric, and salt. Refrigerate for at least 30 minutes.',
        duration: 30,
      },
      {
        instruction:
          'Heat butter in a large pan. Cook marinated chicken pieces until charred on the outside. Remove and set aside.',
        duration: 8,
      },
      {
        instruction:
          'In the same pan, saut\u00E9 diced onion until softened. Add garlic and ginger, cook for 1 minute.',
        duration: 6,
      },
      {
        instruction:
          'Add cumin, remaining garam masala, and smoked paprika. Toast spices for 30 seconds.',
      },
      {
        instruction:
          'Pour in crushed tomatoes. Simmer for 15 minutes until the sauce thickens.',
        duration: 15,
      },
      {
        instruction:
          'Stir in heavy cream and return the chicken to the pan. Simmer for 5 more minutes until chicken is cooked through.',
        duration: 5,
      },
      {
        instruction:
          'Garnish with fresh cilantro and serve with basmati rice and warm naan bread.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Gluten-Free', 'Nut-Free'],
  },
  {
    name: 'Red Lentil Dal',
    description:
      'A hearty and nutritious Indian lentil stew seasoned with cumin, turmeric, and garam masala. Creamy, comforting, and packed with protein.',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: Difficulty.EASY,
    cuisineType: 'Indian',
    nutritionData: { calories: 310, protein: 18, carbs: 48, fat: 6, fiber: 12 },
    ingredients: [
      { name: 'Red lentils', quantity: '250g', notes: 'rinsed' },
      { name: 'Onion', quantity: '1 large', notes: 'diced' },
      { name: 'Garlic', quantity: '3 cloves', notes: 'minced' },
      { name: 'Fresh ginger', quantity: '1 tbsp', notes: 'grated' },
      { name: 'Crushed tomatoes', quantity: '200g' },
      { name: 'Coconut milk', quantity: '200ml' },
      { name: 'Cumin', quantity: '1 tsp' },
      { name: 'Turmeric', quantity: '1 tsp' },
      { name: 'Garam masala', quantity: '1 tsp' },
      { name: 'Vegetable oil', quantity: '2 tbsp' },
      { name: 'Fresh cilantro', quantity: '2 tbsp', notes: 'for garnish' },
      { name: 'Salt', quantity: '1 tsp' },
    ],
    steps: [
      {
        instruction:
          'Heat oil in a large pot over medium heat. Saut\u00E9 diced onion until golden, about 5 minutes.',
        duration: 5,
      },
      {
        instruction:
          'Add garlic, ginger, cumin, turmeric, and garam masala. Cook for 1 minute until fragrant.',
        duration: 1,
      },
      {
        instruction:
          'Add rinsed lentils, crushed tomatoes, and 600ml of water. Stir to combine.',
      },
      {
        instruction:
          'Bring to a boil, then reduce heat and simmer for 20 minutes, stirring occasionally, until lentils are completely soft.',
        duration: 20,
      },
      {
        instruction:
          'Stir in coconut milk and salt. Simmer for 5 more minutes.',
        duration: 5,
      },
      {
        instruction:
          'Adjust consistency with water if too thick. Taste and adjust seasoning.',
      },
      {
        instruction: 'Serve over basmati rice, garnished with fresh cilantro.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'],
  },

  // ── French ──
  {
    name: 'Classic Crepes',
    description:
      'Thin, delicate French crepes that can be filled with sweet or savory fillings. This recipe includes a classic Nutella and strawberry option.',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: Difficulty.EASY,
    cuisineType: 'French',
    nutritionData: { calories: 280, protein: 8, carbs: 36, fat: 12, fiber: 1 },
    ingredients: [
      { name: 'All-purpose flour', quantity: '125g' },
      { name: 'Eggs', quantity: '2' },
      { name: 'Whole milk', quantity: '250ml' },
      { name: 'Butter', quantity: '30g', notes: 'melted, plus extra for pan' },
      { name: 'Sugar', quantity: '1 tbsp' },
      { name: 'Salt', quantity: '1/4 tsp' },
      { name: 'Vanilla extract', quantity: '1 tsp' },
      { name: 'Strawberries', quantity: '200g', notes: 'sliced, for filling' },
    ],
    steps: [
      {
        instruction:
          'Whisk together flour, eggs, milk, melted butter, sugar, salt, and vanilla until smooth. The batter should be thin and pourable.',
      },
      {
        instruction:
          'Let the batter rest for at least 15 minutes at room temperature.',
        duration: 15,
      },
      {
        instruction:
          'Heat a non-stick skillet or crepe pan over medium heat. Lightly butter the surface.',
      },
      {
        instruction:
          'Pour about 60ml of batter into the pan, swirling to coat the bottom evenly.',
      },
      {
        instruction:
          'Cook until the edges start to lift and the bottom is lightly golden, about 1-2 minutes.',
        duration: 2,
      },
      {
        instruction:
          'Flip carefully and cook the other side for about 30 seconds.',
        duration: 1,
      },
      {
        instruction:
          'Repeat with remaining batter, stacking crepes on a plate.',
      },
      {
        instruction:
          'Fill with sliced strawberries and your choice of spread. Fold into quarters and serve.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegetarian', 'Nut-Free'],
  },
  {
    name: 'Ratatouille',
    description:
      'A beautiful Proven\u00E7al vegetable stew layered with thin slices of zucchini, eggplant, tomatoes, and bell peppers in an herb-infused tomato sauce.',
    prepTime: 30,
    cookTime: 50,
    servings: 6,
    difficulty: Difficulty.MEDIUM,
    cuisineType: 'French',
    nutritionData: { calories: 180, protein: 4, carbs: 24, fat: 8, fiber: 7 },
    ingredients: [
      {
        name: 'Zucchini',
        quantity: '2 medium',
        notes: 'sliced into thin rounds',
      },
      {
        name: 'Eggplant',
        quantity: '1 medium',
        notes: 'sliced into thin rounds',
      },
      {
        name: 'Tomatoes',
        quantity: '3 medium',
        notes: 'sliced into thin rounds',
      },
      {
        name: 'Yellow squash',
        quantity: '1 medium',
        notes: 'sliced into thin rounds',
      },
      { name: 'Bell peppers', quantity: '1', notes: 'red, diced' },
      { name: 'Onion', quantity: '1 medium', notes: 'diced' },
      { name: 'Crushed tomatoes', quantity: '400g' },
      { name: 'Garlic', quantity: '4 cloves', notes: 'minced' },
      { name: 'Fresh thyme', quantity: '1 tbsp' },
      { name: 'Fresh basil', quantity: '2 tbsp', notes: 'chopped' },
      { name: 'Extra virgin olive oil', quantity: '3 tbsp' },
      { name: 'Salt', quantity: '1 tsp' },
      { name: 'Black pepper', quantity: '1/2 tsp' },
    ],
    steps: [
      { instruction: 'Preheat oven to 190\u00B0C (375\u00B0F).' },
      {
        instruction:
          'Heat 1 tbsp olive oil in an oven-safe skillet. Saut\u00E9 onion, bell pepper, and garlic until soft.',
        duration: 5,
      },
      {
        instruction:
          'Add crushed tomatoes, half the thyme, salt, and pepper. Simmer for 10 minutes to form the base sauce.',
        duration: 10,
      },
      {
        instruction:
          'Arrange alternating slices of zucchini, eggplant, tomato, and yellow squash in a spiral pattern on top of the sauce.',
      },
      {
        instruction:
          'Drizzle remaining olive oil over the vegetables. Sprinkle with remaining thyme, salt, and pepper.',
      },
      { instruction: 'Cover with foil and bake for 30 minutes.', duration: 30 },
      {
        instruction:
          'Remove foil and bake for an additional 15 minutes until vegetables are tender and lightly browned.',
        duration: 15,
      },
      {
        instruction:
          'Garnish with fresh basil and serve as a main dish or side.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: [
      'Vegan',
      'Gluten-Free',
      'Dairy-Free',
      'Nut-Free',
      'Paleo',
      'Low-Carb',
    ],
  },

  // ── Mediterranean ──
  {
    name: 'Greek Salad',
    description:
      'A refreshing Mediterranean salad with crisp cucumbers, juicy tomatoes, Kalamata olives, red onion, and crumbled feta dressed in olive oil and oregano.',
    prepTime: 15,
    cookTime: 0,
    servings: 4,
    difficulty: Difficulty.EASY,
    cuisineType: 'Mediterranean',
    nutritionData: { calories: 220, protein: 8, carbs: 12, fat: 16, fiber: 3 },
    ingredients: [
      { name: 'Cucumber', quantity: '2', notes: 'cut into chunks' },
      { name: 'Tomatoes', quantity: '4 medium', notes: 'cut into wedges' },
      { name: 'Red onion', quantity: '1/2', notes: 'thinly sliced' },
      { name: 'Kalamata olives', quantity: '100g' },
      { name: 'Feta cheese', quantity: '150g', notes: 'block, crumbled' },
      { name: 'Extra virgin olive oil', quantity: '3 tbsp' },
      { name: 'Red wine vinegar', quantity: '1 tbsp' },
      { name: 'Dried oregano', quantity: '1 tsp' },
      { name: 'Salt', quantity: '1/2 tsp' },
      { name: 'Black pepper', quantity: '1/4 tsp' },
    ],
    steps: [
      {
        instruction:
          'Cut cucumbers into thick half-moon slices and tomatoes into wedges. Place in a large bowl.',
      },
      { instruction: 'Add thinly sliced red onion and Kalamata olives.' },
      {
        instruction:
          'Whisk together olive oil, red wine vinegar, oregano, salt, and pepper.',
      },
      { instruction: 'Pour the dressing over the vegetables and toss gently.' },
      {
        instruction:
          'Crumble feta cheese over the top. Do not toss \u2014 feta should stay on top in large pieces.',
      },
      {
        instruction:
          'Serve immediately as a side dish or light meal with crusty bread.',
      },
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop',
        isPrimary: true,
      },
    ],
    dietaryTags: ['Vegetarian', 'Gluten-Free', 'Nut-Free', 'Low-Carb'],
  },
];

// ─── RATING & COMMENT DATA ───

const ratingPatterns: number[][] = [
  [5, 4], // recipe 0: avg 4.5
  [4, 5, 4], // recipe 1: avg 4.3
  [5, 5], // recipe 2: avg 5.0
  [3, 4, 5], // recipe 3: avg 4.0
  [4, 4], // recipe 4: avg 4.0
  [5, 4, 5], // recipe 5: avg 4.7
  [4, 5], // recipe 6: avg 4.5
  [5, 4, 4], // recipe 7: avg 4.3
  [5, 5, 5], // recipe 8: avg 5.0
  [4, 3], // recipe 9: avg 3.5
  [5, 5], // recipe 10: avg 5.0
  [4, 4, 5], // recipe 11: avg 4.3
  [3, 4], // recipe 12: avg 3.5
  [5, 5, 4], // recipe 13: avg 4.7
  [4, 5], // recipe 14: avg 4.5
  [5, 4, 5], // recipe 15: avg 4.7
  [4, 4], // recipe 16: avg 4.0
  [5, 5, 4], // recipe 17: avg 4.7
];

const commentData: string[][] = [
  ['Absolutely delicious! My family loved it.'],
  [
    'Great recipe, though I added a bit more seasoning.',
    'The crust was perfectly crispy!',
  ],
  ['This has become a weekly staple in our house.'],
  [
    'Loved the balance of flavors. Will make again!',
    'Perfect for weeknight dinners.',
  ],
  ['Quick and easy \u2014 just what I needed on a busy night.'],
  [
    'Beautiful presentation! Tasted as good as it looked.',
    'My kids even ate their vegetables!',
  ],
  ['Authentic flavors that remind me of my travels.'],
  [
    'The broth was incredibly flavorful.',
    'Best homemade ramen I have ever made.',
    'Restaurant quality at home!',
  ],
  [
    'So fresh and tasty! Perfect for taco Tuesday.',
    'The salsa recipe alone is worth it.',
  ],
  ['Simple but so good. I could eat this every day.'],
  [
    'Crispy on the outside, perfectly soft inside.',
    'My favorite falafel recipe ever!',
  ],
  ['So smooth and creamy! Better than store-bought.'],
  [
    'Juicy and perfectly cooked.',
    'The special sauce makes all the difference.',
  ],
  [
    'The cheesiest mac and cheese I have ever had!',
    'Kids absolutely devoured it.',
    'That breadcrumb topping is genius.',
  ],
  [
    'Rich and aromatic. Tastes like my favorite Indian restaurant.',
    'The marinade is key!',
  ],
  ['Healthy, hearty, and delicious. Great for meal prep.'],
  [
    'Light, delicate, and perfect for brunch.',
    'My family requests these every weekend.',
  ],
  ['A gorgeous dish that is surprisingly easy.', 'Perfect summer side dish.'],
];

// ─── SEED FUNCTIONS ───

async function seedUsers() {
  console.log('Seeding users...');

  const systemUser = await prisma.user.upsert({
    where: { email: 'system@recipeapp.dev' },
    update: {},
    create: {
      name: 'RecipeApp',
      username: 'recipeapp',
      email: 'system@recipeapp.dev',
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=RA',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Chef',
      username: 'alice_chef',
      email: 'alice@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Baker',
      username: 'bob_baker',
      email: 'bob@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      name: 'Carol Cook',
      username: 'carol_cook',
      email: 'carol@example.com',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
    },
  });

  console.log(`  Created system user: ${systemUser.name}`);
  console.log(
    `  Created test users: ${alice.name}, ${bob.name}, ${carol.name}`
  );

  return { systemUser, testUsers: [alice, bob, carol] };
}

async function seedDietaryTags() {
  console.log('Seeding dietary tags...');

  const tagNames = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Keto',
    'Paleo',
    'Halal',
    'Low-Carb',
  ];

  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.dietaryTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`  Created ${tagNames.length} dietary tags`);
  return tags;
}

async function seedRecipes(
  systemUserId: string,
  dietaryTags: Record<string, { id: string }>
) {
  console.log('Seeding recipes...');

  // Delete existing recipes by the system user for idempotency.
  // Cascade rules handle child records (images, ingredients, steps, dietary tags, ratings, comments).
  await prisma.recipe.deleteMany({
    where: { authorId: systemUserId },
  });
  console.log('  Cleared existing seed recipes');

  const createdRecipes = [];

  for (const [i, recipe] of recipes.entries()) {
    // Upsert ingredients (Ingredient.name is @unique)
    const ingredientRecords = [];
    for (const ing of recipe.ingredients) {
      const record = await prisma.ingredient.upsert({
        where: { name: ing.name },
        update: {},
        create: { name: ing.name },
      });
      ingredientRecords.push({
        id: record.id,
        quantity: ing.quantity,
        notes: ing.notes,
      });
    }

    // Create recipe with nested relations
    const created = await prisma.recipe.create({
      data: {
        name: recipe.name,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisineType: recipe.cuisineType,
        visibility: Visibility.PUBLIC,
        nutritionData: recipe.nutritionData,
        authorId: systemUserId,
        images: {
          create: recipe.images.map((img, idx) => ({
            url: img.url,
            source: ImageSource.URL,
            isPrimary: img.isPrimary,
            order: idx,
          })),
        },
        ingredients: {
          create: ingredientRecords.map((ing, idx) => ({
            ingredientId: ing.id,
            quantity: ing.quantity,
            notes: ing.notes,
            order: idx,
          })),
        },
        steps: {
          create: recipe.steps.map((step, idx) => ({
            stepNumber: idx + 1,
            instruction: step.instruction,
            duration: step.duration,
          })),
        },
        dietaryTags: {
          create: recipe.dietaryTags.map((tagName) => ({
            dietaryTagId: dietaryTags[tagName]!.id,
          })),
        },
      },
    });

    createdRecipes.push(created);
    console.log(`  Created recipe ${i + 1}/${recipes.length}: ${recipe.name}`);
  }

  return createdRecipes;
}

async function seedRatingsAndComments(
  createdRecipes: Array<{ id: string }>,
  testUsers: Array<{ id: string; name: string | null }>
) {
  console.log('Seeding ratings and comments...');

  for (const [i, recipe] of createdRecipes.entries()) {
    const ratings = ratingPatterns[i];
    if (!ratings) continue;

    // Create ratings from test users
    let totalRating = 0;
    for (const [j, value] of ratings.entries()) {
      const user = testUsers[j % testUsers.length]!;
      totalRating += value;

      await prisma.rating.create({
        data: {
          userId: user.id,
          recipeId: recipe.id,
          value,
        },
      });
    }

    // Update denormalized avgRating and ratingCount
    const avgRating = Math.round((totalRating / ratings.length) * 10) / 10;
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { avgRating, ratingCount: ratings.length },
    });

    // Create comments from test users
    const comments = commentData[i];
    if (!comments) continue;
    for (const [j, content] of comments.entries()) {
      const user = testUsers[j % testUsers.length]!;
      await prisma.comment.create({
        data: {
          userId: user.id,
          recipeId: recipe.id,
          content,
        },
      });
    }
  }

  console.log(
    `  Created ratings and comments for ${createdRecipes.length} recipes`
  );
}

// ─── MAIN ───

async function main() {
  console.log('Starting database seed...\n');

  const { systemUser, testUsers } = await seedUsers();
  const dietaryTags = await seedDietaryTags();
  const createdRecipes = await seedRecipes(systemUser.id, dietaryTags);
  await seedRatingsAndComments(createdRecipes, testUsers);

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
