import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border p-6', className)}>
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-lg" />

      {/* Title */}
      <Skeleton className="h-5 w-3/4" />

      {/* Metadata (prep time, rating) */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}
