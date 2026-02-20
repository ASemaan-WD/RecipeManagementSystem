import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-muted-foreground text-8xl font-bold">404</p>
      <h1 className="mt-4 mb-2 text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/community">Browse Community</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
