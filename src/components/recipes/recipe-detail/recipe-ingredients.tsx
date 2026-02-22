'use client';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SubstitutionDialog } from '@/components/ai/substitution-dialog';
import { cn } from '@/lib/utils';
import { scaleQuantity } from '@/lib/scaling';
import type { RecipeDetail } from '@/types/recipe';

interface RecipeIngredientsProps {
  ingredients: RecipeDetail['ingredients'];
  recipeName?: string;
  isAuthenticated?: boolean;
  scaleFactor?: number;
}

export function RecipeIngredients({
  ingredients,
  recipeName,
  isAuthenticated = false,
  scaleFactor,
}: RecipeIngredientsProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function handleToggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const sorted = [...ingredients].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Ingredients</h2>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sorted.map((ingredient) => {
            const isChecked = checked.has(ingredient.id);

            return (
              <li key={ingredient.id} className="flex items-start gap-1">
                <label className="flex flex-1 cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(ingredient.id)}
                    className="mt-0.5"
                  />
                  <span
                    className={cn(
                      'text-sm leading-relaxed transition-colors',
                      isChecked && 'text-muted-foreground line-through'
                    )}
                  >
                    <span className="font-medium">{ingredient.name}</span>
                    {ingredient.quantity && (
                      <span className="text-muted-foreground">
                        {' '}
                        —{' '}
                        {scaleFactor && scaleFactor !== 1
                          ? scaleQuantity(ingredient.quantity, scaleFactor)
                          : ingredient.quantity}
                      </span>
                    )}
                    {ingredient.notes && (
                      <span className="text-muted-foreground italic">
                        {' '}
                        ({ingredient.notes})
                      </span>
                    )}
                  </span>
                </label>
                {isAuthenticated && (
                  <SubstitutionDialog
                    ingredientName={ingredient.name}
                    recipeContext={recipeName}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
