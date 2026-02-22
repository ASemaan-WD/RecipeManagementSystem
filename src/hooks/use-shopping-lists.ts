import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Types ───

export interface ShoppingListSummary {
  id: string;
  name: string;
  itemCount: number;
  checkedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  ingredientName: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  order: number;
}

export interface ShoppingListDetail {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Fetcher Functions ───

async function fetchShoppingLists(): Promise<ShoppingListSummary[]> {
  const res = await fetch('/api/shopping-lists');
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch shopping lists');
  }
  return res.json() as Promise<ShoppingListSummary[]>;
}

async function fetchShoppingList(id: string): Promise<ShoppingListDetail> {
  const res = await fetch(`/api/shopping-lists/${id}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to fetch shopping list');
  }
  return res.json() as Promise<ShoppingListDetail>;
}

async function createShoppingList(data: {
  name: string;
  recipeIds?: string[];
}): Promise<ShoppingListDetail> {
  const res = await fetch('/api/shopping-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to create shopping list');
  }
  return res.json() as Promise<ShoppingListDetail>;
}

async function updateShoppingList({
  id,
  name,
}: {
  id: string;
  name: string;
}): Promise<ShoppingListDetail> {
  const res = await fetch(`/api/shopping-lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to update shopping list');
  }
  return res.json() as Promise<ShoppingListDetail>;
}

async function deleteShoppingList(id: string): Promise<void> {
  const res = await fetch(`/api/shopping-lists/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to delete shopping list');
  }
}

async function addItem({
  listId,
  ingredientName,
  quantity,
  category,
}: {
  listId: string;
  ingredientName: string;
  quantity?: string;
  category?: string;
}): Promise<ShoppingListItem> {
  const res = await fetch(`/api/shopping-lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredientName, quantity, category }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to add item');
  }
  return res.json() as Promise<ShoppingListItem>;
}

async function updateItem({
  listId,
  itemId,
  data,
}: {
  listId: string;
  itemId: string;
  data: Partial<{
    checked: boolean;
    quantity: string;
    ingredientName: string;
    category: string;
  }>;
}): Promise<ShoppingListItem> {
  const res = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to update item');
  }
  return res.json() as Promise<ShoppingListItem>;
}

async function deleteItem({
  listId,
  itemId,
}: {
  listId: string;
  itemId: string;
}): Promise<void> {
  const res = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to delete item');
  }
}

async function addRecipeToList({
  listId,
  recipeId,
}: {
  listId: string;
  recipeId: string;
}): Promise<{ items: ShoppingListItem[] }> {
  const res = await fetch(`/api/shopping-lists/${listId}/add-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? 'Failed to add recipe to list');
  }
  return res.json() as Promise<{ items: ShoppingListItem[] }>;
}

// ─── Query Hooks ───

export function useShoppingLists() {
  return useQuery({
    queryKey: ['shopping-lists'],
    queryFn: fetchShoppingLists,
  });
}

export function useShoppingList(id: string) {
  return useQuery({
    queryKey: ['shopping-lists', id],
    queryFn: () => fetchShoppingList(id),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ───

export function useCreateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShoppingList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast.success('Shopping list created!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShoppingList,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({
        queryKey: ['shopping-lists', variables.id],
      });
      toast.success('List updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShoppingList,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.removeQueries({ queryKey: ['shopping-lists', id] });
      toast.success('Shopping list deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addItem,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-lists', variables.listId],
      });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateItem,
    onMutate: async (variables) => {
      // Optimistic update for check toggle
      await queryClient.cancelQueries({
        queryKey: ['shopping-lists', variables.listId],
      });

      const previousData = queryClient.getQueryData<ShoppingListDetail>([
        'shopping-lists',
        variables.listId,
      ]);

      if (previousData) {
        queryClient.setQueryData<ShoppingListDetail>(
          ['shopping-lists', variables.listId],
          {
            ...previousData,
            items: previousData.items.map((item) =>
              item.id === variables.itemId
                ? { ...item, ...variables.data }
                : item
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['shopping-lists', variables.listId],
          context.previousData
        );
      }
      toast.error(error.message);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-lists', variables.listId],
      });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-lists', variables.listId],
      });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAddRecipeToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRecipeToList,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['shopping-lists', variables.listId],
      });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      toast.success('Recipe ingredients added to list!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
