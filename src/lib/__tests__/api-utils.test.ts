import { describe, it, expect } from 'vitest';
import { checkContentLength, BODY_LIMITS } from '../api-utils';

function createRequest(contentLength?: string): Request {
  const headers = new Headers();
  if (contentLength !== undefined) {
    headers.set('content-length', contentLength);
  }
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
  });
}

describe('checkContentLength', () => {
  it('returns null when content-length is within the limit', () => {
    const request = createRequest('1024');
    const result = checkContentLength(request, BODY_LIMITS.RECIPE);
    expect(result).toBeNull();
  });

  it('returns null when content-length equals the limit', () => {
    const request = createRequest(String(BODY_LIMITS.RECIPE));
    const result = checkContentLength(request, BODY_LIMITS.RECIPE);
    expect(result).toBeNull();
  });

  it('returns 413 when content-length exceeds the limit', () => {
    const request = createRequest(String(BODY_LIMITS.RECIPE + 1));
    const result = checkContentLength(request, BODY_LIMITS.RECIPE);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(413);
  });

  it('returns null when content-length header is missing', () => {
    const request = createRequest();
    const result = checkContentLength(request, BODY_LIMITS.RECIPE);
    expect(result).toBeNull();
  });

  it('returns 413 for oversized comment payload', () => {
    const request = createRequest(String(BODY_LIMITS.COMMENT + 1));
    const result = checkContentLength(request, BODY_LIMITS.COMMENT);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(413);
  });
});

describe('BODY_LIMITS', () => {
  it('defines expected size limits', () => {
    expect(BODY_LIMITS.RECIPE).toBe(100 * 1024);
    expect(BODY_LIMITS.COMMENT).toBe(10 * 1024);
    expect(BODY_LIMITS.SHOPPING_LIST).toBe(50 * 1024);
    expect(BODY_LIMITS.AI).toBe(10 * 1024);
    expect(BODY_LIMITS.DEFAULT).toBe(50 * 1024);
  });
});
