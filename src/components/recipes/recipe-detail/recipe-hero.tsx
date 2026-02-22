import Image from 'next/image';
import { ChefHat } from 'lucide-react';

import { getImageSrc } from '@/lib/image-url';
import type { RecipeDetail } from '@/types/recipe';

interface RecipeHeroProps {
  images: RecipeDetail['images'];
  recipeName: string;
}

export function RecipeHero({ images, recipeName }: RecipeHeroProps) {
  const heroImage = images.find((img) => img.isPrimary) ?? images[0] ?? null;

  return (
    <div className="relative h-[250px] w-full overflow-hidden rounded-b-xl sm:h-[400px]">
      {heroImage ? (
        <>
          <Image
            src={getImageSrc(heroImage.url)}
            alt={recipeName}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </>
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20">
          <div className="flex flex-col items-center gap-2">
            <ChefHat className="text-muted-foreground/40 size-16" />
            <p className="text-muted-foreground/60 text-sm">{recipeName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
