import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { EditRecipeForm } from '@/app/(main)/recipes/[id]/edit/edit-recipe-form';
import type { RecipeFormData } from '@/types/recipe';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { name: true },
  });

  return {
    title: recipe ? `Edit ${recipe.name}` : 'Edit Recipe',
  };
}

export default async function EditRecipePage({ params }: PageProps) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  const rawRecipe = await prisma.recipe.findUnique({
    where: { id },
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
      authorId: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
      images: {
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          url: true,
          source: true,
          isPrimary: true,
          order: true,
        },
      },
      ingredients: {
        orderBy: { order: 'asc' as const },
        select: {
          id: true,
          quantity: true,
          notes: true,
          order: true,
          ingredient: { select: { name: true } },
        },
      },
      steps: {
        orderBy: { stepNumber: 'asc' as const },
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

  if (!rawRecipe || rawRecipe.authorId !== currentUser.id) {
    notFound();
  }

  // Transform RecipeDetail → RecipeFormData for the form
  const defaultValues: RecipeFormData = {
    name: rawRecipe.name,
    description: rawRecipe.description ?? '',
    prepTime: rawRecipe.prepTime ?? 0,
    cookTime: rawRecipe.cookTime ?? 0,
    servings: rawRecipe.servings ?? 4,
    difficulty: rawRecipe.difficulty ?? 'EASY',
    cuisineType: rawRecipe.cuisineType ?? '',
    visibility: rawRecipe.visibility,
    ingredients: rawRecipe.ingredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity ?? '',
      notes: ri.notes ?? undefined,
      order: ri.order,
    })),
    steps: rawRecipe.steps.map((s) => ({
      instruction: s.instruction,
      duration: s.duration ?? undefined,
      stepNumber: s.stepNumber,
    })),
    images: rawRecipe.images.map((img) => ({
      url: img.url,
      source: img.source,
      isPrimary: img.isPrimary,
      order: img.order,
    })),
    dietaryTagIds: rawRecipe.dietaryTags.map((dt) => dt.dietaryTag.id),
  };

  const dietaryTags = await prisma.dietaryTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recipes/${id}`}>
            <ChevronLeft className="size-5" />
            <span className="sr-only">Back to Recipe</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Recipe</h1>
      </div>

      <EditRecipeForm
        recipeId={id}
        defaultValues={defaultValues}
        dietaryTags={dietaryTags}
      />
    </div>
  );
}
