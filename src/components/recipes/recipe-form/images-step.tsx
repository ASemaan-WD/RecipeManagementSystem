'use client';

import { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  Trash2,
  Star,
  Link as LinkIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImageUploadWidget } from '@/components/recipes/image-upload-widget';
import { useGenerateImage } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';
import type { RecipeFormData } from '@/types/recipe';

const MAX_IMAGES = 5;

interface ImagesStepProps {
  recipeId?: string;
}

export function ImagesStep({ recipeId }: ImagesStepProps) {
  const form = useFormContext<RecipeFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'images',
  });
  const [urlInput, setUrlInput] = useState('');
  const generateImage = useGenerateImage();

  function handleAddUrl() {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    try {
      new URL(trimmedUrl);
    } catch {
      return;
    }

    if (fields.length >= MAX_IMAGES) return;

    append({
      url: trimmedUrl,
      source: 'URL',
      isPrimary: fields.length === 0,
      order: fields.length,
    });
    setUrlInput('');
  }

  function handleUpload(result: { url: string; publicId: string }) {
    if (fields.length >= MAX_IMAGES) return;

    append({
      url: result.url,
      source: 'UPLOAD',
      isPrimary: fields.length === 0,
      order: fields.length,
    });
  }

  function handleGenerateAI() {
    if (!recipeId || fields.length >= MAX_IMAGES) return;

    generateImage.mutate(
      { recipeId },
      {
        onSuccess: (data) => {
          append({
            url: data.url,
            source: 'AI_GENERATED',
            isPrimary: fields.length === 0,
            order: fields.length,
          });
        },
      }
    );
  }

  function handleRemove(index: number) {
    const wasPrimary = form.getValues(`images.${index}.isPrimary`);
    remove(index);

    // Re-set order values and handle primary
    const remaining = form.getValues('images');
    remaining.forEach((_, i) => {
      form.setValue(`images.${i}.order`, i);
    });

    // If we removed the primary, make the first image primary
    if (wasPrimary && remaining.length > 0) {
      form.setValue('images.0.isPrimary', true);
    }
  }

  function handleSetPrimary(index: number) {
    const images = form.getValues('images');
    images.forEach((_, i) => {
      form.setValue(`images.${i}.isPrimary`, i === index);
    });
  }

  const isAtLimit = fields.length >= MAX_IMAGES;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Images</h3>
        <p className="text-muted-foreground text-sm">
          Add up to {MAX_IMAGES} images for your recipe. This step is optional.
        </p>
      </div>

      {/* Add image controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Paste image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            disabled={isAtLimit}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddUrl}
            disabled={isAtLimit || !urlInput.trim()}
          >
            <LinkIcon className="size-4" />
            Add
          </Button>
        </div>

        <ImageUploadWidget onUpload={handleUpload} disabled={isAtLimit} />

        {recipeId ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateAI}
            disabled={isAtLimit || generateImage.isPending}
          >
            {generateImage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            AI Generate
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button type="button" variant="outline" disabled>
                  <Sparkles className="size-4" />
                  AI Generate
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Save recipe first to generate AI images
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {isAtLimit && (
        <p className="text-muted-foreground text-sm">
          Maximum of {MAX_IMAGES} images reached.
        </p>
      )}

      {/* Image previews */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {fields.map((field, index) => {
            const isPrimary = form.watch(`images.${index}.isPrimary`);

            return (
              <div
                key={field.id}
                className={cn(
                  'group relative overflow-hidden rounded-lg border',
                  isPrimary && 'ring-primary ring-2'
                )}
              >
                <div className="bg-muted aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.getValues(`images.${index}.url`)}
                    alt={`Recipe image ${index + 1}`}
                    className="size-full object-cover"
                  />
                </div>

                <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:text-yellow-400"
                    onClick={() => handleSetPrimary(index)}
                    aria-label={
                      isPrimary
                        ? 'Primary image'
                        : `Set image ${index + 1} as primary`
                    }
                  >
                    <Star
                      className={cn(
                        'size-4',
                        isPrimary && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white hover:text-red-400"
                    onClick={() => handleRemove(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {isPrimary && (
                  <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-xs font-medium">
                    Primary
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
