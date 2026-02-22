'use client';

import { useState } from 'react';

import { ShoppingCart, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useShoppingLists,
  useAddRecipeToList,
  useCreateShoppingList,
} from '@/hooks/use-shopping-lists';

interface AddToListButtonProps {
  recipeId: string;
  recipeName: string;
}

export function AddToListButton({
  recipeId,
  recipeName,
}: AddToListButtonProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const { data: lists } = useShoppingLists();
  const addRecipeMutation = useAddRecipeToList();
  const createMutation = useCreateShoppingList();

  function handleAddToList(listId: string) {
    addRecipeMutation.mutate({ listId, recipeId });
  }

  function handleCreateAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;

    createMutation.mutate(
      { name: newListName.trim(), recipeIds: [recipeId] },
      {
        onSuccess: () => {
          setNewListName('');
          setCreateOpen(false);
        },
      }
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={addRecipeMutation.isPending}
            aria-label={`Add ${recipeName} to shopping list`}
          >
            <ShoppingCart className="size-4" />
            Add to List
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {lists && lists.length > 0 ? (
            <>
              {lists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => handleAddToList(list.id)}
                >
                  {list.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create New List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shopping List</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAndAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-list-name">List Name</Label>
              <Input
                id="new-list-name"
                placeholder="e.g., Weekly Groceries"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={200}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Ingredients from &ldquo;{recipeName}&rdquo; will be added
              automatically.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newListName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create & Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
