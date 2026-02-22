const PRIVATE_BLOB_HOSTNAME = '.private.blob.vercel-storage.com';

/**
 * Convert a private Vercel Blob URL to a proxy URL that can be used in img tags.
 * Public blob URLs and non-blob URLs are returned as-is.
 *
 * This module is intentionally lightweight (no server-side imports) so it can
 * be safely used from both server and client components.
 */
export function getImageSrc(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith(PRIVATE_BLOB_HOSTNAME)) {
      return `/api/images/proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return url;
}
