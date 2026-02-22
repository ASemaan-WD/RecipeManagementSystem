import { NextResponse } from 'next/server';

/** Maximum request body sizes by resource type (in bytes) */
export const BODY_LIMITS = {
  RECIPE: 100 * 1024, // 100KB
  COMMENT: 10 * 1024, // 10KB
  SHOPPING_LIST: 50 * 1024, // 50KB
  AI: 10 * 1024, // 10KB
  DEFAULT: 50 * 1024, // 50KB
} as const;

/**
 * Validate that the request Content-Type is application/json.
 * Returns a 415 NextResponse if invalid, or null if valid.
 */
export function validateContentType(request: Request): NextResponse | null {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 }
    );
  }
  return null;
}

/**
 * Check the Content-Length header and reject oversized payloads.
 * Returns a 413 response if the body exceeds maxBytes, or null if acceptable.
 * If Content-Length is missing, allows the request (streaming/chunked bodies).
 */
export function checkContentLength(
  request: Request,
  maxBytes: number
): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  return null;
}
