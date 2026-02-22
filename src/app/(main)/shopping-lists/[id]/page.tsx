'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Pencil, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingListItems } from '@/components/shopping/shopping-list-items';
import {
  useShoppingList,
  useUpdateShoppingList,
} from '@/hooks/use-shopping-lists';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShoppingListDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: list, isLoading } = useShoppingList(id);
  const updateMutation = useUpdateShoppingList();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  function handleStartEdit() {
    if (list) {
      setEditName(list.name);
      setIsEditing(true);
    }
  }

  function handleSaveName() {
    if (!editName.trim() || !list) return;

    updateMutation.mutate(
      { id: list.id, name: editName.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Shopping list not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/shopping-lists')}
        >
          Back to Lists
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/shopping-lists')}
          aria-label="Back to shopping lists"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="max-w-sm text-lg font-bold"
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label="Edit list name"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSaveName}
              disabled={!editName.trim()}
              aria-label="Save name"
            >
              <Check className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{list.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleStartEdit}
              aria-label="Edit list name"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Shopping List Items */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Items</h2>
        </CardHeader>
        <CardContent>
          <ShoppingListItems listId={list.id} items={list.items} />
        </CardContent>
      </Card>
    </div>
  );
}
