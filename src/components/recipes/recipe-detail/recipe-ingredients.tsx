'use client';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RecipeDetail } from '@/types/recipe';

interface RecipeIngredientsProps {
  ingredients: RecipeDetail['ingredients'];
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
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
              <li key={ingredient.id}>
                <label className="flex cursor-pointer items-start gap-3">
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
                        — {ingredient.quantity}
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
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
