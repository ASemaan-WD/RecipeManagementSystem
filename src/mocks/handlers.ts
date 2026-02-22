import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  createMockRecipeListItem,
  createMockRecipeDetail,
  createMockPaginatedResponse,
  createMockComment,
  createMockRating,
  createMockRecipeShare,
  createMockShareLink,
  createMockShoppingListSummary,
  createMockShoppingListDetail,
} from '@/test/factories';

export const handlers = [
  // ─── Auth Handlers ───

  http.get('/api/auth/username', ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return HttpResponse.json(
        { error: 'Username query parameter is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ available: true });
  }),

  http.post('/api/auth/username', async ({ request }) => {
    const body = (await request.json()) as { username?: string };

    if (!body.username) {
      return HttpResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    return HttpResponse.json({ username: body.username });
  }),

  http.delete('/api/auth/username', () => {
    return HttpResponse.json({ success: true });
  }),

  // ─── Recipe Handlers ───

  http.get('/api/recipes', () => {
    const recipes = [
      createMockRecipeListItem(),
      createMockRecipeListItem({ id: 'recipe-2', name: 'Second Recipe' }),
    ];
    return HttpResponse.json(createMockPaginatedResponse(recipes));
  }),

  http.post('/api/recipes', async () => {
    return HttpResponse.json(createMockRecipeDetail(), { status: 201 });
  }),

  http.get('/api/recipes/:id', () => {
    return HttpResponse.json(createMockRecipeDetail());
  }),

  http.put('/api/recipes/:id', async () => {
    return HttpResponse.json(createMockRecipeDetail());
  }),

  http.delete('/api/recipes/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/recipes/:id/duplicate', () => {
    return HttpResponse.json(
      createMockRecipeDetail({ id: 'recipe-copy', name: 'Test Recipe (Copy)' }),
      { status: 201 }
    );
  }),

  // ─── Search Handlers ───

  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const recipes = q
      ? [createMockRecipeListItem({ name: `Result for "${q}"` })]
      : [createMockRecipeListItem()];
    return HttpResponse.json(createMockPaginatedResponse(recipes));
  }),

  http.get('/api/search/cuisines', () => {
    return HttpResponse.json([
      { cuisineType: 'Italian', _count: { id: 5 } },
      { cuisineType: 'Mexican', _count: { id: 3 } },
      { cuisineType: 'Japanese', _count: { id: 2 } },
    ]);
  }),

  http.get('/api/search/dietary-tags', () => {
    return HttpResponse.json([
      { id: 'dt-1', name: 'Vegetarian' },
      { id: 'dt-2', name: 'Vegan' },
      { id: 'dt-3', name: 'Gluten-Free' },
    ]);
  }),

  // ─── Tag & Save Handlers ───

  http.post('/api/recipes/:id/tags', () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.delete('/api/recipes/:id/tags', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/recipes/:id/save', () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.delete('/api/recipes/:id/save', () => {
    return HttpResponse.json({ success: true });
  }),

  // ─── Collections Handler ───

  http.get('/api/collections', () => {
    return HttpResponse.json({
      favorites: [createMockRecipeListItem()],
      toTry: [],
      madeBefore: [],
      saved: [],
    });
  }),

  // ─── Sharing Handlers ───

  http.get('/api/recipes/:id/shares', () => {
    return HttpResponse.json({
      shares: [createMockRecipeShare()],
      shareLink: createMockShareLink(),
    });
  }),

  http.post('/api/recipes/:id/shares', () => {
    return HttpResponse.json(createMockRecipeShare(), { status: 201 });
  }),

  http.delete('/api/recipes/:id/shares', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/recipes/:id/share-link', () => {
    return HttpResponse.json(createMockShareLink(), { status: 201 });
  }),

  http.delete('/api/recipes/:id/share-link', () => {
    return HttpResponse.json({ success: true });
  }),

  http.put('/api/recipes/:id/visibility', () => {
    return HttpResponse.json({ visibility: 'PUBLIC' });
  }),

  http.get('/api/share/:token', () => {
    return HttpResponse.json(createMockRecipeDetail());
  }),

  http.get('/api/recipes/shared-with-me', () => {
    return HttpResponse.json(
      createMockPaginatedResponse([createMockRecipeListItem()])
    );
  }),

  // ─── Social Handlers ───

  http.get('/api/recipes/:id/ratings', () => {
    return HttpResponse.json({
      avgRating: 4.5,
      ratingCount: 12,
      userRating: null,
    });
  }),

  http.post('/api/recipes/:id/ratings', async ({ request }) => {
    const body = (await request.json()) as { value: number };
    return HttpResponse.json(createMockRating({ value: body.value }), {
      status: 201,
    });
  }),

  http.get('/api/recipes/:id/comments', () => {
    return HttpResponse.json({
      data: [createMockComment()],
      pagination: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });
  }),

  http.post('/api/recipes/:id/comments', async ({ request }) => {
    const body = (await request.json()) as { content: string };
    return HttpResponse.json(createMockComment({ content: body.content }), {
      status: 201,
    });
  }),

  http.put('/api/comments/:id', async ({ request }) => {
    const body = (await request.json()) as { content: string };
    return HttpResponse.json(createMockComment({ content: body.content }));
  }),

  http.delete('/api/comments/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // ─── User Search Handler ───

  http.get('/api/users/search', () => {
    return HttpResponse.json([
      { id: 'user-2', name: 'Other User', username: 'otheruser', image: null },
    ]);
  }),

  // ─── AI Handlers ───

  http.post('/api/ai/generate', () => {
    return new HttpResponse(
      JSON.stringify({ name: 'AI Recipe', description: 'Generated recipe' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  http.post('/api/ai/substitute', () => {
    return HttpResponse.json({
      substitutions: [
        {
          original: 'Butter',
          substitute: 'Coconut oil',
          notes: 'Use same amount',
        },
      ],
    });
  }),

  http.post('/api/ai/nutrition/:recipeId', () => {
    return HttpResponse.json({
      nutritionData: {
        calories: 350,
        protein: '15g',
        carbs: '45g',
        fat: '12g',
      },
    });
  }),

  http.post('/api/ai/generate-image/:recipeId', () => {
    return HttpResponse.json({
      imageUrl: 'https://example.com/generated-image.jpg',
    });
  }),

  // ─── Shopping List Handlers ───

  http.get('/api/shopping-lists', () => {
    return HttpResponse.json([createMockShoppingListSummary()]);
  }),

  http.post('/api/shopping-lists', async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(
      createMockShoppingListDetail({ name: body.name }),
      { status: 201 }
    );
  }),

  http.get('/api/shopping-lists/:id', () => {
    return HttpResponse.json(createMockShoppingListDetail());
  }),

  http.put('/api/shopping-lists/:id', async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(createMockShoppingListDetail({ name: body.name }));
  }),

  http.delete('/api/shopping-lists/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/shopping-lists/:id/items', async ({ request }) => {
    const body = (await request.json()) as {
      ingredientName: string;
      quantity?: string;
    };
    return HttpResponse.json(
      {
        id: 'item-new',
        shoppingListId: 'list-1',
        ingredientName: body.ingredientName,
        quantity: body.quantity ?? null,
        category: 'Other',
        checked: false,
        order: 0,
      },
      { status: 201 }
    );
  }),

  http.put('/api/shopping-lists/:id/items/:itemId', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: 'item-1',
      shoppingListId: 'list-1',
      ingredientName: 'Flour',
      quantity: '2 cups',
      category: 'Baking',
      checked: false,
      order: 0,
      ...body,
    });
  }),

  http.delete('/api/shopping-lists/:id/items/:itemId', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/shopping-lists/:id/add-recipe', () => {
    return HttpResponse.json(createMockShoppingListDetail());
  }),

  // ─── Image Handlers ───

  http.delete('/api/images/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/images/upload-signature', () => {
    return HttpResponse.json({
      signature: 'test-signature',
      timestamp: 1234567890,
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      folder: 'recipe-management/recipes',
    });
  }),
];

export const server = setupServer(...handlers);
