'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ImageUploadWidgetProps {
  onUpload: (result: { url: string }) => void;
  disabled?: boolean;
}

export function ImageUploadWidget({
  onUpload,
  disabled = false,
}: ImageUploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('File type not allowed. Use JPEG, PNG, WebP, or GIF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5 MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed');
      }

      const data = (await res.json()) as { url: string };
      onUpload({ url: data.url });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Image upload failed. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {isUploading ? 'Uploading...' : 'Upload'}
      </Button>
    </>
  );
}
