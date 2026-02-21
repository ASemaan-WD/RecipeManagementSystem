'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormProgress } from '@/components/recipes/recipe-form/form-progress';
import { BasicInfoStep } from '@/components/recipes/recipe-form/basic-info-step';
import { IngredientsStep } from '@/components/recipes/recipe-form/ingredients-step';
import { StepsStep } from '@/components/recipes/recipe-form/steps-step';
import { TagsStep } from '@/components/recipes/recipe-form/tags-step';
import { ImagesStep } from '@/components/recipes/recipe-form/images-step';
import { createRecipeSchema } from '@/lib/validations/recipe';
import type { RecipeFormData } from '@/types/recipe';

const STEP_LABELS = [
  'Basic Info',
  'Ingredients',
  'Instructions',
  'Tags',
  'Images',
] as const;

const STEP_FIELDS: Record<number, (keyof RecipeFormData)[]> = {
  0: [
    'name',
    'description',
    'prepTime',
    'cookTime',
    'servings',
    'difficulty',
    'cuisineType',
    'visibility',
  ],
  1: ['ingredients'],
  2: ['steps'],
  3: ['dietaryTagIds'],
  4: ['images'],
} as const;

const DEFAULT_VALUES: RecipeFormData = {
  name: '',
  description: '',
  prepTime: 0,
  cookTime: 0,
  servings: 4,
  difficulty: 'EASY',
  cuisineType: '',
  visibility: 'PRIVATE',
  ingredients: [{ name: '', quantity: '', order: 0 }],
  steps: [{ instruction: '', stepNumber: 1 }],
  dietaryTagIds: [],
  images: [],
};

interface RecipeFormWizardProps {
  mode: 'create' | 'edit';
  recipeId?: string;
  defaultValues?: RecipeFormData;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  isSubmitting?: boolean;
  dietaryTags: { id: string; name: string }[];
}

export function RecipeFormWizard({
  mode,
  recipeId,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  dietaryTags,
}: RecipeFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const totalSteps = STEP_LABELS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  async function handleNext() {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    if (!fieldsToValidate) return;

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) {
      toast.error('Please fix the errors before continuing.');
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function handlePrevious() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleFormSubmit(data: RecipeFormData) {
    await onSubmit(data);
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        <FormProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={[...STEP_LABELS]}
        />

        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          {currentStep === 0 && <BasicInfoStep />}
          {currentStep === 1 && <IngredientsStep />}
          {currentStep === 2 && <StepsStep />}
          {currentStep === 3 && <TagsStep dietaryTags={dietaryTags} />}
          {currentStep === 4 && <ImagesStep recipeId={recipeId} />}

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep || isSubmitting}
            >
              Previous
            </Button>

            {isLastStep ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {mode === 'create' ? 'Create Recipe' : 'Save Changes'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
