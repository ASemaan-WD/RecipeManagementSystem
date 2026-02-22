import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

const PRIVATE_BLOB_HOSTNAME = '.private.blob.vercel-storage.com';

/**
 * GET /api/images/proxy?url=<blob-url>
 *
 * Proxy route for serving private Vercel Blob images.
 * Validates the URL is a private blob URL, fetches it server-side
 * using the BLOB_READ_WRITE_TOKEN, and streams it to the browser.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Only proxy private blob URLs
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(PRIVATE_BLOB_HOSTNAME)) {
      return NextResponse.json(
        { error: 'Only private blob URLs can be proxied' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const result = await get(url, { access: 'private' });

  if (!result || !result.stream) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
