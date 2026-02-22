import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { UpdateProfileData } from '@/lib/validations/profile';

// ─── Types ───

interface ProfileResponse {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
}

// ─── Fetcher Functions ───

async function updateProfile(
  data: UpdateProfileData
): Promise<ProfileResponse> {
  const res = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json()) as { error?: string };
    throw new Error(errorData.error ?? 'Failed to update profile');
  }
  return res.json() as Promise<ProfileResponse>;
}

// ─── Mutation Hooks ───

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success('Profile updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
