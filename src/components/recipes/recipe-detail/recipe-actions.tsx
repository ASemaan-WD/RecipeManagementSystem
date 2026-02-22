'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Pencil,
  Trash2,
  Copy,
  Printer,
  Loader2,
  Share2,
  ImagePlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DeleteRecipeDialog } from '@/components/recipes/recipe-detail/delete-recipe-dialog';
import { ShareDialog } from '@/components/social/share-dialog';
import { useGenerateImage } from '@/hooks/use-ai';

type Visibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

interface RecipeActionsProps {
  recipeId: string;
  isOwner: boolean;
  recipeName: string;
  currentVisibility?: Visibility;
  hasImage?: boolean;
}

export function RecipeActions({
  recipeId,
  isOwner,
  recipeName,
  currentVisibility = 'PRIVATE',
  hasImage = true,
}: RecipeActionsProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const generateImage = useGenerateImage();

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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="size-4" />
            Share
          </Button>
        </>
      )}

      {isOwner && !hasImage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            generateImage.mutate(
              { recipeId },
              { onSuccess: () => router.refresh() }
            )
          }
          disabled={generateImage.isPending}
        >
          {generateImage.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          Generate Image
        </Button>
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

      {isOwner && (
        <>
          <DeleteRecipeDialog
            recipeId={recipeId}
            recipeName={recipeName}
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
          />
          <ShareDialog
            recipeId={recipeId}
            currentVisibility={currentVisibility}
            open={isShareOpen}
            onOpenChange={setIsShareOpen}
          />
        </>
      )}
    </>
  );
}
