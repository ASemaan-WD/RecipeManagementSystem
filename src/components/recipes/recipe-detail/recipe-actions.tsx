'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Copy, Printer, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DeleteRecipeDialog } from '@/components/recipes/recipe-detail/delete-recipe-dialog';

interface RecipeActionsProps {
  recipeId: string;
  isOwner: boolean;
  recipeName: string;
}

export function RecipeActions({
  recipeId,
  isOwner,
  recipeName,
}: RecipeActionsProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function handleDuplicate() {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? 'Failed to duplicate recipe.');
        return;
      }

      const newRecipe = (await response.json()) as { id: string };
      toast.success('Recipe duplicated successfully!');
      router.push(`/recipes/${newRecipe.id}`);
    } catch {
      toast.error('Failed to duplicate recipe.');
    } finally {
      setIsDuplicating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isOwner && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recipes/${recipeId}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleDuplicate}
          disabled={isDuplicating}
        >
          {isDuplicating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Copy className="size-4" />
          )}
          Duplicate
        </Button>

        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      {isOwner && (
        <DeleteRecipeDialog
          recipeId={recipeId}
          recipeName={recipeName}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
        />
      )}
    </>
  );
}
