import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecipeCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Badges */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* Time */}
        <Skeleton className="h-3.5 w-24" />

        {/* Rating */}
        <Skeleton className="h-3.5 w-20" />

        {/* Author */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
