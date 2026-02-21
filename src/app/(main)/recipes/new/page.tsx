import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { CreateRecipeForm } from '@/app/(main)/recipes/new/create-recipe-form';

export const metadata: Metadata = {
  title: 'Create New Recipe',
};

export default async function CreateRecipePage() {
  const dietaryTags = await prisma.dietaryTag.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/my-recipes">
            <ChevronLeft className="size-5" />
            <span className="sr-only">Back to My Recipes</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Recipe</h1>
      </div>

      <CreateRecipeForm dietaryTags={dietaryTags} />
    </div>
  );
}
