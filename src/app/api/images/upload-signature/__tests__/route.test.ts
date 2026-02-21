import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from '@/app/api/images/upload-signature/route';
import { requireAuth } from '@/lib/auth-utils';
import { generateUploadSignature } from '@/lib/cloudinary';
import { createMockSession } from '@/test/factories';

vi.mock('@/lib/auth-utils', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/cloudinary', () => ({
  generateUploadSignature: vi.fn(),
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockGenerateUploadSignature = vi.mocked(generateUploadSignature);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/images/upload-signature', () => {
  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns signature data when authenticated', async () => {
    mockRequireAuth.mockResolvedValueOnce(createMockSession());

    const signatureData = {
      signature: 'abc123',
      timestamp: 1234567890,
      cloudName: 'test-cloud',
      apiKey: 'test-api-key',
      folder: 'recipe-management/recipes',
    };
    mockGenerateUploadSignature.mockReturnValueOnce(signatureData);

    const res = await POST();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.signature).toBe('abc123');
    expect(body.timestamp).toBe(1234567890);
    expect(body.cloudName).toBe('test-cloud');
    expect(body.apiKey).toBe('test-api-key');
    expect(body.folder).toBe('recipe-management/recipes');
  });
});
