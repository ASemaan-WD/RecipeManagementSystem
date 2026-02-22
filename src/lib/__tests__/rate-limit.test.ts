import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRateLimiter,
  checkRateLimit,
  apiWriteLimiter,
  apiReadLimiter,
  searchLimiter,
} from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const limiter = createRateLimiter('test-allow', {
      maxRequests: 3,
      windowMs: 60_000,
    });

    const r1 = limiter.check('user-1');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check('user-1');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check('user-1');
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('rejects requests over the limit', () => {
    const limiter = createRateLimiter('test-reject', {
      maxRequests: 2,
      windowMs: 60_000,
    });

    limiter.check('user-1');
    limiter.check('user-1');

    const r3 = limiter.check('user-1');
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('isolates rate limits per user', () => {
    const limiter = createRateLimiter('test-isolate', {
      maxRequests: 1,
      windowMs: 60_000,
    });

    const r1 = limiter.check('user-1');
    expect(r1.allowed).toBe(true);

    const r2 = limiter.check('user-2');
    expect(r2.allowed).toBe(true);

    const r3 = limiter.check('user-1');
    expect(r3.allowed).toBe(false);
  });

  it('resets after the time window', () => {
    const limiter = createRateLimiter('test-reset', {
      maxRequests: 1,
      windowMs: 60_000,
    });

    limiter.check('user-1');
    const r2 = limiter.check('user-1');
    expect(r2.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60_001);

    const r3 = limiter.check('user-1');
    expect(r3.allowed).toBe(true);
  });

  it('provides a resetAt timestamp', () => {
    const limiter = createRateLimiter('test-resetAt', {
      maxRequests: 1,
      windowMs: 60_000,
    });

    const r1 = limiter.check('user-1');
    expect(r1.resetAt).toBeGreaterThan(Date.now());
  });
});

describe('checkRateLimit', () => {
  it('returns null when allowed', () => {
    const limiter = createRateLimiter('test-check-null', {
      maxRequests: 5,
      windowMs: 60_000,
    });

    const result = checkRateLimit(limiter, 'user-1');
    expect(result).toBeNull();
  });

  it('returns a 429 NextResponse when rate limited', () => {
    const limiter = createRateLimiter('test-check-429', {
      maxRequests: 1,
      windowMs: 60_000,
    });

    limiter.check('user-1');
    const result = checkRateLimit(limiter, 'user-1');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});

describe('apiWriteLimiter', () => {
  it('allows up to 60 requests within 15 minutes', () => {
    // Make 60 requests - all should be allowed
    for (let i = 0; i < 60; i++) {
      const result = apiWriteLimiter.check('write-test-user');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the 61st request', () => {
    for (let i = 0; i < 60; i++) {
      apiWriteLimiter.check('write-block-user');
    }
    const result = apiWriteLimiter.check('write-block-user');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('apiReadLimiter', () => {
  it('allows up to 120 requests within 15 minutes', () => {
    for (let i = 0; i < 120; i++) {
      const result = apiReadLimiter.check('read-test-user');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the 121st request', () => {
    for (let i = 0; i < 120; i++) {
      apiReadLimiter.check('read-block-user');
    }
    const result = apiReadLimiter.check('read-block-user');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('searchLimiter', () => {
  it('allows up to 60 requests within 15 minutes', () => {
    for (let i = 0; i < 60; i++) {
      const result = searchLimiter.check('search-test-user');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the 61st request', () => {
    for (let i = 0; i < 60; i++) {
      searchLimiter.check('search-block-user');
    }
    const result = searchLimiter.check('search-block-user');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
