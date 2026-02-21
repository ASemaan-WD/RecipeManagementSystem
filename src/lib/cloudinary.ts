import crypto from 'crypto';

export const CLOUDINARY_FOLDER = 'recipe-management/recipes' as const;

/**
 * Generate a signed upload signature for Cloudinary direct uploads.
 * Returns the signature, timestamp, cloud name, API key, and folder
 * needed by the client-side upload widget.
 *
 * Usage:
 *   const signatureData = generateUploadSignature();
 *   return NextResponse.json(signatureData);
 */
export function generateUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

  const paramsToSign = `folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return { signature, timestamp, cloudName, apiKey, folder: CLOUDINARY_FOLDER };
}

/**
 * Upload an image from a URL to Cloudinary (server-side).
 * Used for AI-generated images that need to be persisted.
 * Returns the Cloudinary secure URL.
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = `folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', CLOUDINARY_FOLDER);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
