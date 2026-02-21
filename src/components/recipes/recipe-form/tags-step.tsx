'use client';

import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { RecipeFormData } from '@/types/recipe';

interface TagsStepProps {
  dietaryTags: { id: string; name: string }[];
}

export function TagsStep({ dietaryTags }: TagsStepProps) {
  const form = useFormContext<RecipeFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dietary Tags</h3>
        <p className="text-muted-foreground text-sm">
          Select any dietary tags that apply to your recipe. This step is
          optional.
        </p>
      </div>

      {dietaryTags.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No dietary tags available.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {dietaryTags.map((tag) => (
            <FormField
              key={tag.id}
              control={form.control}
              name="dietaryTagIds"
              render={({ field }) => {
                const isChecked = field.value?.includes(tag.id) ?? false;

                return (
                  <FormItem>
                    <FormControl>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors',
                          isChecked
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/40'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? [];
                            if (checked) {
                              field.onChange([...current, tag.id]);
                            } else {
                              field.onChange(
                                current.filter((id: string) => id !== tag.id)
                              );
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </label>
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
