'use client';

import { ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useSubstitution } from '@/hooks/use-ai';

interface SubstitutionDialogProps {
  ingredientName: string;
  recipeContext?: string;
}

export function SubstitutionDialog({
  ingredientName,
  recipeContext,
}: SubstitutionDialogProps) {
  const { mutate, data, isPending, error, reset } = useSubstitution();

  function handleOpen(open: boolean) {
    if (open && !data) {
      mutate({ ingredient: ingredientName, recipeContext });
    }
    if (!open) {
      reset();
    }
  }

  function handleRetry() {
    mutate({ ingredient: ingredientName, recipeContext });
  }

  return (
    <Dialog onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          title={`Find substitutes for ${ingredientName}`}
        >
          <ArrowRightLeft className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Substitutes for{' '}
            <span className="text-primary">{ingredientName}</span>
          </DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">
              Finding substitutions...
            </span>
          </div>
        )}

        {error && (
          <div className="space-y-2 py-4">
            <p className="text-destructive text-sm">
              {error.message || 'Failed to find substitutions.'}
            </p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        )}

        {data?.substitutions && (
          <div className="space-y-3">
            {data.substitutions.map((sub, i) => (
              <Card key={i}>
                <CardContent className="space-y-1 py-3">
                  <p className="font-medium">{sub.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Ratio: {sub.ratio}
                  </p>
                  <p className="text-muted-foreground text-sm">{sub.notes}</p>
                </CardContent>
              </Card>
            ))}

            <p className="text-muted-foreground text-xs italic">
              AI-generated suggestions. Results may vary.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
