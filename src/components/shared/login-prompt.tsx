import Link from 'next/link';
import { LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoginPromptProps {
  message?: string;
  variant?: 'overlay' | 'inline';
  className?: string;
}

export function LoginPrompt({
  message = 'Sign in to access the full recipe and all features.',
  variant = 'inline',
  className,
}: LoginPromptProps) {
  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm',
          className
        )}
      >
        <Card className="max-w-sm text-center">
          <CardContent className="space-y-4 pt-6">
            <LogIn className="text-muted-foreground mx-auto size-8" />
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={cn('text-center', className)}>
      <CardContent className="space-y-4 py-8">
        <LogIn className="text-muted-foreground mx-auto size-8" />
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
