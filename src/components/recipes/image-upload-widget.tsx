'use client';

import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from 'next-cloudinary';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ImageUploadWidgetProps {
  onUpload: (result: { url: string; publicId: string }) => void;
  disabled?: boolean;
}

export function ImageUploadWidget({
  onUpload,
  disabled = false,
}: ImageUploadWidgetProps) {
  function handleSuccess(result: CloudinaryUploadWidgetResults) {
    if (typeof result.info === 'string' || !result.info) {
      toast.error('Upload failed: missing image data.');
      return;
    }

    const { secure_url: url, public_id: publicId } = result.info;

    if (!url || !publicId) {
      toast.error('Upload failed: missing image data.');
      return;
    }

    onUpload({ url, publicId });
  }

  return (
    <CldUploadWidget
      signatureEndpoint="/api/images/upload-signature"
      options={{
        maxFiles: 1,
        resourceType: 'image',
        folder: 'recipe-management/recipes',
      }}
      onSuccess={handleSuccess}
      onError={() => toast.error('Image upload failed. Please try again.')}
    >
      {({ open }) => (
        <Button
          type="button"
          variant="outline"
          onClick={() => open()}
          disabled={disabled}
        >
          <Upload className="size-4" />
          Upload
        </Button>
      )}
    </CldUploadWidget>
  );
}
