import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { prisma } from '@/lib/db';
import { requireRecipeOwner } from '@/lib/auth-utils';
import { imageLimiter, checkRateLimit } from '@/lib/rate-limit';
import { uploadImageFromUrl } from '@/lib/cloudinary';
import { formatAIError, withAIRetry } from '@/lib/ai-utils';

interface RouteParams {
  params: Promise<{ recipeId: string }>;
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { recipeId } = await params;

  const ownerResult = await requireRecipeOwner(recipeId);
  if (ownerResult instanceof NextResponse) return ownerResult;

  const userId = ownerResult.session.user.id;

  const rateLimitResponse = checkRateLimit(imageLimiter, userId);
  if (rateLimitResponse) return rateLimitResponse;

  // Fetch recipe name and description for the prompt
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      name: true,
      description: true,
      images: { select: { id: true } },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const dallePrompt =
    `Professional food photography of ${recipe.name}${recipe.description ? `, ${recipe.description}` : ''}, appetizing, well-plated, natural lighting, top-down angle, high resolution`.slice(
      0,
      1000
    );

  try {
    const result = await withAIRetry(async () => {
      const response = await openaiClient.images.generate({
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const generatedUrl = response.data?.[0]?.url;
      if (!generatedUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      return generatedUrl;
    }, 'image');

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadImageFromUrl(result);

    // Save to database
    const isFirstImage = recipe.images.length === 0;
    const image = await prisma.recipeImage.create({
      data: {
        recipeId,
        url: cloudinaryUrl,
        source: 'AI_GENERATED',
        isPrimary: isFirstImage,
        order: recipe.images.length,
      },
    });

    return NextResponse.json(
      { url: cloudinaryUrl, imageId: image.id },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : formatAIError('image');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
