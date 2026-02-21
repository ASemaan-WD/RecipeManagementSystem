'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import type { RecipeFormData } from '@/types/recipe';

export function IngredientsStep() {
  const form = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  function handleAdd() {
    append({ name: '', quantity: '', order: fields.length });
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) return;
    remove(index);
    // Re-set order values after removal
    const remaining = form.getValues('ingredients');
    remaining.forEach((_, i) => {
      form.setValue(`ingredients.${i}.order`, i);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Ingredients</h3>
        <p className="text-muted-foreground text-sm">
          Add at least one ingredient for your recipe.
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 rounded-lg border p-4"
          >
            <span className="text-muted-foreground mt-2 text-sm font-medium">
              {index + 1}.
            </span>

            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name={`ingredients.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">
                      Ingredient {index + 1} name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ingredient name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`ingredients.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">
                      Ingredient {index + 1} quantity
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2 cups" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`ingredients.${index}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">
                      Ingredient {index + 1} notes
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Notes (optional)"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive mt-0.5 shrink-0"
              onClick={() => handleRemove(index)}
              disabled={fields.length <= 1}
              aria-label={`Remove ingredient ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus className="size-4" />
        Add Ingredient
      </Button>

      {form.formState.errors.ingredients?.root && (
        <p className="text-destructive text-sm">
          {form.formState.errors.ingredients.root.message}
        </p>
      )}
    </div>
  );
}
