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
