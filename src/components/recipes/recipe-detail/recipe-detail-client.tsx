'use client';

import { useState } from 'react';

import dynamic from 'next/dynamic';
import { ChefHat } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ServingAdjuster } from '@/components/recipes/serving-adjuster';
import { RecipeIngredients } from '@/components/recipes/recipe-detail/recipe-ingredients';
import { RecipeSteps } from '@/components/recipes/recipe-detail/recipe-steps';
import type { RecipeDetail } from '@/types/recipe';

const CookingMode = dynamic(
  () => import('@/components/recipes/cooking-mode').then((m) => m.CookingMode),
  { ssr: false }
);

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
  isAuthenticated: boolean;
}

export function RecipeDetailClient({
  recipe,
  isAuthenticated,
}: RecipeDetailClientProps) {
  const [scaleFactor, setScaleFactor] = useState(1);
  const [cookingModeOpen, setCookingModeOpen] = useState(false);

  function handleOpenCookingMode() {
    setCookingModeOpen(true);
  }

  function handleCloseCookingMode() {
    setCookingModeOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {recipe.servings && (
          <ServingAdjuster
            originalServings={recipe.servings}
            onScaleFactorChange={setScaleFactor}
          />
        )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleOpenCookingMode}
          aria-label="Start cooking mode"
        >
          <ChefHat className="size-4" />
          Cooking Mode
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecipeIngredients
            ingredients={recipe.ingredients}
            recipeName={recipe.name}
            isAuthenticated={isAuthenticated}
            scaleFactor={scaleFactor}
          />
        </div>
        <div className="lg:col-span-2">
          <RecipeSteps steps={recipe.steps} />
        </div>
      </div>

      {cookingModeOpen && (
        <CookingMode
          steps={recipe.steps}
          ingredients={recipe.ingredients}
          recipeName={recipe.name}
          scaleFactor={scaleFactor}
          onClose={handleCloseCookingMode}
        />
      )}
    </>
  );
}
