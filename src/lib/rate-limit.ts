import { NextResponse } from 'next/server';

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiter {
  check(userId: string): RateLimitResult;
}

const globalForRateLimiters = globalThis as unknown as {
  rateLimitStores: Map<string, Map<string, number[]>> | undefined;
};

if (!globalForRateLimiters.rateLimitStores) {
  globalForRateLimiters.rateLimitStores = new Map();
}

/**
 * Create a sliding-window rate limiter backed by an in-memory Map.
 * Each limiter gets its own store keyed by a unique name.
 */
export function createRateLimiter(
  name: string,
  config: RateLimitConfig
): RateLimiter {
  const stores = globalForRateLimiters.rateLimitStores!;
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  const store = stores.get(name)!;

  return {
    check(userId: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get or initialize timestamps for this user
      const timestamps = store.get(userId) ?? [];

      // Remove expired timestamps
      const valid = timestamps.filter((ts) => ts > windowStart);

      const remaining = Math.max(0, config.maxRequests - valid.length);
      const resetAt =
        valid.length > 0 ? valid[0]! + config.windowMs : now + config.windowMs;

      if (valid.length >= config.maxRequests) {
        store.set(userId, valid);
        return { allowed: false, remaining: 0, resetAt };
      }

      valid.push(now);
      store.set(userId, valid);

      return { allowed: true, remaining: remaining - 1, resetAt };
    },
  };
}

const ONE_HOUR = 60 * 60 * 1000;

/** 20 requests per hour for recipe generation */
export const generationLimiter = createRateLimiter('generation', {
  maxRequests: 20,
  windowMs: ONE_HOUR,
});

/** 50 requests per hour for ingredient substitution */
export const substitutionLimiter = createRateLimiter('substitution', {
  maxRequests: 50,
  windowMs: ONE_HOUR,
});

/** 30 requests per hour for nutrition estimation */
export const nutritionLimiter = createRateLimiter('nutrition', {
  maxRequests: 30,
  windowMs: ONE_HOUR,
});

/** 10 requests per hour for DALL-E image generation */
export const imageLimiter = createRateLimiter('image', {
  maxRequests: 10,
  windowMs: ONE_HOUR,
});

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** 60 POST/PUT/DELETE requests per 15 minutes per user */
export const apiWriteLimiter = createRateLimiter('api-write', {
  maxRequests: 60,
  windowMs: FIFTEEN_MINUTES,
});

/** 120 GET requests per 15 minutes per user */
export const apiReadLimiter = createRateLimiter('api-read', {
  maxRequests: 120,
  windowMs: FIFTEEN_MINUTES,
});

/** 60 search requests per 15 minutes per user */
export const searchLimiter = createRateLimiter('search', {
  maxRequests: 60,
  windowMs: FIFTEEN_MINUTES,
});

/**
 * Check rate limit and return a 429 response if exceeded, or null if allowed.
 */
export function checkRateLimit(
  limiter: RateLimiter,
  userId: string
): NextResponse | null {
  const result = limiter.check(userId);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        resetAt: new Date(result.resetAt).toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null;
}
