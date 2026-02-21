import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, canViewRecipe } from '@/lib/auth-utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const session = authResult;

  const viewResult = await canViewRecipe(id);
  if (viewResult instanceof NextResponse) return viewResult;

  // Fetch the source recipe with all relations
  const source = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
      steps: true,
      images: true,
      dietaryTags: true,
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  const newRecipeId = await prisma.$transaction(async (tx) => {
    // 1. Create the duplicated recipe
    const duplicated = await tx.recipe.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        prepTime: source.prepTime,
        cookTime: source.cookTime,
        servings: source.servings,
        difficulty: source.difficulty,
        cuisineType: source.cuisineType,
        visibility: 'PRIVATE',
        nutritionData: source.nutritionData ?? undefined,
        authorId: session.user.id,
      },
      select: { id: true },
    });

    // 2. Copy ingredients (reference same global Ingredient records)
    if (source.ingredients.length > 0) {
      for (const ri of source.ingredients) {
        await tx.recipeIngredient.create({
          data: {
            recipeId: duplicated.id,
            ingredientId: ri.ingredientId,
            quantity: ri.quantity,
            notes: ri.notes,
            order: ri.order,
          },
        });
      }
    }

    // 3. Copy steps
    if (source.steps.length > 0) {
      await tx.recipeStep.createMany({
        data: source.steps.map((s) => ({
          recipeId: duplicated.id,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          duration: s.duration,
        })),
      });
    }

    // 4. Copy images (reference copy — same URLs)
    if (source.images.length > 0) {
      await tx.recipeImage.createMany({
        data: source.images.map((img) => ({
          recipeId: duplicated.id,
          url: img.url,
          source: img.source,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      });
    }

    // 5. Copy dietary tag associations
    if (source.dietaryTags.length > 0) {
      await tx.recipeDietaryTag.createMany({
        data: source.dietaryTags.map((dt) => ({
          recipeId: duplicated.id,
          dietaryTagId: dt.dietaryTagId,
        })),
      });
    }

    return duplicated.id;
  });

  // Re-fetch the complete duplicated recipe
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: newRecipeId },
    select: {
      id: true,
      name: true,
      description: true,
      prepTime: true,
      cookTime: true,
      servings: true,
      difficulty: true,
      cuisineType: true,
      visibility: true,
      avgRating: true,
      ratingCount: true,
      nutritionData: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
      images: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          url: true,
          source: true,
          isPrimary: true,
          order: true,
        },
      },
      ingredients: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          quantity: true,
          notes: true,
          order: true,
          ingredient: { select: { name: true } },
        },
      },
      steps: {
        orderBy: { stepNumber: 'asc' },
        select: {
          id: true,
          stepNumber: true,
          instruction: true,
          duration: true,
        },
      },
      dietaryTags: {
        select: {
          dietaryTag: { select: { id: true, name: true } },
        },
      },
    },
  });

  const primaryImage =
    recipe.images.find((img) => img.isPrimary) ?? recipe.images[0] ?? null;

  return NextResponse.json(
    {
      ...recipe,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      primaryImage: primaryImage ? { url: primaryImage.url } : null,
      dietaryTags: recipe.dietaryTags.map((dt) => dt.dietaryTag),
      ingredients: recipe.ingredients.map((ri) => ({
        id: ri.id,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        notes: ri.notes,
        order: ri.order,
      })),
    },
    { status: 201 }
  );
}
