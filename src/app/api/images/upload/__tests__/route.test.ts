import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/images/upload/route';
import { requireAuth } from '@/lib/auth-utils';
import { uploadImageFromFile } from '@/lib/blob-storage';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  apiWriteLimiter: { check: vi.fn() },
  checkRateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/blob-storage', () => ({
  uploadImageFromFile: vi
    .fn()
    .mockResolvedValue(
      'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg'
    ),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockUploadImageFromFile = vi.mocked(uploadImageFromFile);

beforeEach(() => {
  vi.clearAllMocks();
});

function createRequestWithFormData(formData: FormData): NextRequest {
  const req = new NextRequest('http://localhost/api/images/upload', {
    method: 'POST',
  });
  // Override formData() to avoid jsdom multipart parsing issues
  req.formData = () => Promise.resolve(formData);
  return req;
}

describe('POST /api/images/upload', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = createRequestWithFormData(new FormData());
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file provided', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const req = createRequestWithFormData(new FormData());
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No file provided');
  });

  it('returns 400 for invalid file type', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }));

    const req = createRequestWithFormData(formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('File type not allowed');
  });

  it('returns 400 for oversized file', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    // Create a blob larger than 5 MB
    const largeBlob = new Blob([new ArrayBuffer(6 * 1024 * 1024)], {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('file', largeBlob);

    const req = createRequestWithFormData(formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('File too large');
  });

  it('returns blob URL when upload succeeds', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const formData = new FormData();
    formData.append(
      'file',
      new File(['test-image-data'], 'photo.jpg', { type: 'image/jpeg' })
    );

    const req = createRequestWithFormData(formData);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.url).toBe(
      'https://abc123.public.blob.vercel-storage.com/recipes/test.jpg'
    );
    expect(mockUploadImageFromFile).toHaveBeenCalledOnce();
  });
});
