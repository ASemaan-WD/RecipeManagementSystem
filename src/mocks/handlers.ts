import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  createMockRecipeListItem,
  createMockRecipeDetail,
  createMockPaginatedResponse,
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
