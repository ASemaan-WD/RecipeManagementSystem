'use client';

import { useRouter } from 'next/navigation';

import { RecipeFormWizard } from '@/components/recipes/recipe-form/recipe-form-wizard';
import { useUpdateRecipe } from '@/hooks/use-recipes';
import type { RecipeFormData } from '@/types/recipe';

interface EditRecipeFormProps {
  recipeId: string;
  defaultValues: RecipeFormData;
  dietaryTags: { id: string; name: string }[];
}

export function EditRecipeForm({
  recipeId,
  defaultValues,
  dietaryTags,
}: EditRecipeFormProps) {
  const router = useRouter();
  const updateRecipe = useUpdateRecipe();

  async function handleSubmit(data: RecipeFormData) {
    await updateRecipe.mutateAsync({ id: recipeId, data });
    router.push(`/recipes/${recipeId}`);
  }

  return (
    <RecipeFormWizard
      mode="edit"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={updateRecipe.isPending}
      dietaryTags={dietaryTags}
    />
  );
}
