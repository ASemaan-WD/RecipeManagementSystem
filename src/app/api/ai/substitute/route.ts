import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

import { openai, TEXT_MODEL } from '@/lib/openai';
import { requireAuth } from '@/lib/auth-utils';
import { substitutionLimiter, checkRateLimit } from '@/lib/rate-limit';
import { substituteIngredientSchema } from '@/lib/validations/ai';
import { formatAIError, withAIRetry } from '@/lib/ai-utils';
import type { AISubstitutionResponse } from '@/types/ai';

const SYSTEM_PROMPT = `You are a culinary expert specializing in ingredient substitutions. Given an ingredient and optional context, suggest 2-3 alternative substitutions.

Return ONLY valid JSON matching this exact structure:
{
  "substitutions": [
    {
      "name": "Substitute name",
      "ratio": "1:1 ratio or conversion (e.g. '1 cup = 1 cup', '1 egg = 1/4 cup applesauce')",
      "notes": "Brief note about flavor/texture differences or tips"
    }
  ]
}

Rules:
- Provide 2-3 substitutions ordered by closeness to the original
- Consider dietary restrictions if provided
- Consider the recipe context if provided
- Include practical ratio conversions
- Return ONLY valid JSON, no markdown or extra text`;

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.user.id;

  const rateLimitResponse = checkRateLimit(substitutionLimiter, userId);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = substituteIngredientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { ingredient, recipeContext, dietaryRestrictions } = parsed.data;

  let userPrompt = `Find substitutions for: ${ingredient}`;
  if (recipeContext) userPrompt += `\nRecipe context: ${recipeContext}`;
  if (dietaryRestrictions)
    userPrompt += `\nDietary restrictions: ${dietaryRestrictions}`;

  try {
    const result = await withAIRetry(
      async () =>
        generateText({
          model: openai(TEXT_MODEL),
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
        }),
      'substitute'
    );

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]) as AISubstitutionResponse;

    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : formatAIError('substitute');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
