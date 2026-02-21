'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { RecipeDetail } from '@/types/recipe';

interface RecipeImagesProps {
  images: RecipeDetail['images'];
}

export function RecipeImages({ images }: RecipeImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Only render if there are 2+ images
  if (images.length < 2) return null;

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">More Images</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sorted.map((image) => (
            <button
              key={image.id}
              type="button"
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:size-24',
                image.isPrimary
                  ? 'border-primary'
                  : 'hover:border-muted-foreground/40 border-transparent'
              )}
              onClick={() => setSelectedImage(image.url)}
            >
              <Image
                src={image.url}
                alt="Recipe image"
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogTitle className="sr-only">Recipe image</DialogTitle>
          {selectedImage && (
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={selectedImage}
                alt="Recipe image"
                fill
                className="rounded-lg object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
