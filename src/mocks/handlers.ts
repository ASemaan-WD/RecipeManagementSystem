import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
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
];

export const server = setupServer(...handlers);
