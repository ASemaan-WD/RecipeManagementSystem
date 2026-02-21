import type { Metadata } from 'next';

import { RecipeGenerator } from '@/components/ai/recipe-generator';

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
