import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

import { prisma } from '@/lib/db';
import { openai, TEXT_MODEL } from '@/lib/openai';
import { requireAuth } from '@/lib/auth-utils';
import { nutritionLimiter, checkRateLimit } from '@/lib/rate-limit';
import { formatAIError, withAIRetry } from '@/lib/ai-utils';
import type { AINutritionData } from '@/types/ai';

interface RouteParams {
  params: Promise<{ recipeId: string }>;
}

const SYSTEM_PROMPT = `You are a nutrition expert. Given a recipe's ingredients with quantities, estimate the nutritional content per serving.

Return ONLY valid JSON matching this exact structure:
{
  "calories": 350,
  "protein": 25,
  "carbohydrates": 40,
  "fat": 12,
  "fiber": 5,
  "sugar": 8,
  "sodium": 600,
  "servingSize": "1 plate (approximately 350g)"
}

Rules:
- All numeric values are per single serving
- Calories in kcal, protein/carbs/fat/fiber/sugar in grams, sodium in mg
- Use null for values that cannot be reasonably estimated
- servingSize should describe one serving in practical terms
- Return ONLY valid JSON, no markdown or extra text`;

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.user.id;
  const { recipeId } = await params;

  // Fetch recipe with ingredients
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      name: true,
      servings: true,
      authorId: true,
      nutritionData: true,
      visibility: true,
      ingredients: {
        orderBy: { order: 'asc' as const },
        select: {
          quantity: true,
          ingredient: { select: { name: true } },
        },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // Check access: must be owner or recipe is PUBLIC/shared
  const isOwner = recipe.authorId === userId;
  if (!isOwner && recipe.visibility === 'PRIVATE') {
    const share = await prisma.recipeShare.findUnique({
      where: {
        recipeId_userId: { recipeId: recipe.id, userId },
      },
    });
    if (!share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Return cached nutrition data if available
  if (recipe.nutritionData) {
    return NextResponse.json({
      nutritionData: recipe.nutritionData as unknown as AINutritionData,
      cached: true,
    });
  }

  // Rate limit only when an AI call is needed
  const rateLimitResponse = checkRateLimit(nutritionLimiter, userId);
  if (rateLimitResponse) return rateLimitResponse;

  if (recipe.ingredients.length === 0) {
    return NextResponse.json(
      { error: 'Recipe has no ingredients to estimate nutrition for' },
      { status: 400 }
    );
  }

  const ingredientsList = recipe.ingredients
    .map((ri) => `${ri.quantity ?? ''} ${ri.ingredient.name}`.trim())
    .join('\n- ');

  const userPrompt = `Estimate nutrition per serving for "${recipe.name}" (${recipe.servings} servings total).

Ingredients:
- ${ingredientsList}`;

  try {
    const result = await withAIRetry(
      async () =>
        generateText({
          model: openai(TEXT_MODEL),
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
        }),
      'nutrition'
    );

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const nutritionData = JSON.parse(jsonMatch[0]) as AINutritionData;

    // Cache result in the recipe — JSON.parse produces a Prisma-compatible InputJsonValue
    await prisma.recipe.update({
      where: { id: recipeId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { nutritionData: nutritionData as any },
    });

    return NextResponse.json({ nutritionData, cached: false });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : formatAIError('nutrition');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
