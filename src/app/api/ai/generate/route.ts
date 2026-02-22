import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';

import { openai, TEXT_MODEL } from '@/lib/openai';
import { requireAuth } from '@/lib/auth-utils';
import { generationLimiter, checkRateLimit } from '@/lib/rate-limit';
import {
  checkContentLength,
  BODY_LIMITS,
  validateContentType,
} from '@/lib/api-utils';
import { generateRecipeSchema } from '@/lib/validations/ai';
import { formatAIError } from '@/lib/ai-utils';

const SYSTEM_PROMPT = `You are a professional chef and recipe developer. Given a list of ingredients and optional preferences, generate a complete recipe in valid JSON format.

The JSON must match this exact structure:
{
  "name": "Recipe Name",
  "description": "A brief description of the dish",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "cuisineType": "Italian",
  "ingredients": [
    { "name": "ingredient", "quantity": "2 cups", "notes": "optional notes" }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "Step instruction", "duration": 5 }
  ]
}

Rules:
- Use ONLY the ingredients provided (you may add common pantry staples like salt, pepper, oil, water)
- Times should be in minutes
- Difficulty should be EASY, MEDIUM, or HARD
- Duration in steps is optional and in minutes
- Return ONLY valid JSON, no markdown or extra text`;

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.user.id;

  const rateLimitResponse = checkRateLimit(generationLimiter, userId);
  if (rateLimitResponse) return rateLimitResponse;

  const sizeResponse = checkContentLength(request, BODY_LIMITS.AI);
  if (sizeResponse) return sizeResponse;

  const contentTypeError = validateContentType(request);
  if (contentTypeError) return contentTypeError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = generateRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { ingredients, cuisine, dietary, difficulty, servings } = parsed.data;

  let userPrompt = `Create a recipe using these ingredients: ${ingredients.join(', ')}.`;
  if (cuisine) userPrompt += ` Cuisine style: ${cuisine}.`;
  if (dietary) userPrompt += ` Dietary requirements: ${dietary}.`;
  if (difficulty) userPrompt += ` Difficulty level: ${difficulty}.`;
  if (servings) userPrompt += ` Servings: ${servings}.`;

  try {
    const result = streamText({
      model: openai(TEXT_MODEL),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json(
      { error: formatAIError('generate') },
      { status: 500 }
    );
  }
}
