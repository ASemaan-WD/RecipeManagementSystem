'use client';

import { useRouter } from 'next/navigation';

import { Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateListDialog } from '@/components/shopping/create-list-dialog';
import {
  useShoppingLists,
  useDeleteShoppingList,
} from '@/hooks/use-shopping-lists';

export default function ShoppingListsPage() {
  const router = useRouter();
  const { data: lists, isLoading } = useShoppingLists();
  const deleteMutation = useDeleteShoppingList();

  function handleDelete(e: React.MouseEvent, listId: string) {
    e.stopPropagation();
    deleteMutation.mutate(listId);
  }

  function handleCreated(listId: string) {
    router.push(`/shopping-lists/${listId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Lists</h1>
          <p className="text-muted-foreground mt-1">
            Manage your grocery shopping lists
          </p>
        </div>
        <CreateListDialog
          trigger={
            <Button className="gap-2">
              <Plus className="size-4" />
              New List
            </Button>
          }
          onCreated={handleCreated}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !lists || lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-lg">
              No shopping lists yet
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Create a list to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/shopping-lists/${list.id}`)}
            >
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <h2 className="line-clamp-1 font-semibold">{list.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground size-8 shrink-0 hover:text-red-500"
                  onClick={(e) => handleDelete(e, list.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Delete ${list.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground space-y-1 text-sm">
                  <p>
                    {list.checkedCount} / {list.itemCount} items checked
                  </p>
                  <p>Updated {new Date(list.updatedAt).toLocaleDateString()}</p>
                </div>
                {list.itemCount > 0 && (
                  <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${(list.checkedCount / list.itemCount) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
