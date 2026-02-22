import type { Metadata } from 'next';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const RecipeGenerator = dynamic(
  () =>
    import('@/components/ai/recipe-generator').then((m) => m.RecipeGenerator),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'AI Recipe Generator',
  description:
    'Generate creative recipes from your available ingredients using AI.',
};

export default function AIGeneratePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          What&apos;s in your fridge?
        </h1>
        <p className="text-muted-foreground">
          Add your available ingredients and let AI create a recipe for you.
        </p>
      </div>

      <RecipeGenerator />
    </div>
  );
}
