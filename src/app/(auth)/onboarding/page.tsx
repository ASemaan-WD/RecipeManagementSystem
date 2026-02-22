'use client';

import { useState, useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  usernameSchema,
  usernameFormSchema,
  type UsernameFormData,
} from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const AVAILABILITY_DEBOUNCE_MS = 500;

function OnboardingForm() {
  const { update } = useSession();

  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: '' },
    mode: 'onChange',
  });

  const username = form.watch('username');
  const { errors, isValid } = form.formState;

  // Debounced availability check
  useEffect(() => {
    // Reset availability when value changes
    setIsAvailable(null);

    const validation = usernameSchema.safeParse(username);
    if (!validation.success) {
      setIsCheckingAvailability(false);
      return;
    }

    setIsCheckingAvailability(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/username?username=${encodeURIComponent(username)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          setIsAvailable(null);
          return;
        }

        const data = (await response.json()) as { available: boolean };
        setIsAvailable(data.available);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setIsAvailable(null);
        }
      } finally {
        setIsCheckingAvailability(false);
      }
    }, AVAILABILITY_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      setIsCheckingAvailability(false);
    };
  }, [username]);

  async function onSubmit(data: UsernameFormData) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username }),
      });

      if (response.status === 409) {
        form.setError('username', { message: 'Username is already taken' });
        setIsAvailable(false);
        return;
      }

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        setSubmitError(errorData.error ?? 'Something went wrong');
        return;
      }

      // Refresh the session JWT to include the new username
      await update({ username: data.username });

      // Full navigation so the middleware reads the fresh cookie
      window.location.href = '/dashboard';
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch('/api/auth/username', {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        const data = (await response.json()) as { error?: string };
        setCancelError(data.error ?? 'Failed to sign out. Please try again.');
        return;
      }

      signOut({ callbackUrl: '/login' });
    } catch {
      setCancelError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  }

  const showAvailable =
    !isCheckingAvailability &&
    isAvailable === true &&
    username.length > 0 &&
    !errors.username;

  const showTaken = !isCheckingAvailability && isAvailable === false;

  return (
    <main className="bg-background flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose your username</CardTitle>
          <CardDescription>
            Your username is permanent and cannot be changed later. It will be
            used for sharing recipes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="chef_john" {...field} />
                    </FormControl>
                    <FormDescription>
                      3-20 characters. Letters, numbers, and underscores only.
                    </FormDescription>
                    {isCheckingAvailability && (
                      <p className="text-muted-foreground text-sm">
                        Checking availability...
                      </p>
                    )}
                    {showAvailable && (
                      <p className="text-sm text-green-600">
                        Username is available
                      </p>
                    )}
                    {showTaken && (
                      <p className="text-destructive text-sm">
                        Username is already taken
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !isValid ||
                  isCheckingAvailability ||
                  isAvailable !== true ||
                  isSubmitting ||
                  isCancelling
                }
              >
                {isSubmitting ? 'Setting up...' : 'Continue'}
              </Button>
              {submitError && (
                <p className="text-destructive text-center text-sm">
                  {submitError}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={isCancelling || isSubmitting}
            onClick={handleSignOut}
          >
            {isCancelling ? (
              'Signing out...'
            ) : (
              <>
                <LogOut className="size-4" />
                Sign out
              </>
            )}
          </Button>
          {cancelError && (
            <p className="text-destructive text-center text-sm">
              {cancelError}
            </p>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <SessionProvider>
      <OnboardingForm />
    </SessionProvider>
  );
}
