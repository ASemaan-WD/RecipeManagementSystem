'use client';

import { useRouter } from 'next/navigation';

import { RecipeFormWizard } from '@/components/recipes/recipe-form/recipe-form-wizard';
import { useCreateRecipe } from '@/hooks/use-recipes';
import type { RecipeFormData } from '@/types/recipe';

interface CreateRecipeFormProps {
  dietaryTags: { id: string; name: string }[];
}

export function CreateRecipeForm({ dietaryTags }: CreateRecipeFormProps) {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  async function handleSubmit(data: RecipeFormData) {
    const result = await createRecipe.mutateAsync(data);
    router.push(`/recipes/${result.id}`);
  }

  return (
    <RecipeFormWizard
      mode="create"
      onSubmit={handleSubmit}
      isSubmitting={createRecipe.isPending}
      dietaryTags={dietaryTags}
    />
  );
}
