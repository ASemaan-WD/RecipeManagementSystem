'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import type { RecipeFormData } from '@/types/recipe';

export function StepsStep() {
  const form = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  function handleAdd() {
    append({ instruction: '', stepNumber: fields.length + 1 });
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) return;
    remove(index);
    // Re-number steps after removal
    const remaining = form.getValues('steps');
    remaining.forEach((_, i) => {
      form.setValue(`steps.${i}.stepNumber`, i + 1);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Instructions</h3>
        <p className="text-muted-foreground text-sm">
          Add at least one step to describe how to prepare your recipe.
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 rounded-lg border p-4"
          >
            <div className="bg-primary text-primary-foreground mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium">
              {index + 1}
            </div>

            <div className="flex-1 space-y-3">
              <FormField
                control={form.control}
                name={`steps.${index}.instruction`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">
                      Step {index + 1} instruction
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this step..."
                        className="min-h-[80px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`steps.${index}.duration`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs">
                      Duration (minutes, optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g., 10"
                        className="w-32"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
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
              aria-label={`Remove step ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus className="size-4" />
        Add Step
      </Button>

      {form.formState.errors.steps?.root && (
        <p className="text-destructive text-sm">
          {form.formState.errors.steps.root.message}
        </p>
      )}
    </div>
  );
}
