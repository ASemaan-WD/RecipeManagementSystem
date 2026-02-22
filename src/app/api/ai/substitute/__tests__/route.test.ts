import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/ai/substitute/route';
import { requireAuth } from '@/lib/auth-utils';
import { checkRateLimit } from '@/lib/rate-limit';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  substitutionLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(() =>
    Promise.resolve({
      text: JSON.stringify({
        substitutions: [
          { name: 'Greek Yogurt', ratio: '1:1', notes: 'Similar tang' },
          { name: 'Coconut Cream', ratio: '1:1', notes: 'Dairy-free option' },
        ],
      }),
    })
  ),
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

describe('POST /api/ai/substitute', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient: 'butter' }),
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

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient: 'butter' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid body', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredient: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns substitutions for valid request', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredient: 'sour cream',
        recipeContext: 'Making a cake',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.substitutions).toHaveLength(2);
    expect(data.substitutions[0].name).toBe('Greek Yogurt');
  });

  it('returns 400 for missing ingredient field', async () => {
    const session = createMockSession();
    mockRequireAuth.mockResolvedValueOnce(session);
    mockCheckRateLimit.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/ai/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
