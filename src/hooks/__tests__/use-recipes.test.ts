import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
} from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/handlers';
import {
  useRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useDuplicateRecipe,
} from '@/hooks/use-recipes';
// ─── MSW Server Lifecycle ───
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Query Client Setup ───
let queryClient: QueryClient;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});

describe('useRecipes', () => {
  it('fetches paginated recipes', async () => {
    const { result } = renderHook(() => useRecipes({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.pagination).toBeDefined();
  });

  it('handles fetch error', async () => {
    server.use(
      http.get('/api/recipes', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useRecipes({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server error');
  });
});

describe('useRecipe', () => {
  it('fetches a single recipe by id', async () => {
    const { result } = renderHook(() => useRecipe('recipe-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe('recipe-1');
    expect(result.current.data?.name).toBe('Test Recipe');
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useRecipe(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateRecipe', () => {
  it('creates a recipe and invalidates cache', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'New Recipe',
      description: 'Desc',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'EASY',
      cuisineType: 'Italian',
      visibility: 'PRIVATE',
      ingredients: [{ name: 'Flour', quantity: '2 cups', order: 0 }],
      steps: [{ instruction: 'Mix', stepNumber: 1 }],
      dietaryTagIds: [],
      images: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipes'] });
  });
});

describe('useUpdateRecipe', () => {
  it('updates a recipe and invalidates caches', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'recipe-1',
      data: {
        name: 'Updated Recipe',
        description: 'Updated',
        prepTime: 15,
        cookTime: 25,
        servings: 6,
        difficulty: 'MEDIUM',
        cuisineType: 'Mexican',
        visibility: 'PUBLIC',
        ingredients: [{ name: 'Flour', quantity: '3 cups', order: 0 }],
        steps: [{ instruction: 'Mix well', stepNumber: 1 }],
        dietaryTagIds: [],
        images: [],
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipes'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['recipe', 'recipe-1'],
    });
  });
});

describe('useDeleteRecipe', () => {
  it('deletes a recipe and invalidates cache', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    const { result } = renderHook(() => useDeleteRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('recipe-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipes'] });
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: ['recipe', 'recipe-1'],
    });
  });
});

describe('useDuplicateRecipe', () => {
  it('duplicates a recipe and invalidates cache', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDuplicateRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('recipe-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipes'] });
  });

  it('handles duplication error', async () => {
    server.use(
      http.post('/api/recipes/:id/duplicate', () => {
        return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
      })
    );

    const { result } = renderHook(() => useDuplicateRecipe(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('recipe-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Forbidden');
  });
});
