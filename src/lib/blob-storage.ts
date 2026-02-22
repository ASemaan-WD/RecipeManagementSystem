import { put, del } from '@vercel/blob';
import { nanoid } from 'nanoid';

const BLOB_FOLDER = 'recipes';

/**
 * Upload a file (Buffer or Blob) to Vercel Blob storage.
 * Returns the public blob URL.
 */
export async function uploadImageFromFile(
  file: Blob,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop() ?? 'jpg';
  const pathname = `${BLOB_FOLDER}/${nanoid()}.${ext}`;

  const blob = await put(pathname, file, { access: 'public' });

  return blob.url;
}

/**
 * Upload an image from a URL to Vercel Blob storage (server-side).
 * Used for AI-generated images that need to be persisted.
 * Returns the public blob URL.
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('Failed to fetch image from URL');
  }

  const contentType = response.headers.get('content-type') ?? 'image/png';
  const ext = contentType.split('/').pop()?.split(';')[0] ?? 'png';
  const pathname = `${BLOB_FOLDER}/${nanoid()}.${ext}`;
  const body = await response.blob();

  const blob = await put(pathname, body, {
    access: 'public',
    contentType,
  });

  return blob.url;
}

/**
 * Delete an image from Vercel Blob storage by URL.
 */
export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
