import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/ai/generate/route';
import { requireAuth } from '@/lib/auth-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  generationLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn(),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toTextStreamResponse: () =>
      new Response('data: {}\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  })),
}));

vi.mock('@/lib/openai', () => ({
  openai: vi.fn(() => 'mock-model'),
  TEXT_MODEL: 'gpt-4o-mini',
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/ai/generate', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['chicken'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(
      NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['chicken'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid body', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns streaming response for valid request', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: ['chicken', 'rice', 'garlic'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
  });

  it('returns 400 for too many ingredients', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const ingredients = Array.from({ length: 21 }, (_, i) => `item-${i}`);

    const req = new NextRequest('http://localhost/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
