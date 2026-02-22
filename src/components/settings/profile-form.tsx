'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';

import {
  updateProfileSchema,
  type UpdateProfileData,
} from '@/lib/validations/profile';
import { useUpdateProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ImageUploadWidget } from '@/components/recipes/image-upload-widget';

function getUserInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileForm() {
  const { data: session, update } = useSession();
  const user = session?.user;
  const updateProfile = useUpdateProfile();

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: '',
      image: '',
    },
    mode: 'onTouched',
  });

  // Sync form defaults once session loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? '',
        image: user.image ?? '',
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const currentImage = form.watch('image');

  async function onSubmit(data: UpdateProfileData) {
    updateProfile.mutate(data, {
      onSuccess: async (response) => {
        await update({
          name: response.name,
          image: response.image,
        });
        form.reset({
          name: response.name ?? '',
          image: response.image ?? '',
        });
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your display name and avatar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar section */}
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                {currentImage && (
                  <AvatarImage src={currentImage} alt={user.name ?? 'Avatar'} />
                )}
                <AvatarFallback className="text-lg">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <ImageUploadWidget
                  onUpload={({ url }) => {
                    form.setValue('image', url, { shouldDirty: true });
                  }}
                  disabled={updateProfile.isPending}
                />
                {currentImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.setValue('image', '', { shouldDirty: true });
                    }}
                    disabled={updateProfile.isPending}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Display name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name shown on your recipes and comments.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Read-only fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user.username ?? ''} disabled />
                <p className="text-muted-foreground text-sm">
                  Your username cannot be changed.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email ?? ''} disabled />
              </div>
            </div>

            <Separator />

            <Button
              type="submit"
              disabled={!form.formState.isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
