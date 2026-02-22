'use client';

import { useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useUpdateItem,
  useDeleteItem,
  useAddItem,
} from '@/hooks/use-shopping-lists';
import type { ShoppingListItem } from '@/hooks/use-shopping-lists';

interface ShoppingListItemsProps {
  listId: string;
  items: ShoppingListItem[];
}

function groupByCategory(items: ShoppingListItem[]) {
  const groups = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const category = item.category ?? 'Other';
    const existing = groups.get(category) ?? [];
    existing.push(item);
    groups.set(category, existing);
  }
  // Sort groups: checked items to bottom within each group
  for (const [key, groupItems] of groups) {
    groups.set(
      key,
      groupItems.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.order - b.order;
      })
    );
  }
  return groups;
}

export function ShoppingListItems({ listId, items }: ShoppingListItemsProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();
  const addItemMutation = useAddItem();

  const grouped = groupByCategory(items);
  const checkedCount = items.filter((i) => i.checked).length;

  function handleToggle(itemId: string, currentChecked: boolean) {
    updateItemMutation.mutate({
      listId,
      itemId,
      data: { checked: !currentChecked },
    });
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addItemMutation.mutate(
      {
        listId,
        ingredientName: newItemName.trim(),
        quantity: newItemQuantity.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewItemName('');
          setNewItemQuantity('');
        },
      }
    );
  }

  function handleRemoveChecked() {
    const checkedItems = items.filter((i) => i.checked);
    for (const item of checkedItems) {
      deleteItemMutation.mutate({ listId, itemId: item.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <Input
          placeholder="Item name..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
          aria-label="New item name"
        />
        <Input
          placeholder="Qty"
          value={newItemQuantity}
          onChange={(e) => setNewItemQuantity(e.target.value)}
          className="w-24"
          aria-label="New item quantity"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newItemName.trim() || addItemMutation.isPending}
          aria-label="Add item"
        >
          <Plus className="size-4" />
        </Button>
      </form>

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No items yet. Add items above or add from a recipe.
        </p>
      ) : (
        <>
          {[...grouped.entries()].map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {category}
              </h3>
              <ul className="space-y-1">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className="hover:bg-accent/50 flex items-center gap-3 rounded-md px-2 py-1.5"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.checked)
                      }
                      aria-label={`Mark ${item.ingredientName} as ${item.checked ? 'unchecked' : 'checked'}`}
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        item.checked && 'text-muted-foreground line-through'
                      )}
                    >
                      <span className="font-medium">{item.ingredientName}</span>
                      {item.quantity && (
                        <span className="text-muted-foreground">
                          {' '}
                          — {item.quantity}
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                      onClick={() =>
                        deleteItemMutation.mutate({ listId, itemId: item.id })
                      }
                      aria-label={`Delete ${item.ingredientName}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Remove Checked */}
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleRemoveChecked}
              disabled={deleteItemMutation.isPending}
            >
              <Trash2 className="size-3.5" />
              Remove Checked ({checkedCount})
            </Button>
          )}
        </>
      )}
    </div>
  );
}
